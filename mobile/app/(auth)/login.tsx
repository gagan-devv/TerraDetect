import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const loginToStore = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        if (!username || !password || !deviceId)
            return Alert.alert("Error", "Please fill in all fields");

        setLoading(true);
        try {
            const data = await api.login({ username, password, device_id: deviceId });

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
        <ScrollView
            className="flex-1 bg-white"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text className="text-3xl font-bold text-green-700 mb-2 text-center">
                TerraDetect
            </Text>
            <Text className="text-gray-400 text-center mb-8 text-sm">
                Sign in to your farm dashboard
            </Text>

            <View className="space-y-3">
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-gray-800"
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-gray-800"
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-gray-800"
                    placeholder="Device ID (e.g. ABC123)"
                    value={deviceId}
                    onChangeText={(v) => setDeviceId(v.toUpperCase().trim())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                />

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    className={`p-4 rounded-xl items-center mt-2 ${loading ? "bg-green-300" : "bg-green-600"
                        }`}
                >
                    <Text className="text-white font-semibold text-lg">
                        {loading ? "Signing in..." : "Sign In"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
                    className="items-center py-3"
                >
                    <Text className="text-gray-500 text-sm">
                        No account?{" "}
                        <Text className="text-green-600 font-semibold">Register here</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}