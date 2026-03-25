import { useAuthStore } from "../store/authStore";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Core request helper ───────────────────────────────────────────────────────

async function request<T = any>(
  path: string,
  opts: RequestInit = {},
  token?: string | null,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  // Auto-refresh on 401 — only retry once
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
      // Update store with new access token
      store.setAccessToken(refreshed.access_token);
      // Retry original request with fresh token
      return request<T>(path, opts, refreshed.access_token, true);
    } catch {
      await store.logout();
      throw new Error("Session expired. Please log in again.");
    }
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as T;
}

// ── Public API surface ────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (body: { username: string; password: string; device_id: string }) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: { username: string; password: string; device_id: string }) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  refresh: (refreshToken: string) =>
    request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (token: string, refreshToken: string) =>
    request(
      "/api/v1/auth/logout",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      token,
    ),

  checkDevice: (device_id: string) =>
    request("/api/v1/device/check", {
      method: "POST",
      body: JSON.stringify({ device_id }),
    }),

  // Sensor
  latestSensor: (token: string) => request("/api/v1/sensor/latest", {}, token),

  sensorHistory: (token: string, page = 1, perPage = 20) =>
    request(
      `/api/v1/sensor/history?page=${page}&per_page=${perPage}`,
      {},
      token,
    ),

  // Predictions
  predictCrop: (
    token: string,
    body: {
      source: "manual" | "sensor";
      N?: number;
      P?: number;
      K?: number;
      temperature?: number;
      humidity?: number;
      ph?: number;
      rainfall: number;
    },
  ) =>
    request(
      "/api/v1/predict/crop",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  predictSuitability: (
    token: string,
    body: {
      source: "manual" | "sensor";
      crop_name: string;
      N?: number;
      P?: number;
      K?: number;
      temperature?: number;
      humidity?: number;
      ph?: number;
      rainfall: number;
    },
  ) =>
    request(
      "/api/v1/predict/suitability",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  predictFertilizer: (
    token: string,
    body: {
      source: "manual" | "sensor";
      crop_name?: string;
      soil_type?: string;
      N?: number;
      P?: number;
      K?: number;
      temperature?: number;
      humidity?: number;
      ph?: number;
      moisture?: number;
      rainfall: number;
    },
  ) =>
    request(
      "/api/v1/predict/fertilizer",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  // Weather
  weather: (token: string, lat: number, lon: number) =>
    request(`/api/v1/weather?lat=${lat}&lon=${lon}`, {}, token),
};
