import React, { useState } from 'react'
import {
    View, Text, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/error'
import { useAuthStore } from '../../store/authStore'
import { usePredictionStore } from '../../store/predictionStore'

type Mode = 'crop' | 'suitability' | 'fertilizer'

const SOIL_TYPES = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy']
const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Banana', 'Mango', 'Apple', 'Grapes', 'Jute', 'Coffee']

interface FormValues {
    N: string; P: string; K: string
    temperature: string; humidity: string
    ph: string; rainfall: string; moisture: string; ec: string
    cropName: string; soilType: string
}

const defaultForm: FormValues = {
    N: '', P: '', K: '', temperature: '',
    humidity: '', ph: '', rainfall: '',
    moisture: '', ec: '', cropName: 'Wheat', soilType: 'Black',
}

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

export default function PredictScreen() {
    const router = useRouter()
    const { accessToken, isGuest } = useAuthStore()
    const { setResult } = usePredictionStore()

    const [mode, setMode] = useState<Mode>('crop')
    const [form, setForm] = useState<FormValues>(defaultForm)
    const [isLoading, setIsLoading] = useState(false)

    const setField = (field: keyof FormValues) => (value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const handleSubmit = async () => {
        // Mode-specific validation
        let requiredFields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph']
        
        if (mode === 'crop') {
            requiredFields.push('rainfall')
        } else if (mode === 'suitability') {
            requiredFields.push('rainfall')
        } else if (mode === 'fertilizer') {
            requiredFields.push('moisture')
        }
        
        const emptyFields = requiredFields.filter(field => !form[field as keyof FormValues] || form[field as keyof FormValues].trim() === '')
        
        if (emptyFields.length > 0) {
            Alert.alert('Missing Fields', `Please fill in all required fields: ${emptyFields.join(', ')}`)
            return
        }

        setIsLoading(true)
        const num = (v: string) => parseFloat(v) || 0

        try {
            let res
            const payload = {
                source: 'manual',
                N: num(form.N),
                P: num(form.P),
                K: num(form.K),
                temperature: num(form.temperature),
                humidity: num(form.humidity),
                ph: num(form.ph),
            }

            if (mode === 'crop') {
                const cropPayload = { ...payload, rainfall: num(form.rainfall) }
                res = isGuest 
                    ? await api.guestPredictCrop(cropPayload)
                    : await api.predictCrop(accessToken, cropPayload)
            } else if (mode === 'suitability') {
                if (!form.cropName) {
                    Alert.alert('Error', 'Select a crop first.')
                    setIsLoading(false)
                    return
                }
                const suitPayload = { ...payload, crop_name: form.cropName, rainfall: num(form.rainfall) }
                res = isGuest
                    ? await api.guestPredictSuitability(suitPayload)
                    : await api.predictSuitability(accessToken, suitPayload)
            } else {
                const fertPayload = {
                    ...payload,
                    crop_name: form.cropName,
                    soil_type: form.soilType,
                    moisture: num(form.moisture),
                    rainfall: num(form.rainfall) || 100,
                }
                res = isGuest
                    ? await api.guestPredictFertilizer(fertPayload)
                    : await api.predictFertilizer(accessToken, fertPayload)
            }
            // Store result and navigate to output page
            setResult(res, mode, 'manual')
            router.push('/(app)/output')
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
                            Manual Input
                        </Text>
                        <Text className="text-on-surface-variant font-body opacity-80">
                            Enter soil parameters manually for prediction.
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
                                onPress={() => setMode(tab.id)}
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
                                <FieldInput label="Humidity (%)" value={form.humidity} onChange={setField('humidity')} unit="%" placeholder="80" />
                            </View>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <FieldInput label="Soil pH" value={form.ph} onChange={setField('ph')} unit="0–14" placeholder="6.5" />
                            </View>
                            <View className="flex-1">
                                <FieldInput label="EC (mS/cm)" value={form.ec} onChange={setField('ec')} unit="mS/cm" placeholder="1.5" />
                            </View>
                        </View>
                        {mode !== 'fertilizer' && (
                            <FieldInput label="Rainfall (mm)" value={form.rainfall} onChange={setField('rainfall')} unit="mm" placeholder="200" />
                        )}
                        {mode === 'fertilizer' && (
                            <FieldInput label="Moisture (%)" value={form.moisture} onChange={setField('moisture')} unit="%" placeholder="50" />
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
                </View>
            </ScrollView>
        </View>
    )
}
