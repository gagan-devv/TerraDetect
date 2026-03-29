import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/error";

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [deviceIdError, setDeviceIdError] = useState("");

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const calculatePasswordStrength = (pwd: string): { strength: number; label: string } => {
        let s = 0;
        if (pwd.length >= 8) s++;
        if (pwd.length >= 12) s++;
        if (/[A-Z]/.test(pwd)) s++;
        if (/[0-9]/.test(pwd)) s++;
        if (/[^A-Za-z0-9]/.test(pwd)) s++;
        if (s <= 1) return { strength: 1, label: "Weak" };
        if (s <= 3) return { strength: 2, label: "Medium" };
        return { strength: 3, label: "Strong" };
    };

    const passwordStrength = calculatePasswordStrength(password);

    const strengthColor = (idx: number) => {
        if (passwordStrength.strength < idx) return 'bg-surface-container-high dark:bg-surface-container-high-dark';
        if (passwordStrength.strength === 1) return 'bg-error';
        if (passwordStrength.strength === 2) return 'bg-tertiary-fixed-dim';
        return 'bg-primary';
    };

    const handleRegister = async () => {
        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setDeviceIdError("");

        let hasError = false;
        if (!username.trim()) { setUsernameError("Username is required"); hasError = true; }
        if (!email) { setEmailError("Email is required"); hasError = true; }
        else if (!validateEmail(email)) { setEmailError("Please enter a valid email address"); hasError = true; }
        if (!password) { setPasswordError("Password is required"); hasError = true; }
        else if (password.length < 8) { setPasswordError("Password must be at least 8 characters"); hasError = true; }
        if (hasError) return;

        // Validate device ID format if provided
        if (deviceId && !/^[A-Z]{2}[0-9]{4}$/.test(deviceId)) {
            setDeviceIdError('Device ID must be two uppercase letters followed by four digits (e.g. AB1234)');
            return
        }

        setLoading(true);
        try {
            await api.register({ username, email, password, device_id: deviceId || "" });
            router.push("/(auth)/register-success");
        } catch (err: unknown) {
            Alert.alert("Registration Failed", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-surface dark:bg-surface-dark" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Simplified glassmorphic header */}
            <View className="bg-white/80 dark:bg-slate-900/80 items-center py-5 pt-12" style={{ borderBottomWidth: 0 }}>
                <View className="flex-row items-center gap-2">
                    <Text className="text-primary dark:text-primary-dark text-2xl">🌱</Text>
                    <Text className="font-headline font-black text-2xl text-primary dark:text-primary-dark tracking-tight">TerraDetect</Text>
                </View>
            </View>

            <View className="px-6 pt-10">
                {/* Header */}
                <View className="mb-8">
                    <Text className="font-headline text-4xl font-extrabold text-on-surface dark:text-on-surface-dark mb-3 tracking-tight">
                        Begin Your Harvest
                    </Text>
                    <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-body text-lg leading-7">
                        Join the network of modern cultivators and start monitoring your soil vitality today.
                    </Text>
                </View>

                {/* Form */}
                <View className="gap-5">
                    {/* Username */}
                    <View>
                        <Text className="font-label font-medium text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-2 ml-4">Username</Text>
                        <View className={`bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4 ${usernameError ? 'border-2 border-error' : ''}`}>
                            <Text className="text-outline dark:text-outline-dark text-lg mr-3">👤</Text>
                            <TextInput
                                value={username}
                                onChangeText={(t) => { setUsername(t); setUsernameError(""); }}
                                placeholder="e.g. GreenThumb92"
                                placeholderTextColor="#6e7b6c"
                                autoCapitalize="none"
                                className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                            />
                        </View>
                        {usernameError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{usernameError}</Text> : null}
                    </View>

                    {/* Email */}
                    <View>
                        <Text className="font-label font-medium text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-2 ml-4">Email address</Text>
                        <View className={`bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4 ${emailError ? 'border-2 border-error' : ''}`}>
                            <Text className="text-outline dark:text-outline-dark text-lg mr-3">✉️</Text>
                            <TextInput
                                value={email}
                                onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                                placeholder="your@field.com"
                                placeholderTextColor="#6e7b6c"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                            />
                        </View>
                        {emailError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{emailError}</Text> : null}
                    </View>

                    {/* Password */}
                    <View>
                        <Text className="font-label font-medium text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-2 ml-4">Password</Text>
                        <View className={`bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4 ${passwordError ? 'border-2 border-error' : ''}`}>
                            <Text className="text-outline dark:text-outline-dark text-lg mr-3">🔒</Text>
                            <TextInput
                                value={password}
                                onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
                                placeholder="••••••••"
                                placeholderTextColor="#6e7b6c"
                                secureTextEntry={!showPassword}
                                className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} className="ml-2 p-1">
                                <Text className="text-outline dark:text-outline-dark text-lg">{showPassword ? '🙈' : '👁️'}</Text>
                            </Pressable>
                        </View>
                        {passwordError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{passwordError}</Text> : null}

                        {/* Password Strength Meter */}
                        {password.length > 0 && (
                            <View className="mt-3 px-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant-dark">
                                        Security Level
                                    </Text>
                                    <Text className={`text-[11px] font-label font-bold uppercase tracking-widest ${passwordStrength.strength === 3 ? 'text-primary dark:text-primary-dark' : passwordStrength.strength === 2 ? 'text-tertiary dark:text-tertiary-dark' : 'text-error'}`}>
                                        {passwordStrength.label}
                                    </Text>
                                </View>
                                <View className="flex-row gap-1.5 h-1.5">
                                    <View className={`flex-1 rounded-full ${strengthColor(1)}`} />
                                    <View className={`flex-1 rounded-full ${strengthColor(2)}`} />
                                    <View className={`flex-1 rounded-full ${strengthColor(3)}`} />
                                </View>
                                <Text className="text-[12px] text-on-surface-variant dark:text-on-surface-variant-dark mt-2 font-body italic leading-tight">
                                    Must contain at least 8 characters, one number, and a symbol.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Device ID (Optional) */}
                    <View>
                        <View className="flex-row justify-between items-center mb-2 px-4">
                            <Text className="font-label font-medium text-sm text-on-surface-variant dark:text-on-surface-variant-dark">Device ID</Text>
                            <View className="bg-surface-container dark:bg-surface-container-dark px-2 py-0.5 rounded-md">
                                <Text className="text-[10px] font-label font-bold uppercase tracking-tighter text-outline dark:text-outline-dark">Optional</Text>
                            </View>
                        </View>
                        <View className="bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4">
                            <Text className="text-outline dark:text-outline-dark text-lg mr-3">📡</Text>
                            <TextInput
                                value={deviceId}
                                onChangeText={(t) => { setDeviceId(t.toUpperCase()); setDeviceIdError(""); }}
                                placeholder="AB1234"
                                placeholderTextColor="#6e7b6c"
                                autoCapitalize="characters"
                                className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                            />
                        </View>
                        {deviceIdError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{deviceIdError}</Text> : null}

                        <Text className="text-[12px] text-on-surface-variant dark:text-on-surface-variant-dark mt-2 ml-4">
                            If you provide a pre-provisioned device ID here and it is valid, the device will be claimed and an API key will be returned once. Leave empty to register without a device and claim later.
                        </Text>
                    </View>

                    {/* Sign Up Button */}
                    <Pressable
                        onPress={handleRegister}
                        disabled={loading}
                        className="rounded-full overflow-hidden mt-2 active:scale-95"
                    >
                        <LinearGradient
                            colors={loading ? (['#93c5a3', '#93c5a3'] as const) : (['#006b2c', '#00873a'] as const)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-5 items-center justify-center"
                        >
                            <Text className="text-on-primary font-headline font-bold text-lg">
                                {loading ? "Creating Account..." : "Sign Up"}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </View>

                {/* Bottom Link */}
                <View className="mt-10 items-center flex-row justify-center gap-1">
                    <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-body text-base">
                        Already have an account?
                    </Text>
                    <Pressable onPress={() => router.push("/(auth)/login")}>
                        <Text className="text-primary dark:text-primary-dark font-bold text-base ml-1">
                            Login
                        </Text>
                    </Pressable>
                </View>

                {/* Footer icons (Organic Brutalism touch) */}
                <View className="flex-row justify-center gap-6 mt-10 mb-4 opacity-25">
                    {['🌿', '🌾', '🍃', '🌱'].map((icon) => (
                        <Text key={icon} className="text-2xl text-on-surface dark:text-on-surface-dark">{icon}</Text>
                    ))}
                </View>
                <Text className="text-[10px] font-label font-bold uppercase tracking-widest text-outline dark:text-outline-dark text-center mb-4">
                    © 2024 TerraDetect Systems • Privacy Focused
                </Text>
            </View>
        </ScrollView>
    );
}
