import React, { useCallback, useEffect, useState } from 'react'
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/error'
import { useAuthStore } from '../../store/authStore'
import type { SensorReading } from '../../store/sensorStore'

const PER_PAGE = 20

interface Pagination {
    total: number
    page: number
    per_page: number
    total_pages: number
}

// 7-Day summary chart component (simplified CSS-style bar chart)
function WeeklyTrendChart() {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    const humidities = [65, 72, 60, 80, 85, 70, 75]
    const temps = [40, 45, 38, 50, 55, 48, 52]

    return (
        <View className="bg-surface-container-lowest rounded-lg p-6 mb-8 shadow-sm">
            <View className="flex-row items-center gap-2 mb-6">
                <Text className="font-headline font-bold text-xl text-on-surface">
                    7-Day Atmosphere Trends
                </Text>
            </View>
            {/* Bar Chart */}
            <View className="h-36 flex-row items-end justify-between gap-1 border-b border-surface-container-high pb-2">
                {days.map((day, i) => (
                    <View key={day} className="flex-1 items-center gap-0.5">
                        {/* Humidity bar (blue) */}
                        <View
                            className="w-full bg-secondary-container/50 rounded-t-sm"
                            style={{ height: `${humidities[i]}%` }}
                        />
                        {/* Temp bar (green) */}
                        <View
                            className="w-full bg-primary-container rounded-t-sm"
                            style={{ height: `${temps[i]}%` }}
                        />
                        <Text className="text-[9px] font-label font-medium text-on-surface-variant mt-1">
                            {day}
                        </Text>
                    </View>
                ))}
            </View>
            {/* Legend */}
            <View className="flex-row gap-6 mt-4">
                <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-primary-container" />
                    <Text className="text-xs font-body text-on-surface-variant">Avg Temp (24°C)</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-secondary-container" />
                    <Text className="text-xs font-body text-on-surface-variant">Avg Humidity (68%)</Text>
                </View>
            </View>
            {/* Insight */}
            <View className="mt-4 p-3 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgba(127,252,151,0.15)' }}>
                <Text className="text-xs font-body text-on-surface-variant leading-relaxed">
                    Optimal conditions sustained for 84% of the week. Soil hydration levels are increasing.
                </Text>
            </View>
        </View>
    )
}

function HistoryRow({ item }: { item: SensorReading }) {
    const date = new Date(item.timestamp)
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
        <View className="bg-surface-container-low dark:bg-surface-container-low-dark rounded-lg p-3 mb-2">
            {/* Header Row with Date/Time */}
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-outline-variant/20 dark:border-outline-variant-dark/20">
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-surface-container-highest dark:bg-surface-container-highest-dark items-center justify-center">
                        <Text className="text-sm">📋</Text>
                    </View>
                    <View>
                        <Text className="font-headline font-bold text-on-surface dark:text-on-surface-dark text-xs">
                            {dateStr}
                        </Text>
                        <Text className="font-label text-[10px] text-on-surface-variant dark:text-on-surface-variant-dark">
                            {timeStr}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Data Grid - 2 columns */}
            <View className="gap-2">
                {/* Row 1: Temp & Humidity */}
                <View className="flex-row gap-2">
                    <View className="flex-1 bg-orange-50/50 dark:bg-orange-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            TEMP
                        </Text>
                        <Text className="font-headline font-black text-lg text-on-surface dark:text-on-surface-dark">
                            {item.temperature.toFixed(1)}°C
                        </Text>
                    </View>
                    <View className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            HUMID
                        </Text>
                        <Text className="font-headline font-black text-lg text-on-surface dark:text-on-surface-dark">
                            {item.humidity.toFixed(0)}%
                        </Text>
                    </View>
                </View>

                {/* Row 2: pH & EC */}
                <View className="flex-row gap-2">
                    <View className="flex-1 bg-tertiary-container/30 dark:bg-tertiary-container-dark/30 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            pH LEVEL
                        </Text>
                        <Text className="font-headline font-black text-lg text-tertiary dark:text-tertiary-dark">
                            {item.ph.toFixed(1)}
                        </Text>
                    </View>
                    <View className="flex-1 bg-secondary-container/30 dark:bg-secondary-container-dark/30 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            EC (mS/cm)
                        </Text>
                        <Text className="font-headline font-black text-lg text-secondary dark:text-secondary-dark">
                            {((item as any).ec ?? 0.0).toFixed(1)}
                        </Text>
                    </View>
                </View>

                {/* Row 3: NPK */}
                <View className="flex-row gap-2">
                    <View className="flex-1 bg-green-50/50 dark:bg-green-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            N
                        </Text>
                        <Text className="font-headline font-black text-base text-primary dark:text-primary-dark">
                            {item.N.toFixed(0)}
                        </Text>
                    </View>
                    <View className="flex-1 bg-purple-50/50 dark:bg-purple-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            P
                        </Text>
                        <Text className="font-headline font-black text-base text-secondary dark:text-secondary-dark">
                            {item.P.toFixed(0)}
                        </Text>
                    </View>
                    <View className="flex-1 bg-amber-50/50 dark:bg-amber-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            K
                        </Text>
                        <Text className="font-headline font-black text-base text-tertiary dark:text-tertiary-dark">
                            {item.K.toFixed(0)}
                        </Text>
                    </View>
                </View>

                {/* Row 4: Moisture & Rainfall */}
                <View className="flex-row gap-2">
                    <View className="flex-1 bg-cyan-50/50 dark:bg-cyan-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            MOISTURE
                        </Text>
                        <Text className="font-headline font-black text-lg text-on-surface dark:text-on-surface-dark">
                            {(item.moisture ?? 0.0).toFixed(1)}%
                        </Text>
                    </View>
                    <View className="flex-1 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-md p-2">
                        <Text className="text-[9px] font-label uppercase text-on-surface-variant dark:text-on-surface-variant-dark tracking-wider mb-0.5">
                            RAINFALL
                        </Text>
                        <Text className="font-headline font-black text-lg text-on-surface dark:text-on-surface-dark">
                            {((item as any).rainfall ?? 0.0).toFixed(0)} mm
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default function HistoryScreen() {
    const { accessToken } = useAuthStore()
    const [readings, setReadings] = useState<SensorReading[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPage = useCallback(async (pageNum: number, reset = false) => {
        if (!accessToken) return
        if (pageNum === 1) {
            setIsLoading(true)
        } else {
            setIsLoadingMore(true)
        }
        setError(null)
        try {
            const res = await api.sensorHistory(accessToken, pageNum, PER_PAGE)
            setReadings((prev) => (reset ? res.history : [...prev, ...res.history]))
            setPagination(res.pagination)
            setPage(pageNum)
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [accessToken])

    useEffect(() => { fetchPage(1, true) }, [fetchPage])

    const handleRefresh = () => fetchPage(1, true)

    const handleLoadMore = () => {
        if (pagination && page < pagination.total_pages && !isLoadingMore) {
            fetchPage(page + 1)
        }
    }

    const ListHeader = () => (
        <View>
            {/* Editorial Header */}
            <View className="mb-8 pt-4">
                <Text className="font-label text-sm font-semibold text-primary uppercase tracking-widest mb-1">
                    Environmental Log
                </Text>
                <Text className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-3">
                    Field History
                </Text>
                <View className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-container" style={{ backgroundColor: '#006b2c' }} />
            </View>
            {/* Insights Chart */}
            <WeeklyTrendChart />
            {/* Section Header */}
            <Text className="font-headline font-bold text-xl text-on-surface mb-4">
                Recent Records
            </Text>
            {pagination && (
                <Text className="font-label text-xs text-on-surface-variant uppercase tracking-widest mb-4">
                    {pagination.total} total readings
                </Text>
            )}
        </View>
    )

    const ListEmpty = () => (
        <View className="items-center py-16">
            {isLoading
                ? <ActivityIndicator size="large" color="#006b2c" />
                : (
                    <View className="items-center">
                        <Text className="text-4xl mb-4">🌱</Text>
                        <Text className="font-headline font-bold text-on-surface text-lg mb-2">No history yet</Text>
                        <Text className="text-on-surface-variant text-sm font-body text-center">
                            Sensor readings will appear here once your device starts transmitting data.
                        </Text>
                    </View>
                )
            }
        </View>
    )

    const ListFooter = () => {
        if (isLoadingMore) {
            return (
                <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#006b2c" />
                </View>
            )
        }
        if (pagination && page < pagination.total_pages) {
            return (
                <TouchableOpacity onPress={handleLoadMore} className="mt-4 mb-8 items-center">
                    <LinearGradient
                        colors={(['#006b2c', '#00873a'] as const)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="rounded-full px-8 py-4 flex-row items-center gap-2"
                    >
                        <Text className="text-white font-headline font-bold uppercase tracking-wider text-sm">
                            Load Older Records
                        </Text>
                        <Text className="text-white text-lg">↓</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )
        }
        return <View className="pb-8" />
    }

    if (error && readings.length === 0) {
        return (
            <View className="flex-1 bg-surface">
                {/* Glassmorphic Top Nav */}
                <View className="bg-white/80 shadow-sm px-6 py-4 flex-row items-center gap-3 pt-12">
                    <Text className="text-primary text-2xl">🌱</Text>
                    <Text className="font-headline font-bold text-2xl text-primary tracking-tight">TerraDetect</Text>
                </View>
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-16 h-16 bg-error-container rounded-full items-center justify-center mb-4">
                        <Text className="text-3xl">⚠️</Text>
                    </View>
                    <Text className="text-error font-headline text-xl font-bold mb-2 text-center">Failed to Load</Text>
                    <Text className="text-on-surface-variant font-body text-base mb-6 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        className="bg-primary px-6 py-3 rounded-full"
                    >
                        <Text className="text-on-primary font-label font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-surface">
            {/* Glassmorphic Top Nav */}
            <View className="bg-white/80 shadow-sm px-6 py-4 flex-row justify-between items-center pt-12">
                <View className="flex-row items-center gap-3">
                    <Text className="text-primary text-2xl">🌱</Text>
                    <Text className="font-headline font-bold text-2xl text-primary tracking-tight">TerraDetect</Text>
                </View>
                <TouchableOpacity className="p-2 rounded-full">
                    <Text className="text-on-surface-variant text-2xl">🔔</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={readings}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => <HistoryRow item={item} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading && readings.length > 0}
                        onRefresh={handleRefresh}
                        tintColor="#006b2c"
                    />
                }
            />
        </View>
    )
}