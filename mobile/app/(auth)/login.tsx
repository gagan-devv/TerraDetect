import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const loginToStore = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please fill in all fields");

    setLoading(true);
    try {
      const data = await api.login({ email, password });

      // Your Go backend returns { access_token, refresh_token, user: { username, device_id } }
      await loginToStore(
        { accessToken: data.access_token, refreshToken: data.refresh_token },
        { username: data.user.username, deviceId: data.user.device_id },
      );

      router.replace("/(app)/dashboard");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <Text className="text-3xl font-bold text-green-700 mb-8 text-center">
        TerraDetect
      </Text>

      <View className="space-y-4">
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`p-4 rounded-xl items-center ${loading ? "bg-green-300" : "bg-green-600"}`}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? "Authenticating..." : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
