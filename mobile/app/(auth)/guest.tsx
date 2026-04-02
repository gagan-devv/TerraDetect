import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/authStore'

export default function GuestScreen() {
    const router = useRouter()
    const { loginAsGuest } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)

    const handleContinueAsGuest = async () => {
        setIsLoading(true)
        try {
            await loginAsGuest()
            router.replace('/(app)/predict')
        } catch (err) {
            Alert.alert('Error', 'Failed to start guest session. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* Logo */}
            <View className="items-center pt-20 pb-10">
                <View className="w-28 h-28 bg-primary rounded-[32px] items-center justify-center mb-6 shadow-lg">
                    <Text className="text-5xl">🌱</Text>
                </View>
                <Text className="font-headline font-black text-4xl text-primary tracking-tight">
                    TerraDetect
                </Text>
                <Text className="font-body text-on-surface-variant mt-2 text-center px-6">
                    Try our AI-powered predictions without an account
                </Text>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 justify-center">
                <View className="bg-surface-container-low rounded-2xl p-6 mb-6">
                    <Text className="font-headline font-bold text-2xl text-on-surface mb-4">
                        Guest Mode
                    </Text>
                    <Text className="font-body text-on-surface-variant mb-4 leading-relaxed">
                        As a guest, you can:
                    </Text>
                    <View className="space-y-3">
                        <View className="flex-row items-start gap-3">
                            <Text className="text-primary text-xl">✓</Text>
                            <Text className="flex-1 font-body text-on-surface">
                                Get crop recommendations based on soil parameters
                            </Text>
                        </View>
                        <View className="flex-row items-start gap-3">
                            <Text className="text-primary text-xl">✓</Text>
                            <Text className="flex-1 font-body text-on-surface">
                                Analyze crop suitability for your conditions
                            </Text>
                        </View>
                        <View className="flex-row items-start gap-3">
                            <Text className="text-primary text-xl">✓</Text>
                            <Text className="flex-1 font-body text-on-surface">
                                Get fertilizer recommendations
                            </Text>
                        </View>
                    </View>

                    <View className="mt-6 p-4 bg-tertiary-container/20 rounded-lg">
                        <Text className="font-label text-xs text-on-surface-variant">
                            Note: Guest mode requires manual input. Sign up to access sensor data, history, and more features.
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    onPress={handleContinueAsGuest}
                    disabled={isLoading}
                    className="rounded-full overflow-hidden mb-4"
                >
                    <LinearGradient
                        colors={isLoading ? ['#93c5a3', '#93c5a3'] : ['#006b2c', '#00873a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-5 items-center justify-center rounded-full"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-on-primary font-headline font-bold text-lg">
                                Continue as Guest
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/(auth)/login')}
                    className="py-5 items-center justify-center rounded-full border-2 border-primary"
                >
                    <Text className="text-primary font-headline font-bold text-lg">
                        Sign In Instead
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
