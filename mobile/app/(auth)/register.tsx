import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    deviceId: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      return Alert.alert(
        "Error",
        "Username, Email, and Password are required.",
      );
    }

    setLoading(true);
    try {
      // Calling your Go backend via the api.ts utility
      await api.register({
        username: form.username,
        email: form.email,
        password: form.password,
        device_id: form.deviceId,
      });

      // Navigate to the success screen instead of a blocking alert
      router.push("/(auth)/register-success");
    } catch (err: any) {
      // Fallback to error message from your Gin middleware/handlers
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-8 pt-20">
      <Text className="text-3xl font-bold text-green-700 mb-2">
        Create Account
      </Text>
      <Text className="text-gray-500 mb-8">
        Join TerraDetect to start monitoring your soil.
      </Text>

      <View className="space-y-4">
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800"
          placeholder="Username"
          value={form.username}
          onChangeText={(val) => setForm({ ...form, username: val })}
        />
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(val) => setForm({ ...form, email: val })}
        />
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800"
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(val) => setForm({ ...form, password: val })}
        />
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 border-2 border-green-50"
          placeholder="Device ID (Optional)"
          value={form.deviceId}
          onChangeText={(val) => setForm({ ...form, deviceId: val })}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className={`p-4 mt-4 rounded-xl items-center ${loading ? "bg-green-300" : "bg-green-600"}`}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? "Creating Account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          className="py-4"
        >
          <Text className="text-center text-gray-600">
            Already have an account?{" "}
            <Text className="text-green-700 font-bold">Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
