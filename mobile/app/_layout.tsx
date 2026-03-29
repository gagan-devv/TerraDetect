import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../global.css";

export default function RootLayout() {
  const { accessToken, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    // Manrope for headlines and display text
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    // Inter for body text and labels
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // 1. Initialize Auth State and wait for fonts
  useEffect(() => {
    const initialize = async () => {
      await loadFromStorage();
      // Wait for fonts to load before marking as ready
      if (fontsLoaded) {
        setIsReady(true);
      }
    };
    initialize();
  }, [fontsLoaded]);

  // 2. Auth Guard Logic
  useEffect(() => {
    if (!isReady) return;

    const inAppGroup = segments[0] === "(app)";

    if (!accessToken && inAppGroup) {
      // If user is not logged in and tries to access (app) folder
      router.replace("/(auth)/landing");
    } else if (accessToken && !inAppGroup) {
      // If user is logged in and tries to access (auth) folder
      router.replace("/(app)/dashboard");
    }
  }, [accessToken, segments, isReady]);

  // 3. Loading State (Prevents flicker during hydration and font loading)
  if (!isReady || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <ActivityIndicator size="large" color="#006b2c" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(app)" options={{ animation: "fade" }} />
      </Stack>
    </ThemeProvider>
  );
}
