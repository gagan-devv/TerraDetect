import React, { useCallback, useEffect, useRef } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useSensorStore } from '../../store/sensorStore'

const REFRESH_INTERVAL_MS = 60_000

interface MetricCardProps {
    label: string
    value: number | null
    unit: string
    color: string
}

function MetricCard({ label, value, unit, color }: MetricCardProps) {
    return (
        <View className={`bg-white rounded-2xl p-4 flex-1 min-w-[44%] m-1 border-l-4 ${color}`}>
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                {label}
            </Text>
            <Text className="text-2xl font-bold text-gray-800 mt-1">
                {value !== null ? value.toFixed(1) : '--'}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">{unit}</Text>
        </View>
    )
}

export default function DashboardScreen() {
    const router = useRouter()
    const { accessToken, username, deviceId, logout } = useAuthStore()
    const { latest, lastUpdated, isLoading, error, setLatest, setLoading, setError } =
        useSensorStore()

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchLatest = useCallback(async () => {
        if (!accessToken) return
        setLoading(true)
        try {
            const res = await api.latestSensor(accessToken)
            setLatest(res.data, res.timestamp)
        } catch (err: any) {
            setError(err.message)
        }
    }, [accessToken])

    useEffect(() => {
        fetchLatest()
        intervalRef.current = setInterval(fetchLatest, REFRESH_INTERVAL_MS)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [fetchLatest])

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await logout()
                    router.replace('/(auth)/landing')
                },
            },
        ])
    }

    const formattedTime = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={fetchLatest} tintColor="#16a34a" />
            }
        >
            {/* Header */}
            <View className="bg-green-700 px-6 pt-14 pb-6">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-green-200 text-sm">Welcome back,</Text>
                        <Text className="text-white text-xl font-bold">{username}</Text>
                        <Text className="text-green-300 text-xs mt-0.5">Device: {deviceId}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-green-600 px-4 py-2 rounded-xl"
                    >
                        <Text className="text-white text-sm font-medium">Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Last updated */}
                <View className="mt-4 flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-2 ${latest ? 'bg-green-300' : 'bg-gray-400'}`} />
                    <Text className="text-green-200 text-xs">
                        {formattedTime ? `Last updated at ${formattedTime}` : 'No data yet'}
                    </Text>
                </View>
            </View>

            <View className="px-4 pt-4">
                {/* Error banner */}
                {error && (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <Text className="text-red-600 text-sm">{error}</Text>
                    </View>
                )}

                {/* Loading state (first load only) */}
                {isLoading && !latest && (
                    <View className="items-center py-12">
                        <ActivityIndicator size="large" color="#16a34a" />
                        <Text className="text-gray-400 mt-3 text-sm">Fetching sensor data...</Text>
                    </View>
                )}

                {/* Sensor grid */}
                {latest && (
                    <>
                        <Text className="text-gray-700 font-semibold text-base mb-2 px-1">
                            Live Readings
                        </Text>

                        <View className="flex-row flex-wrap -m-1 mb-2">
                            <MetricCard
                                label="Temperature"
                                value={latest.temperature}
                                unit="°C"
                                color="border-orange-400"
                            />
                            <MetricCard
                                label="Humidity"
                                value={latest.humidity}
                                unit="%"
                                color="border-blue-400"
                            />
                        </View>

                        <View className="flex-row flex-wrap -m-1 mb-2">
                            <MetricCard label="Soil pH" value={latest.ph} unit="0–14" color="border-purple-400" />
                            <MetricCard label="EC" value={latest.ec} unit="μS/cm" color="border-yellow-400" />
                        </View>

                        <View className="flex-row flex-wrap -m-1 mb-2">
                            <MetricCard label="Moisture" value={latest.moisture} unit="%" color="border-teal-400" />
                            <MetricCard label="Nitrogen" value={latest.N} unit="kg/ha" color="border-green-500" />
                        </View>

                        <View className="flex-row flex-wrap -m-1 mb-4">
                            <MetricCard label="Phosphorus" value={latest.P} unit="kg/ha" color="border-pink-400" />
                            <MetricCard label="Potassium" value={latest.K} unit="kg/ha" color="border-indigo-400" />
                        </View>
                    </>
                )}

                {/* No data state */}
                {!latest && !isLoading && !error && (
                    <View className="items-center py-12">
                        <Text className="text-gray-400 text-base">No sensor data available yet.</Text>
                        <Text className="text-gray-300 text-sm mt-1">
                            Make sure your ESP32 is powered and connected.
                        </Text>
                    </View>
                )}

                {/* Action buttons */}
                <View className="space-y-3 pb-8">
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/predict')}
                        className="bg-green-600 p-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-semibold text-base">ML Predictions</Text>
                        <Text className="text-green-200 text-xs mt-0.5">Crop, suitability & fertilizer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(app)/history')}
                        className="bg-white border border-gray-200 p-4 rounded-2xl items-center"
                    >
                        <Text className="text-gray-700 font-semibold text-base">Sensor History</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">View past readings</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}