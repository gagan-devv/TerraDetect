import React, { useCallback, useEffect, useState } from 'react'
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import type { SensorReading } from '../../store/sensorStore'

const PER_PAGE = 20

interface Pagination {
    total: number
    page: number
    per_page: number
    total_pages: number
}

function HistoryRow({ item, index }: { item: SensorReading; index: number }) {
    const time = new Date(item.timestamp).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <View className={`px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <Text className="text-xs text-gray-400 mb-1">{time}</Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                <Text className="text-xs text-gray-600">🌡 {item.temperature.toFixed(1)}°C</Text>
                <Text className="text-xs text-gray-600">💧 {item.humidity.toFixed(1)}%</Text>
                <Text className="text-xs text-gray-600">⚗️ pH {item.ph.toFixed(1)}</Text>
                <Text className="text-xs text-gray-600">⚡ {item.ec.toFixed(1)} μS/cm</Text>
                <Text className="text-xs text-gray-600">N {item.N.toFixed(0)}</Text>
                <Text className="text-xs text-gray-600">P {item.P.toFixed(0)}</Text>
                <Text className="text-xs text-gray-600">K {item.K.toFixed(0)}</Text>
                <Text className="text-xs text-gray-600">🌱 {item.moisture.toFixed(1)}%</Text>
            </View>
        </View>
    )
}

export default function HistoryScreen() {
    const router = useRouter()
    const { accessToken } = useAuthStore()

    const [readings, setReadings] = useState<SensorReading[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPage = useCallback(
        async (pageNum: number, reset = false) => {
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
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
                setIsLoadingMore(false)
            }
        },
        [accessToken],
    )

    useEffect(() => {
        fetchPage(1, true)
    }, [])

    const handleRefresh = () => fetchPage(1, true)

    const handleLoadMore = () => {
        if (!pagination) return
        if (page < pagination.total_pages && !isLoadingMore) {
            fetchPage(page + 1)
        }
    }

    const ListHeader = () => (
        <View className="bg-green-700 px-6 pt-14 pb-4">
            <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="mr-2">
                    <Text className="text-white text-2xl">←</Text>
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-bold">Sensor History</Text>
                    {pagination && (
                        <Text className="text-green-200 text-xs">
                            {pagination.total} total readings
                        </Text>
                    )}
                </View>
            </View>
        </View>
    )

    const ListEmpty = () => (
        <View className="items-center py-16">
            {isLoading ? (
                <ActivityIndicator size="large" color="#16a34a" />
            ) : (
                <>
                    <Text className="text-gray-400 text-base">No history yet.</Text>
                    <Text className="text-gray-300 text-sm mt-1">
                        Sensor data will appear here once received.
                    </Text>
                </>
            )}
        </View>
    )

    const ListFooter = () => {
        if (!isLoadingMore) return null
        return (
            <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#16a34a" />
            </View>
        )
    }

    if (error && readings.length === 0) {
        return (
            <View className="flex-1 bg-gray-50">
                <ListHeader />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-red-500 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        className="mt-4 bg-green-600 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-medium">Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={readings}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item, index }) => <HistoryRow item={item} index={index} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading && readings.length > 0}
                        onRefresh={handleRefresh}
                        tintColor="#16a34a"
                    />
                }
                stickyHeaderIndices={[0]}
            />
        </View>
    )
}