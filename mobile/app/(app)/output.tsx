import React, { useState, useEffect } from 'react'
import {
    View, Text, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/error'
import { useAuthStore } from '../../store/authStore'
import { useSensorStore, SensorReading } from '../../store/sensorStore'
import { usePredictionStore, PredictionMode } from '../../store/predictionStore'

type Mode = 'crop' | 'suitability' | 'fertilizer'

interface CropResult { recommended_crop: string; confidence: number }
interface SuitabilityTableRow { parameter: string; recommended: number; observed: number; status: string }
interface SuitabilityResult { crop: string; suitability_score: number; table: SuitabilityTableRow[] }
interface FertilizerResult {
    fertilizer: string; composition: string; application: string
    nitrogen_advice?: string; phosphorus_advice?: string; potassium_advice?: string
}
type PredictResult = CropResult | SuitabilityResult | FertilizerResult | null

function isCropResult(r: PredictResult): r is CropResult {
    return r !== null && 'recommended_crop' in r
}
function isSuitabilityResult(r: PredictResult): r is SuitabilityResult {
    return r !== null && 'suitability_score' in r
}
function isFertilizerResult(r: PredictResult): r is FertilizerResult {
    return r !== null && 'fertilizer' in r
}

function CropResultView({ result }: { result: CropResult }) {
    const confidence = result.confidence ?? 0
    return (
        <View className="bg-primary/5 rounded-[1.8rem] p-1 mt-2">
            <View className="bg-surface-container-lowest p-6 rounded-[1.5rem]">
                <View className="flex-row justify-between items-start mb-4">
                    <View>
                        <View className="bg-primary/10 rounded-sm px-3 py-1 self-start mb-2">
                            <Text className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Top Match</Text>
                        </View>
                        <Text className="font-headline font-extrabold text-5xl text-primary capitalize">
                            {result.recommended_crop}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="font-headline font-black text-4xl text-on-surface">
                            {confidence.toFixed(0)}%
                        </Text>
                        <Text className="text-xs font-label text-on-surface-variant uppercase tracking-tighter">
                            Confidence
                        </Text>
                    </View>
                </View>
                {/* Progress bar */}
                <View className="flex-row items-center gap-3">
                    <View className="flex-1 bg-surface-container rounded-full h-3 overflow-hidden">
                        <View
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(confidence, 100)}%` }}
                        />
                    </View>
                    <Text className="text-primary text-lg">✓</Text>
                </View>
            </View>
        </View>
    )
}

function SuitabilityResultView({ result }: { result: SuitabilityResult }) {
    return (
        <View className="mt-4 space-y-3">
            <View className="bg-surface-container-lowest p-6 rounded-lg border-l-4 border-secondary">
                <Text className="font-headline font-bold text-2xl text-secondary capitalize mb-1">
                    {result.crop}
                </Text>
                <Text className="text-on-surface-variant text-sm">
                    Suitability Score: <Text className="font-bold text-on-surface">{result.suitability_score?.toFixed(1)}%</Text>
                </Text>
            </View>
            {result.table?.map((row, i) => (
                <View
                    key={i}
                    className="flex-row justify-between items-center px-4 py-3 rounded-lg"
                    style={{
                        backgroundColor: row.status === 'optimal' ? 'rgba(0,107,44,0.08)' :
                            row.status === 'low' ? 'rgba(130,81,0,0.08)' : 'rgba(186,26,26,0.08)'
                    }}
                >
                    <Text className="font-body text-sm font-medium text-on-surface">{row.parameter}</Text>
                    <Text className="text-on-surface-variant text-xs font-label">{row.observed} / {row.recommended}</Text>
                    <Text className={`text-xs font-bold font-label uppercase tracking-wider ${row.status === 'optimal' ? 'text-primary' : row.status === 'low' ? 'text-tertiary' : 'text-error'
                        }`}>
                        {row.status}
                    </Text>
                </View>
            ))}
        </View>
    )
}

function FertilizerResultView({ result }: { result: FertilizerResult }) {
    return (
        <View className="mt-4 space-y-4">
            <View className="bg-surface-container-lowest p-6 rounded-lg border-l-4 border-tertiary">
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(130,81,0,0.10)' }}>
                        <Text className="text-xl">🧪</Text>
                    </View>
                    <View>
                        <Text className="font-headline font-bold text-lg text-on-surface">{result.fertilizer}</Text>
                        <Text className="text-on-surface-variant text-xs font-label">{result.composition}</Text>
                    </View>
                </View>
                <Text className="text-on-surface-variant text-sm font-body leading-relaxed">{result.application}</Text>
            </View>
            {result.nitrogen_advice && (
                <View className="bg-surface-container-lowest p-5 rounded-lg border-l-4 border-primary">
                    <Text className="font-headline font-bold text-base mb-1">Nitrogen Advice</Text>
                    <Text className="text-on-surface-variant text-sm font-body">{result.nitrogen_advice}</Text>
                </View>
            )}
            {result.phosphorus_advice && (
                <View className="bg-surface-container-lowest p-5 rounded-lg border-l-4 border-secondary">
                    <Text className="font-headline font-bold text-base mb-1">Phosphorus Advice</Text>
                    <Text className="text-on-surface-variant text-sm font-body">{result.phosphorus_advice}</Text>
                </View>
            )}
            {result.potassium_advice && (
                <View className="bg-surface-container-lowest p-5 rounded-lg border-l-4 border-tertiary">
                    <Text className="font-headline font-bold text-base mb-1">Potassium Advice</Text>
                    <Text className="text-on-surface-variant text-sm font-body">{result.potassium_advice}</Text>
                </View>
            )}
        </View>
    )
}

export default function OutputScreen() {
    const router = useRouter()
    const { accessToken, isGuest } = useAuthStore()
    const { latest: sensorData } = useSensorStore()
    const { result: storedResult, mode: storedMode, setResult } = usePredictionStore()

    const [mode, setMode] = useState<Mode>(storedMode as Mode)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setLocalResult] = useState(storedResult)
    const [hasAutoRun, setHasAutoRun] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [historyData, setHistoryData] = useState<SensorReading[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Sync with stored result
    useEffect(() => {
        if (storedResult) {
            setLocalResult(storedResult)
            setMode(storedMode as Mode)
        }
    }, [storedResult, storedMode])

    const fetchHistory = async () => {
        if (!accessToken) return
        setLoadingHistory(true)
        try {
            const response = await api.sensorHistory(accessToken, 1, 10)
            setHistoryData(response.history)
        } catch (err) {
            Alert.alert('Error', 'Failed to load history')
        } finally {
            setLoadingHistory(false)
        }
    }

    const runPredictionWithSample = async (sample: SensorReading) => {
        if (!accessToken) return
        setShowHistoryModal(false)
        setIsLoading(true)
        setLocalResult(null)

        try {
            let res
            if (mode === 'crop') {
                res = await api.predictCrop(accessToken, {
                    source: 'sensor',
                    N: sample.N,
                    P: sample.P,
                    K: sample.K,
                    temperature: sample.temperature,
                    humidity: sample.humidity,
                    ph: sample.ph,
                    rainfall: 200,
                })
            } else if (mode === 'suitability') {
                res = await api.predictSuitability(accessToken, {
                    source: 'sensor',
                    crop_name: 'Wheat',
                    N: sample.N,
                    P: sample.P,
                    K: sample.K,
                    temperature: sample.temperature,
                    humidity: sample.humidity,
                    ph: sample.ph,
                    rainfall: 200,
                })
            } else {
                res = await api.predictFertilizer(accessToken, {
                    source: 'sensor',
                    crop_name: 'Wheat',
                    soil_type: 'Black',
                    N: sample.N,
                    P: sample.P,
                    K: sample.K,
                    temperature: sample.temperature,
                    humidity: sample.humidity,
                    ph: sample.ph,
                    moisture: sample.moisture,
                    rainfall: 200,
                })
            }
            setLocalResult(res)
            setResult(res, mode, 'sensor')
        } catch (err) {
            Alert.alert('Prediction failed', getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    const runPrediction = async () => {
        if (!accessToken || !sensorData) return
        setIsLoading(true)
        setLocalResult(null)

        try {
            let res
            if (mode === 'crop') {
                res = await api.predictCrop(accessToken, {
                    source: 'sensor',
                    N: sensorData.N,
                    P: sensorData.P,
                    K: sensorData.K,
                    temperature: sensorData.temperature,
                    humidity: sensorData.humidity,
                    ph: sensorData.ph,
                    rainfall: 200, // Default value
                })
            } else if (mode === 'suitability') {
                res = await api.predictSuitability(accessToken, {
                    source: 'sensor',
                    crop_name: 'Wheat',
                    N: sensorData.N,
                    P: sensorData.P,
                    K: sensorData.K,
                    temperature: sensorData.temperature,
                    humidity: sensorData.humidity,
                    ph: sensorData.ph,
                    rainfall: 200,
                })
            } else {
                res = await api.predictFertilizer(accessToken, {
                    source: 'sensor',
                    crop_name: 'Wheat',
                    soil_type: 'Black',
                    N: sensorData.N,
                    P: sensorData.P,
                    K: sensorData.K,
                    temperature: sensorData.temperature,
                    humidity: sensorData.humidity,
                    ph: sensorData.ph,
                    moisture: sensorData.moisture,
                    rainfall: 200,
                })
            }
            setLocalResult(res)
            setResult(res, mode, 'sensor')
        } catch (err) {
            Alert.alert('Prediction failed', getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-run prediction with latest sensor data on mount (only if no stored result)
    useEffect(() => {
        if (sensorData && !hasAutoRun && accessToken && !storedResult) {
            setHasAutoRun(true)
            runPrediction()
        }
    }, [sensorData, hasAutoRun, accessToken, storedResult])

    const tabs: { id: Mode; label: string }[] = [
        { id: 'crop', label: 'Crop Recommendation' },
        { id: 'suitability', label: 'Suitability Analysis' },
        { id: 'fertilizer', label: 'Fertilizer Rec.' },
    ]

    // No sensor data state (only for non-guest users)
    // Show this screen only if there's no sensor data AND no result AND not loading
    if (!sensorData && !isGuest && !result && !isLoading) {
        return (
            <View className="flex-1 bg-surface">
                <View className="bg-white/80 shadow-sm px-6 py-4 flex-row justify-between items-center pt-12">
                    <View className="flex-row items-center gap-3">
                        <Text className="text-primary text-2xl">🌱</Text>
                        <Text className="font-headline font-black text-2xl text-primary tracking-tight">TerraDetect</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-on-surface-variant text-2xl">←</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-24 h-24 bg-error/10 rounded-full items-center justify-center mb-6">
                        <Text className="text-5xl">⚠️</Text>
                    </View>
                    <Text className="font-headline font-bold text-2xl text-on-surface mb-2 text-center">
                        No Sensor Data Available
                    </Text>
                    <Text className="text-on-surface-variant font-body text-center mb-8">
                        Please fetch sensor data from the dashboard first, choose from history, or input values manually.
                    </Text>
                    
                    <TouchableOpacity
                        onPress={() => {
                            fetchHistory()
                            setShowHistoryModal(true)
                        }}
                        className="rounded-full overflow-hidden w-full mb-4"
                    >
                        <LinearGradient
                            colors={['#006b2c', '#00873a'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-5 items-center justify-center rounded-full"
                        >
                            <Text className="text-on-primary font-headline font-bold text-lg">
                                Choose from History
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(app)/predict')}
                        className="w-full py-5 items-center justify-center rounded-full border-2 border-primary"
                    >
                        <Text className="text-primary font-headline font-bold text-lg">
                            Input Manually
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* History Modal */}
                <Modal
                    visible={showHistoryModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowHistoryModal(false)}
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-surface rounded-t-3xl p-6 max-h-[80%]">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="font-headline font-bold text-2xl text-on-surface">
                                    Select Sample
                                </Text>
                                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                    <Text className="text-on-surface-variant text-2xl">✕</Text>
                                </TouchableOpacity>
                            </View>

                            {loadingHistory ? (
                                <View className="py-12 items-center">
                                    <ActivityIndicator size="large" color="#006b2c" />
                                </View>
                            ) : (
                                <FlatList
                                    data={historyData}
                                    keyExtractor={(item) => item.timestamp}
                                    renderItem={({ item }) => {
                                        const date = new Date(item.timestamp)
                                        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        
                                        return (
                                            <TouchableOpacity
                                                onPress={() => runPredictionWithSample(item)}
                                                className="bg-surface-container-low rounded-lg p-4 mb-3"
                                            >
                                                <View className="flex-row justify-between items-center mb-2">
                                                    <Text className="font-headline font-bold text-on-surface">
                                                        {dateStr}
                                                    </Text>
                                                    <Text className="font-label text-xs text-on-surface-variant">
                                                        {timeStr}
                                                    </Text>
                                                </View>
                                                <View className="flex-row flex-wrap gap-2">
                                                    <View className="bg-orange-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">Temp: {item.temperature.toFixed(1)}°C</Text>
                                                    </View>
                                                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">Humid: {item.humidity.toFixed(0)}%</Text>
                                                    </View>
                                                    <View className="bg-purple-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">pH: {item.ph.toFixed(1)}</Text>
                                                    </View>
                                                    <View className="bg-cyan-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">EC: {((item as any).ec ?? 0.0).toFixed(1)}</Text>
                                                    </View>
                                                    <View className="bg-green-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">N: {item.N.toFixed(0)}</Text>
                                                    </View>
                                                    <View className="bg-purple-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">P: {item.P.toFixed(0)}</Text>
                                                    </View>
                                                    <View className="bg-amber-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">K: {item.K.toFixed(0)}</Text>
                                                    </View>
                                                    <View className="bg-indigo-50 px-3 py-1 rounded-full">
                                                        <Text className="text-xs font-label">Moist: {(item.moisture ?? 0.0).toFixed(1)}%</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    }}
                                    ListEmptyComponent={
                                        <View className="py-12 items-center">
                                            <Text className="text-on-surface-variant font-body">No history available</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }

    // Guest users without stored result - redirect to predict page
    if (isGuest && !storedResult) {
        return (
            <View className="flex-1 bg-surface">
                <View className="bg-white/80 shadow-sm px-6 py-4 flex-row justify-between items-center pt-12">
                    <View className="flex-row items-center gap-3">
                        <Text className="text-primary text-2xl">🌱</Text>
                        <Text className="font-headline font-black text-2xl text-primary tracking-tight">TerraDetect</Text>
                        <View className="bg-tertiary-container px-3 py-1 rounded-full">
                            <Text className="text-on-tertiary-container font-label font-bold text-xs uppercase tracking-wider">
                                Guest
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-on-surface-variant text-2xl">←</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-24 h-24 bg-tertiary/10 rounded-full items-center justify-center mb-6">
                        <Text className="text-5xl">📊</Text>
                    </View>
                    <Text className="font-headline font-bold text-2xl text-on-surface mb-2 text-center">
                        No Prediction Yet
                    </Text>
                    <Text className="text-on-surface-variant font-body text-center mb-8">
                        Enter soil parameters manually to get your prediction results.
                    </Text>
                    
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/predict')}
                        className="rounded-full overflow-hidden w-full"
                    >
                        <LinearGradient
                            colors={['#006b2c', '#00873a'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-5 items-center justify-center rounded-full"
                        >
                            <Text className="text-on-primary font-headline font-bold text-lg">
                                Start Prediction
                            </Text>
                        </LinearGradient>
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
                    <Text className="font-headline font-black text-2xl text-primary tracking-tight">TerraDetect</Text>
                    {isGuest && (
                        <View className="bg-tertiary-container px-3 py-1 rounded-full">
                            <Text className="text-on-tertiary-container font-label font-bold text-xs uppercase tracking-wider">
                                Guest
                            </Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-on-surface-variant text-2xl">←</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="px-6">
                    {/* Page Title */}
                    <View className="py-6">
                        <Text className="font-headline font-extrabold text-4xl text-on-surface mb-1">
                            Analysis Results
                        </Text>
                        <Text className="text-on-surface-variant font-body opacity-80">
                            {isGuest ? "Based on your manual input." : "Based on your latest sensor readings."}
                        </Text>
                    </View>

                    {/* Tab Navigation - Pill Style */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6"
                        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                    >
                        {tabs.map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => {
                                    setMode(tab.id)
                                    if (sensorData) {
                                        // Re-run prediction with new mode
                                        setTimeout(() => runPrediction(), 100)
                                    }
                                }}
                                className={`px-5 py-3 rounded-full ${mode === tab.id
                                    ? 'bg-primary-container'
                                    : 'bg-surface-container-high'
                                    }`}
                            >
                                <Text className={`font-headline font-bold text-sm whitespace-nowrap ${mode === tab.id ? 'text-on-primary-container' : 'text-on-surface-variant'
                                    }`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Loading State */}
                    {isLoading && (
                        <View className="items-center justify-center py-12">
                            <ActivityIndicator size="large" color="#006b2c" />
                            <Text className="text-on-surface-variant font-body mt-4">
                                Running analysis...
                            </Text>
                        </View>
                    )}

                    {/* Results Section */}
                    {!isLoading && result && (
                        <>
                            {isCropResult(result) && <CropResultView result={result} />}
                            {isSuitabilityResult(result) && <SuitabilityResultView result={result} />}
                            {isFertilizerResult(result) && <FertilizerResultView result={result} />}

                            {/* Action Buttons - Only for non-guest users */}
                            {!isGuest && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // Clear results and sensor data to show "No Sensor Data" screen
                                            setLocalResult(null)
                                            setResult(null, mode, 'sensor')
                                        }}
                                        className="mt-6 rounded-full overflow-hidden"
                                    >
                                        <LinearGradient
                                            colors={['#006b2c', '#00873a'] as const}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="py-5 items-center justify-center rounded-full"
                                        >
                                            <Text className="text-on-primary font-headline font-bold text-lg">
                                                Predict Again
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            fetchHistory()
                                            setShowHistoryModal(true)
                                        }}
                                        className="mt-4 w-full py-5 items-center justify-center rounded-full border-2 border-primary"
                                    >
                                        <Text className="text-primary font-headline font-bold text-lg">
                                            Choose from History
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Guest user action - back to predict page */}
                            {isGuest && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(app)/predict')}
                                    className="mt-6 rounded-full overflow-hidden"
                                >
                                    <LinearGradient
                                        colors={['#006b2c', '#00873a'] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-5 items-center justify-center rounded-full"
                                    >
                                        <Text className="text-on-primary font-headline font-bold text-lg">
                                            Try Another Prediction
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* History Modal */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-surface rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="font-headline font-bold text-2xl text-on-surface">
                                Select Sample
                            </Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <Text className="text-on-surface-variant text-2xl">✕</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingHistory ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color="#006b2c" />
                            </View>
                        ) : (
                            <FlatList
                                data={historyData}
                                keyExtractor={(item) => item.timestamp}
                                renderItem={({ item }) => {
                                    const date = new Date(item.timestamp)
                                    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    
                                    return (
                                        <TouchableOpacity
                                            onPress={() => runPredictionWithSample(item)}
                                            className="bg-surface-container-low rounded-lg p-4 mb-3"
                                        >
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="font-headline font-bold text-on-surface">
                                                    {dateStr}
                                                </Text>
                                                <Text className="font-label text-xs text-on-surface-variant">
                                                    {timeStr}
                                                </Text>
                                            </View>
                                            <View className="flex-row flex-wrap gap-2">
                                                <View className="bg-orange-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">Temp: {item.temperature.toFixed(1)}°C</Text>
                                                </View>
                                                <View className="bg-blue-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">Humid: {item.humidity.toFixed(0)}%</Text>
                                                </View>
                                                <View className="bg-purple-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">pH: {item.ph.toFixed(1)}</Text>
                                                </View>
                                                <View className="bg-cyan-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">EC: {((item as any).ec ?? 0.0).toFixed(1)}</Text>
                                                </View>
                                                <View className="bg-green-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">N: {item.N.toFixed(0)}</Text>
                                                </View>
                                                <View className="bg-purple-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">P: {item.P.toFixed(0)}</Text>
                                                </View>
                                                <View className="bg-amber-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">K: {item.K.toFixed(0)}</Text>
                                                </View>
                                                <View className="bg-indigo-50 px-3 py-1 rounded-full">
                                                    <Text className="text-xs font-label">Moist: {(item.moisture ?? 0.0).toFixed(1)}%</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                }}
                                ListEmptyComponent={
                                    <View className="py-12 items-center">
                                        <Text className="text-on-surface-variant font-body">No history available</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}