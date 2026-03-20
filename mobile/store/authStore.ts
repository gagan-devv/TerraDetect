import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  deviceId: string | null;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: { username: string; deviceId: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  username: null,
  deviceId: null,

  login: async ({ accessToken, refreshToken }, { username, deviceId }) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    set({ accessToken, refreshToken, username, deviceId });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({
      accessToken: null,
      refreshToken: null,
      username: null,
      deviceId: null,
    });
  },

  loadFromStorage: async () => {
    const accessToken = await SecureStore.getItemAsync("access_token");
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    if (accessToken) set({ accessToken, refreshToken });
  },
}));