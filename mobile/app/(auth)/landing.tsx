import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-10">
        {/* Simple Branding Icon */}
        <View className="w-24 h-24 bg-green-100 rounded-3xl items-center justify-center mb-6">
          <Text className="text-5xl">🌱</Text>
        </View>

        <Text className="text-4xl font-bold text-gray-900 text-center tracking-tight">
          TerraDetect
        </Text>
        <Text className="text-gray-500 text-center mt-3 text-lg leading-6">
          Real-time soil monitoring and AI-powered crop recommendations.
        </Text>
      </View>

      <View className="p-8 space-y-4 mb-10">
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.8}
          className="bg-green-600 p-5 rounded-2xl items-center shadow-sm"
        >
          <Text className="text-white font-bold text-lg">Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.7}
          className="bg-white border-2 border-green-600 p-5 rounded-2xl items-center"
        >
          <Text className="text-green-600 font-bold text-lg">
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
