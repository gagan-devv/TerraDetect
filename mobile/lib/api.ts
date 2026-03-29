/* eslint-disable */
import { useAuthStore } from "../store/authStore";
import type { SensorReading } from "../store/sensorStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  username: string;
  email: string;
  device_id: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  ph: number;
  N: number;
  P: number;
  K: number;
  rainfall: number;
  timestamp: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface SensorHistoryResponse {
  history: SensorReading[];
  pagination: Pagination;
}

export interface CropResult {
  recommended_crop: string;
  confidence: number;
}

export interface FertilizerResult {
  fertilizer: string;
  composition: string;
  application: string;
  nitrogen_advice?: string;
  phosphorus_advice?: string;
  potassium_advice?: string;
}

export interface SuitabilityResponse {
  crop: string;
  suitability_score: number;
  table: {
    parameter: string;
    recommended: number;
    observed: number;
    status: "optimal" | "low" | "high";
    remarks: string;
  }[];
  recommendations: string[];
}

// ── Core Request Helper ──────────────────────────────────────────────────────

// Simple helpers
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function isNetworkAvailable(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return true; // assume online if NetInfo not available
  }
}

type OutboxItem = {
  id: string;
  path: string;
  opts: RequestInit;
  token?: string | null;
  tries: number;
  createdAt: number;
};

const OUTBOX_KEY = "api_outbox_v1";
const CACHE_PREFIX = "api_cache_v1:";

async function enqueueOutbox(item: OutboxItem) {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const arr: OutboxItem[] = raw ? JSON.parse(raw) : [];
    arr.push(item);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to enqueue outbox item", e);
  }
}

async function replayOutbox() {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const arr: OutboxItem[] = raw ? JSON.parse(raw) : [];
    if (!arr.length) return;

    const remaining: OutboxItem[] = [];
    for (const item of arr) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(item.opts.headers as Record<string, string> | undefined),
        };
        if (item.token) headers["Authorization"] = `Bearer ${item.token}`;

        const res = await fetch(`${BASE}${item.path}`, {
          ...item.opts,
          headers,
        });
        if (!res.ok) {
          item.tries = (item.tries || 0) + 1;
          if (item.tries < 5) remaining.push(item);
        }
      } catch {
        item.tries = (item.tries || 0) + 1;
        if (item.tries < 5) remaining.push(item);
      }
    }
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.warn("Failed replaying outbox", e);
  }
}

// Start a NetInfo listener to replay when online
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    void replayOutbox();
  }
});

async function request<T>(
  path: string,
  opts: RequestInit = {},
  token?: string | null,
  isRetry = false,
): Promise<T> {
  const method = (opts.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const cacheKey = `${CACHE_PREFIX}${path}`;
  const maxRetries = 3;
  let attempt = 0;

  while (true) {
    attempt++;
    try {
      const res = await fetch(`${BASE}${path}`, { ...opts, headers });

      // Handle auth refresh
      if (res.status === 401 && token && !isRetry) {
        const store = useAuthStore.getState();
        try {
          const refreshed = await request<{ access_token: string }>(
            "/api/v1/auth/refresh",
            {
              method: "POST",
              body: JSON.stringify({ refresh_token: store.refreshToken }),
            },
          );
          useAuthStore.setState({ accessToken: refreshed.access_token });
          return request<T>(path, opts, refreshed.access_token, true);
        } catch (refreshErr: unknown) {
          await store.logout();
          const symptom = new Error("Session expired. Please log in again.");
          (symptom as unknown as Record<string, unknown>).cause = refreshErr;
          // eslint-disable-next-line preserve-caught-error, sonarjs/preserve-caught-error
          throw symptom;
        }
      }

      // Parse JSON safely
      let json: unknown = undefined;
      try {
        json = await res.json();
      } catch {
        json = undefined;
      }

      if (!res.ok) {
        // For server errors, attempt retry with backoff
        if (res.status >= 500 && attempt <= maxRetries) {
          await sleep(200 * attempt);
          continue;
        }
        // Try to extract nested error message if present (safe checks)
        let nestedMessage: string | undefined = undefined;
        if (json && typeof json === "object") {
          const obj = json as Record<string, unknown>;
          const errField = obj["error"];
          if (errField && typeof errField === "object") {
            const errObj = errField as Record<string, unknown>;
            const msg = errObj["message"];
            if (typeof msg === "string") nestedMessage = msg;
          }
        }
        throw new Error(nestedMessage ?? `Error ${res.status}`);
      }

      // Successful GET -> cache response
      if (method === "GET") {
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(json));
        } catch (e) {
          console.warn("Failed to cache response", e);
        }
      }

      return json as T;
    } catch (err: unknown) {
      const online = await isNetworkAvailable();
      // If offline and GET, return cached value if available
      if (!online) {
        if (method === "GET") {
          try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached) as T;
          } catch (e) {
            console.warn("Failed to read cache", e);
          }
        }

        // For non-GET (mutating) requests, enqueue and inform caller
        if (method !== "GET") {
          const outItem: OutboxItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            path,
            opts,
            token,
            tries: 0,
            createdAt: Date.now(),
          };
          await enqueueOutbox(outItem);
          // preserve original error as cause (wrap non-Error values)
          {
            const symptom = new Error(
              "Offline — request queued and will be sent when online.",
            );
            (symptom as unknown as Record<string, unknown>).cause = err;
            // eslint-disable-next-line preserve-caught-error, sonarjs/preserve-caught-error
            throw symptom;
          }
        }

        // If GET and no cache, fall through to retry/backoff
      }

      // If transient network error, retry with exponential backoff
      if (attempt <= maxRetries) {
        await sleep(200 * attempt);
        continue;
      }

      // Final failure: if GET try cache one last time
      if (method === "GET") {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) return JSON.parse(cached) as T;
        } catch (e) {
          console.warn("Failed to read cache", e);
        }
      }

      if (err instanceof Error) throw err;
      {
        const symptom = new Error(String(err));
        (symptom as unknown as Record<string, unknown>).cause = err;
        // eslint-disable-next-line preserve-caught-error, sonarjs/preserve-caught-error
        throw symptom;
      }
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const api = {
  login: (body: object) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: object) =>
    request<void>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  latestSensor: (token: string) =>
    request<SensorData>("/api/v1/sensor/latest", {}, token),
  sensorHistory: (token: string, page: number, perPage: number) =>
    request<SensorHistoryResponse>(
      `/api/v1/sensor/history?page=${page}&per_page=${perPage}`,
      {},
      token,
    ),
  predictCrop: (token: string, body: object) =>
    request<CropResult>(
      "/api/v1/predict/crop",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  // Guest/anonymous prediction API (no auth token required)
  guestPredictCrop: (body: object) =>
    request<CropResult>(
      "/api/v1/predict/crop",
      { method: "POST", body: JSON.stringify(body) },
      undefined,
    ),
  predictFertilizer: (token: string, body: object) =>
    request<FertilizerResult>(
      "/api/v1/predict/fertilizer",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  predictSuitability: (token: string, body: object) =>
    request<SuitabilityResponse>(
      "/api/v1/predict/suitability",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  logout: (refreshToken: string) =>
    request<void>(
      "/api/v1/auth/logout",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      null,
    ),
};
