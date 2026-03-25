import React, { useState } from 'react'
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useSensorStore } from '../../store/sensorStore'

type Mode = 'crop' | 'suitability' | 'fertilizer'

const SOIL_TYPES = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy']
const CROPS = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane',
    'Banana', 'Mango', 'Apple', 'Grapes', 'Jute', 'Coffee',
]

interface FormValues {
    N: string; P: string; K: string
    temperature: string; humidity: string
    ph: string; rainfall: string; moisture: string
    cropName: string; soilType: string
}

const defaultForm: FormValues = {
    N: '', P: '', K: '', temperature: '',
    humidity: '', ph: '', rainfall: '',
    moisture: '', cropName: 'Wheat', soilType: 'Black',
}

interface FieldInputProps {
    label: string
    value: string
    onChange: (v: string) => void
    unit: string
    placeholder?: string
}

function FieldInput({ label, value, onChange, unit, placeholder }: FieldInputProps) {
    return (
        <View className="mb-3">
            <Text className="text-gray-600 text-sm font-medium mb-1">{label}</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl overflow-hidden">
                <TextInput
                    className="flex-1 px-4 py-3 text-gray-800"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder={placeholder ?? '0'}
                    placeholderTextColor="#9ca3af"
                />
                <Text className="px-3 text-gray-400 text-sm">{unit}</Text>
            </View>
        </View>
    )
}

// ── Result renderers ──────────────────────────────────────────────────────────

function CropResult({ result }: { result: any }) {
    return (
        <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-4">
            <Text className="text-green-800 font-bold text-lg capitalize">
                {result.recommended_crop}
            </Text>
            <Text className="text-green-600 text-sm mt-1">
                Confidence: {result.confidence?.toFixed(1)}%
            </Text>
        </View>
    )
}

function SuitabilityResult({ result }: { result: any }) {
    return (
        <View className="mt-4">
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
                <Text className="text-blue-800 font-bold text-base capitalize">{result.crop}</Text>
                <Text className="text-blue-600 text-sm">
                    Suitability score: {result.suitability_score?.toFixed(1)}%
                </Text>
            </View>

            {result.table?.map((row: any, i: number) => (
                <View
                    key={i}
                    className={`flex-row justify-between items-center px-4 py-2 rounded-xl mb-1 ${row.status === 'optimal'
                            ? 'bg-green-50'
                            : row.status === 'low'
                                ? 'bg-yellow-50'
                                : 'bg-red-50'
                        }`}
                >
                    <Text className="text-gray-700 text-sm font-medium w-32">{row.parameter}</Text>
                    <Text className="text-gray-500 text-xs">{row.observed} / {row.recommended}</Text>
                    <Text
                        className={`text-xs font-semibold ${row.status === 'optimal'
                                ? 'text-green-600'
                                : row.status === 'low'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                            }`}
                    >
                        {row.status}
                    </Text>
                </View>
            ))}
        </View>
    )
}

function FertilizerResult({ result }: { result: any }) {
    return (
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
            <Text className="text-amber-800 font-bold text-lg">{result.fertilizer}</Text>
            <Text className="text-amber-600 text-sm mt-0.5">Composition: {result.composition}</Text>
            <Text className="text-gray-600 text-sm mt-2">{result.application}</Text>

            {(result.nitrogen_advice || result.phosphorus_advice || result.potassium_advice) && (
                <View className="mt-3 space-y-1">
                    {result.nitrogen_advice && (
                        <Text className="text-gray-600 text-xs">• {result.nitrogen_advice}</Text>
                    )}
                    {result.phosphorus_advice && (
                        <Text className="text-gray-600 text-xs">• {result.phosphorus_advice}</Text>
                    )}
                    {result.potassium_advice && (
                        <Text className="text-gray-600 text-xs">• {result.potassium_advice}</Text>
                    )}
                </View>
            )}
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PredictScreen() {
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const { latest: sensorData } = useSensorStore()

    const [mode, setMode] = useState<Mode>('crop')
    const [form, setForm] = useState<FormValues>(defaultForm)
    const [useSensor, setUseSensor] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const set = (field: keyof FormValues) => (value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const fillFromSensor = () => {
        if (!sensorData) {
            Alert.alert('No sensor data', 'Fetch data from the dashboard first.')
            return
        }
        setForm((prev) => ({
            ...prev,
            N: String(sensorData.N.toFixed(1)),
            P: String(sensorData.P.toFixed(1)),
            K: String(sensorData.K.toFixed(1)),
            temperature: String(sensorData.temperature.toFixed(1)),
            humidity: String(sensorData.humidity.toFixed(1)),
            ph: String(sensorData.ph.toFixed(1)),
            moisture: String(sensorData.moisture.toFixed(1)),
        }))
        setUseSensor(true)
    }

    const handleSubmit = async () => {
        if (!accessToken) return
        setIsLoading(true)
        setResult(null)

        const source = useSensor ? 'sensor' : 'manual'
        const num = (v: string) => parseFloat(v) || 0

        try {
            let res: any

            if (mode === 'crop') {
                res = await api.predictCrop(accessToken, {
                    source,
                    N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature),
                    humidity: num(form.humidity),
                    ph: num(form.ph),
                    rainfall: num(form.rainfall),
                })
            } else if (mode === 'suitability') {
                if (!form.cropName) return Alert.alert('Error', 'Select a crop first.')
                res = await api.predictSuitability(accessToken, {
                    source,
                    crop_name: form.cropName,
                    N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature),
                    humidity: num(form.humidity),
                    ph: num(form.ph),
                    rainfall: num(form.rainfall),
                })
            } else {
                res = await api.predictFertilizer(accessToken, {
                    source,
                    crop_name: form.cropName,
                    soil_type: form.soilType,
                    N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature),
                    humidity: num(form.humidity),
                    ph: num(form.ph),
                    moisture: num(form.moisture),
                    rainfall: num(form.rainfall),
                })
            }

            setResult(res)
        } catch (err: any) {
            Alert.alert('Prediction failed', err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const modeConfig = {
        crop: { label: 'Best Crop', color: 'bg-green-600' },
        suitability: { label: 'Suitability', color: 'bg-blue-600' },
        fertilizer: { label: 'Fertilizer', color: 'bg-amber-600' },
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-green-700 px-6 pt-14 pb-5">
                <View className="flex-row items-center gap-3 mb-4">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-white text-2xl mr-2">←</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">ML Predictions</Text>
                </View>

                {/* Mode tabs */}
                <View className="flex-row bg-green-800 rounded-xl p-1 gap-1">
                    {(['crop', 'suitability', 'fertilizer'] as Mode[]).map((m) => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => { setMode(m); setResult(null) }}
                            className={`flex-1 py-2 rounded-lg items-center ${mode === m ? modeConfig[m].color : 'bg-transparent'
                                }`}
                        >
                            <Text className={`text-xs font-semibold ${mode === m ? 'text-white' : 'text-green-300'}`}>
                                {modeConfig[m].label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="px-4 pt-4 pb-8">
                {/* Fill from sensor button */}
                {sensorData && (
                    <TouchableOpacity
                        onPress={fillFromSensor}
                        className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex-row items-center justify-between"
                    >
                        <Text className="text-teal-700 font-medium text-sm">Use live sensor data</Text>
                        <Text className="text-teal-500 text-xs">Tap to fill</Text>
                    </TouchableOpacity>
                )}

                {/* Crop selector for suitability and fertilizer */}
                {(mode === 'suitability' || mode === 'fertilizer') && (
                    <View className="mb-3">
                        <Text className="text-gray-600 text-sm font-medium mb-1">Crop</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                            {CROPS.map((crop) => (
                                <TouchableOpacity
                                    key={crop}
                                    onPress={() => set('cropName')(crop)}
                                    className={`mx-1 px-4 py-2 rounded-xl border ${form.cropName === crop
                                            ? 'bg-green-600 border-green-600'
                                            : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={`text-sm font-medium ${form.cropName === crop ? 'text-white' : 'text-gray-700'}`}>
                                        {crop}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Soil type selector for fertilizer */}
                {mode === 'fertilizer' && (
                    <View className="mb-3">
                        <Text className="text-gray-600 text-sm font-medium mb-1">Soil type</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {SOIL_TYPES.map((soil) => (
                                <TouchableOpacity
                                    key={soil}
                                    onPress={() => set('soilType')(soil)}
                                    className={`px-4 py-2 rounded-xl border ${form.soilType === soil
                                            ? 'bg-amber-500 border-amber-500'
                                            : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={`text-sm font-medium ${form.soilType === soil ? 'text-white' : 'text-gray-700'}`}>
                                        {soil}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* NPK inputs */}
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <FieldInput label="Nitrogen (N)" value={form.N} onChange={set('N')} unit="kg/ha" />
                    </View>
                    <View className="flex-1">
                        <FieldInput label="Phosphorus (P)" value={form.P} onChange={set('P')} unit="kg/ha" />
                    </View>
                    <View className="flex-1">
                        <FieldInput label="Potassium (K)" value={form.K} onChange={set('K')} unit="kg/ha" />
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <FieldInput label="Temperature" value={form.temperature} onChange={set('temperature')} unit="°C" />
                    </View>
                    <View className="flex-1">
                        <FieldInput label="Humidity" value={form.humidity} onChange={set('humidity')} unit="%" />
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <FieldInput label="Soil pH" value={form.ph} onChange={set('ph')} unit="0–14" />
                    </View>
                    <View className="flex-1">
                        <FieldInput label="Rainfall" value={form.rainfall} onChange={set('rainfall')} unit="mm" />
                    </View>
                </View>

                {mode === 'fertilizer' && (
                    <FieldInput label="Moisture" value={form.moisture} onChange={set('moisture')} unit="%" />
                )}

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className={`p-4 rounded-2xl items-center mt-2 ${isLoading ? 'bg-green-300' : modeConfig[mode].color
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-base">
                            Get {modeConfig[mode].label} Recommendation
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Results */}
                {result && mode === 'crop' && <CropResult result={result} />}
                {result && mode === 'suitability' && <SuitabilityResult result={result} />}
                {result && mode === 'fertilizer' && <FertilizerResult result={result} />}
            </View>
        </ScrollView>
    )
}