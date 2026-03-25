import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { accessToken, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 1. Initialize Auth State
  useEffect(() => {
    const initialize = async () => {
      await loadFromStorage();
      setIsReady(true);
    };
    initialize();
  }, []);

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

  // 3. Loading State (Prevents flicker during hydration)
  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
      <Stack.Screen name="(app)" options={{ animation: "fade" }} />
    </Stack>
  );
}
