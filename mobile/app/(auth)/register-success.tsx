import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterSuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center px-10">
      <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-6">
        <Text className="text-white text-3xl font-bold">✓</Text>
      </View>

      <Text className="text-3xl font-bold text-gray-900 text-center">
        You're all set!
      </Text>
      <Text className="text-gray-500 text-center mt-4 text-lg">
        Your account has been created. You can now log in to connect your
        sensors and analyze your soil.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        className="bg-green-600 w-full mt-10 p-5 rounded-2xl items-center"
      >
        <Text className="text-white font-bold text-lg">Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}
