import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/error';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [deviceIdError, setDeviceIdError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        setUsernameError('');
        setPasswordError('');

        let hasError = false;
        // Require at least one of username or email
        if (!username.trim() && !email.trim()) {
            setUsernameError('Username or email is required');
            setEmailError('Username or email is required');
            hasError = true;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            setEmailError('Please enter a valid email address');
            hasError = true;
        }
        if (!password) {
            setPasswordError('Password is required');
            hasError = true;
        } else if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            hasError = true;
        }
        if (hasError) return;

        // Validate device ID format if provided
        if (deviceId && !/^[A-Z]{2}[0-9]{4}$/.test(deviceId)) {
            setDeviceIdError('Device ID must be two uppercase letters followed by four digits (e.g. AB1234)');
            return
        }

        setLoading(true);
        try {
            const data = await api.login({ username, email, password, device_id: deviceId || '' });
            await login(
                { accessToken: data.access_token, refreshToken: data.refresh_token },
                { username: data.user.username, deviceId: data.user.device_id }
            );
            router.replace('/(app)/dashboard');
        } catch (err: unknown) {
            Alert.alert('Login Failed', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-background dark:bg-surface-dark"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
            keyboardShouldPersistTaps="handled"
        >
            {/* Decorative blobs */}
            <View className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ backgroundColor: 'rgba(0,107,44,0.05)', top: -60, right: -60 }} />
            <View className="absolute w-72 h-72 rounded-full" style={{ backgroundColor: 'rgba(0,99,152,0.05)', bottom: 40, left: -50 }} />

            {/* Identity Section */}
            <View className="items-center mb-10">
                <View
                    className="w-20 h-20 bg-primary-container dark:bg-primary-container-dark rounded-lg mb-5 items-center justify-center"
                    style={{ shadowColor: '#006b2c', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }}
                >
                    <Text className="text-4xl">🌱</Text>
                </View>
                <Text className="font-headline font-black text-4xl tracking-tight text-primary dark:text-primary-dark mb-1">
                    TerraDetect
                </Text>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-body text-base">
                    Precision agronomy at your fingertips.
                </Text>
            </View>

            {/* Login Form Card */}
            <View
                className="bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg px-8 py-10"
                style={{ shadowColor: '#191c1d', shadowOpacity: 0.04, shadowRadius: 32, shadowOffset: { width: 0, height: 8 } }}
            >
                {/* Username Field */}
                <View className="mb-5">
                    <Text className="font-label text-xs font-semibold text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider ml-4 mb-2">
                        Username or Email
                    </Text>
                    <View className="relative">
                        <View className={`bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4 ${usernameError ? 'border-2 border-error' : ''}`}>
                            <TextInput
                                value={username}
                                onChangeText={(t) => { setUsername(t); setEmail(t); setUsernameError(''); setEmailError(''); }}
                                placeholder="username or email"
                                placeholderTextColor="#6e7b6c"
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                            />
                            <Text className="text-outline dark:text-outline-dark text-lg ml-2">👤</Text>
                        </View>
                    </View>
                    {usernameError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{usernameError}</Text> : null}
                    {emailError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{emailError}</Text> : null}
                </View>

                {/* Password Field */}
                <View className="mb-5">
                    <Text className="font-label text-xs font-semibold text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider ml-4 mb-2">
                        Password
                    </Text>
                    <View className={`bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4 ${passwordError ? 'border-2 border-error' : ''}`}>
                        <TextInput
                            value={password}
                            onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
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
                </View>

                {/* Device ID Field */}
                <View className="mb-8">
                    <Text className="font-label text-xs font-semibold text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider ml-4 mb-2">
                        Device ID
                    </Text>
                    <View className="bg-surface-container-high dark:bg-surface-container-high-dark rounded-full flex-row items-center px-5 py-4">
                        <TextInput
                            value={deviceId}
                            onChangeText={(t) => { setDeviceId(t.toUpperCase()); setDeviceIdError(''); }}
                            placeholder="AB1234"
                            placeholderTextColor="#6e7b6c"
                            autoCapitalize="characters"
                            className="flex-1 font-body text-base text-on-surface dark:text-on-surface-dark"
                        />
                        <Text className="text-outline dark:text-outline-dark text-lg ml-2">📡</Text>
                    </View>
                    {deviceIdError ? <Text className="text-error text-xs mt-1 ml-4 font-label">{deviceIdError}</Text> : null}
                    <Text className="text-[11px] text-outline dark:text-outline-dark font-body px-4 mt-2">
                        Found on the back of your TerraDetect sensor.
                    </Text>
                </View>

                {/* Sign In Button */}
                <Pressable
                    onPress={handleLogin}
                    disabled={loading}
                    className="rounded-full overflow-hidden active:scale-95"
                >
                    <LinearGradient
                        colors={loading ? (['#93c5a3', '#93c5a3'] as const) : (['#006b2c', '#00873a'] as const)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-5 items-center justify-center flex-row gap-2"
                    >
                        <Text className="text-on-primary font-headline font-bold text-lg">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Text>
                        {!loading && <Text className="text-on-primary text-lg">→</Text>}
                    </LinearGradient>
                </Pressable>

                {/* Registration Link */}
                <View className="mt-8 pt-6 items-center" style={{ borderTopWidth: 1, borderTopColor: 'rgba(25,28,29,0.06)' }}>
                    <Pressable onPress={() => router.push('/(auth)/register')}>
                        <Text className="text-primary dark:text-primary-dark font-headline font-bold text-base">
                            Create Account →
                        </Text>
                    </Pressable>
                    <Text className="mt-2 text-on-surface-variant dark:text-on-surface-variant-dark text-xs font-body">
                        New to the field? Start your journey today.
                    </Text>
                </View>
            </View>

            {/* Editorial footer strip */}
            <View className="mt-10 bg-surface-container dark:bg-surface-container-dark rounded-lg p-4 overflow-hidden">
                <Text className="font-headline font-extrabold text-on-surface-variant dark:text-on-surface-variant-dark opacity-20 text-3xl italic tracking-tighter text-center">
                    THE FUTURE OF SOIL
                </Text>
            </View>
        </ScrollView>
    );
}