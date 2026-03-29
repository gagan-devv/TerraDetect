import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform, Appearance } from "react-native";

// Use AsyncStorage for web, SecureStore for native (following authStore pattern)
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

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => void;
  initializeTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = "@terradetect:theme";

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",

  setMode: async (mode: ThemeMode) => {
    try {
      await storage.setItem(THEME_STORAGE_KEY, mode);
      set({ mode });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      // Still update in-memory state even if persistence fails
      set({ mode });
    }
  },

  toggleMode: () => {
    const { mode } = get();
    const newMode: ThemeMode = mode === "light" ? "dark" : "light";
    get().setMode(newMode);
  },

  initializeTheme: async () => {
    try {
      const storedMode = await storage.getItem(THEME_STORAGE_KEY);
      if (storedMode === "light" || storedMode === "dark") {
        set({ mode: storedMode });
      } else {
        // No stored preference - respect system theme on first launch
        const systemTheme = Appearance.getColorScheme();
        const initialMode: ThemeMode = systemTheme === "dark" ? "dark" : "light";
        set({ mode: initialMode });
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
      // Keep default "light" theme on error
    }
  },
}));
