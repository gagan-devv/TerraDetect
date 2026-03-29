import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";
import { Platform } from "react-native";

// Use AsyncStorage for web, SecureStore for native
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  deviceId: string | null;
  accessExpiry?: number | null;

  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: { username: string; deviceId: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  username: null,
  deviceId: null,

  login: async ({ accessToken, refreshToken }, { username, deviceId }) => {
    await storage.setItem("access_token", accessToken);
    await storage.setItem("refresh_token", refreshToken);
    await storage.setItem("username", username);
    await storage.setItem("device_id", deviceId);
    // Try to parse expiry from JWT (exp claim)
    let accessExpiry: number | null = null;
    try {
      const parts = accessToken.split(".");
      if (parts.length === 3) {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          Array.prototype.map
            .call(
              atob(b64),
              (c: string) =>
                "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
            )
            .join(""),
        );
        const obj = JSON.parse(json);
        if (typeof obj.exp === "number") accessExpiry = obj.exp * 1000;
      }
    } catch (e) {
      console.debug("Failed to parse access token expiry", e);
    }

    if (accessExpiry)
      await storage.setItem("access_expiry", String(accessExpiry));
    await storage.setItem("access_token", accessToken);
    set({ accessToken, refreshToken, username, deviceId, accessExpiry });
  },

  logout: async () => {
    // Attempt to revoke refresh token on the server
    try {
      const refreshToken = await storage.getItem("refresh_token");
      if (refreshToken) await api.logout(refreshToken);
    } catch (e) {
      // best-effort revoke; ignore errors
      console.warn("Failed to revoke refresh token", e);
    }

    await storage.removeItem("access_token");
    await storage.removeItem("refresh_token");
    await storage.removeItem("username");
    await storage.removeItem("device_id");
    await storage.removeItem("access_expiry");
    set({
      accessToken: null,
      refreshToken: null,
      username: null,
      deviceId: null,
      accessExpiry: null,
    });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  loadFromStorage: async () => {
    const accessToken = await storage.getItem("access_token");
    const refreshToken = await storage.getItem("refresh_token");
    const username = await storage.getItem("username");
    const deviceId = await storage.getItem("device_id");
    const accessExpiryRaw = await storage.getItem("access_expiry");
    const accessExpiry = accessExpiryRaw ? Number(accessExpiryRaw) : null;
    if (accessToken) {
      set({ accessToken, refreshToken, username, deviceId, accessExpiry });
    }
  },
}));
