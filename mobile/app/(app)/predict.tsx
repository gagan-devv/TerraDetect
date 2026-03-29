import React, { useState } from 'react'
import {
    View, Text, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/error'
import { useAuthStore } from '../../store/authStore'
import { useSensorStore } from '../../store/sensorStore'

type Mode = 'crop' | 'suitability' | 'fertilizer'

const SOIL_TYPES = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy']
const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Banana', 'Mango', 'Apple', 'Grapes', 'Jute', 'Coffee']

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

// Rounded-full field input matching stitch design
function FieldInput({
    label, value, onChange, unit, placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void; unit: string; placeholder?: string
}) {
    return (
        <View className="mb-4">
            <Text className="font-label font-medium text-sm text-on-surface-variant mb-2 ml-4">{label}</Text>
            <View className="bg-surface-container-high rounded-full flex-row items-center px-5 py-4">
                <TextInput
                    className="flex-1 font-body text-base text-on-surface"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder={placeholder ?? '0'}
                    placeholderTextColor="#6e7b6c"
                />
                <Text className="text-on-surface-variant text-sm font-label ml-2">{unit}</Text>
            </View>
        </View>
    )
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

export default function PredictScreen() {
    const { accessToken } = useAuthStore()
    const { latest: sensorData } = useSensorStore()

    const [mode, setMode] = useState<Mode>('crop')
    const [form, setForm] = useState<FormValues>(defaultForm)
    const [useSensor, setUseSensor] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<PredictResult>(null)

    const setField = (field: keyof FormValues) => (value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const fillFromSensor = () => {
        if (!sensorData) return Alert.alert('No sensor data', 'Fetch data from the dashboard first.')
        setForm((prev) => ({
            ...prev,
            N: sensorData.N.toFixed(1),
            P: sensorData.P.toFixed(1),
            K: sensorData.K.toFixed(1),
            temperature: sensorData.temperature.toFixed(1),
            humidity: sensorData.humidity.toFixed(1),
            ph: sensorData.ph.toFixed(1),
            moisture: sensorData.moisture.toFixed(1),
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
            let res: PredictResult
            if (mode === 'crop') {
                res = await api.predictCrop(accessToken, {
                    source, N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature), humidity: num(form.humidity),
                    ph: num(form.ph), rainfall: num(form.rainfall),
                })
            } else if (mode === 'suitability') {
                if (!form.cropName) return Alert.alert('Error', 'Select a crop first.')
                res = await api.predictSuitability(accessToken, {
                    source, crop_name: form.cropName,
                    N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature), humidity: num(form.humidity),
                    ph: num(form.ph), rainfall: num(form.rainfall),
                })
            } else {
                res = await api.predictFertilizer(accessToken, {
                    source, crop_name: form.cropName, soil_type: form.soilType,
                    N: num(form.N), P: num(form.P), K: num(form.K),
                    temperature: num(form.temperature), humidity: num(form.humidity),
                    ph: num(form.ph), moisture: num(form.moisture), rainfall: num(form.rainfall),
                })
            }
            setResult(res)
        } catch (err) {
            Alert.alert('Prediction failed', getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    const tabs: { id: Mode; label: string }[] = [
        { id: 'crop', label: 'Crop Recommendation' },
        { id: 'suitability', label: 'Suitability Analysis' },
        { id: 'fertilizer', label: 'Fertilizer Rec.' },
    ]

    return (
        <View className="flex-1 bg-surface">
            {/* Glassmorphic Top Nav */}
            <View className="bg-white/80 shadow-sm px-6 py-4 flex-row justify-between items-center pt-12">
                <View className="flex-row items-center gap-3">
                    <Text className="text-primary text-2xl">🌱</Text>
                    <Text className="font-headline font-black text-2xl text-primary tracking-tight">TerraDetect</Text>
                </View>
                <Text className="text-on-surface-variant text-2xl">🔔</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="px-6">
                    {/* Page Title */}
                    <View className="py-6">
                        <Text className="font-headline font-extrabold text-4xl text-on-surface mb-1">
                            AI Predictions
                        </Text>
                        <Text className="text-on-surface-variant font-body opacity-80">
                            Harnessing machine learning for precision agronomy.
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
                                onPress={() => { setMode(tab.id); setResult(null) }}
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

                    {/* Sensor Auto-Fill Banner */}
                    {sensorData && (
                        <TouchableOpacity
                            onPress={fillFromSensor}
                            className="bg-surface-container-lowest rounded-full px-5 py-3 mb-6 flex-row items-center justify-between border-l-4 border-secondary"
                        >
                            <Text className="text-on-surface font-body font-medium text-sm">Use live sensor data</Text>
                            <Text className="text-secondary font-label text-xs font-bold uppercase tracking-wider">Tap to fill →</Text>
                        </TouchableOpacity>
                    )}

                    {/* Input Form Section */}
                    <View className="bg-surface-container-low p-6 rounded-lg mb-6">
                        <Text className="font-headline font-bold text-xl mb-4 text-on-surface">
                            ⚙️  Soil Parameters
                        </Text>

                        {/* Crop selector for suitability / fertilizer */}
                        {(mode === 'suitability' || mode === 'fertilizer') && (
                            <View className="mb-4">
                                <Text className="font-label font-medium text-sm text-on-surface-variant mb-2 ml-4">Crop</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {CROPS.map((crop) => (
                                        <TouchableOpacity
                                            key={crop}
                                            onPress={() => setField('cropName')(crop)}
                                            className={`px-4 py-2 rounded-full ${form.cropName === crop
                                                ? 'bg-primary'
                                                : 'bg-surface-container-high'
                                                }`}
                                        >
                                            <Text className={`text-sm font-label font-medium ${form.cropName === crop ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                                                {crop}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Soil type selector for fertilizer */}
                        {mode === 'fertilizer' && (
                            <View className="mb-4">
                                <Text className="font-label font-medium text-sm text-on-surface-variant mb-2 ml-4">Soil Type</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {SOIL_TYPES.map((soil) => (
                                        <TouchableOpacity
                                            key={soil}
                                            onPress={() => setField('soilType')(soil)}
                                            className={`px-4 py-2 rounded-full ${form.soilType === soil ? 'bg-tertiary' : 'bg-surface-container-high'}`}
                                        >
                                            <Text className={`text-sm font-label font-medium ${form.soilType === soil ? 'text-on-tertiary' : 'text-on-surface-variant'}`}>
                                                {soil}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <FieldInput label="Nitrogen (N)" value={form.N} onChange={setField('N')} unit="mg/kg" />
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <FieldInput label="Phosphorus (P)" value={form.P} onChange={setField('P')} unit="mg/kg" />
                            </View>
                            <View className="flex-1">
                                <FieldInput label="Potassium (K)" value={form.K} onChange={setField('K')} unit="mg/kg" />
                            </View>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <FieldInput label="Temperature (°C)" value={form.temperature} onChange={setField('temperature')} unit="°C" placeholder="24.5" />
                            </View>
                            <View className="flex-1">
                                <FieldInput label="Soil pH" value={form.ph} onChange={setField('ph')} unit="0–14" placeholder="6.5" />
                            </View>
                        </View>
                        <FieldInput label="Rainfall (mm)" value={form.rainfall} onChange={setField('rainfall')} unit="mm" placeholder="200" />
                        {mode === 'fertilizer' && (
                            <FieldInput label="Moisture (%)" value={form.moisture} onChange={setField('moisture')} unit="%" />
                        )}

                        {/* Signature Gradient Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            className="mt-2 rounded-full overflow-hidden"
                        >
                            <LinearGradient
                                colors={isLoading ? (['#93c5a3', '#93c5a3'] as const) : (['#006b2c', '#00873a'] as const)}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-5 items-center justify-center rounded-full"
                            >
                                {isLoading
                                    ? <ActivityIndicator color="white" />
                                    : <Text className="text-on-primary font-headline font-bold text-lg">
                                        Run Analysis Engine
                                    </Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Results Section */}
                    {isCropResult(result) && <CropResultView result={result} />}
                    {isSuitabilityResult(result) && <SuitabilityResultView result={result} />}
                    {isFertilizerResult(result) && <FertilizerResultView result={result} />}
                </View>
            </ScrollView>
        </View>
    )
}