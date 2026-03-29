import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { api } from '../../lib/api';

export default function ManualInput() {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ph, setPh] = useState('');
  const [N, setN] = useState('');
  const [P, setP] = useState('');
  const [K, setK] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [loading, setLoading] = useState(false);

  const parseNumber = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const handlePredict = async () => {
    const body: Record<string, number> = {};
    const t = parseNumber(temperature);
    const h = parseNumber(humidity);
    const p = parseNumber(ph);
    const n = parseNumber(N);
    const pp = parseNumber(P);
    const k = parseNumber(K);
    const r = parseNumber(rainfall);

    if (t === undefined || h === undefined || p === undefined || n === undefined || pp === undefined || k === undefined) {
      return Alert.alert('Validation', 'Please fill temperature, humidity, pH, N, P, and K with numbers.');
    }

    body.temperature = t;
    body.humidity = h;
    body.ph = p;
    body.N = n;
    body.P = pp;
    body.K = k;
    if (r !== undefined) body.rainfall = r;

    setLoading(true);
    try {
      const res = await api.guestPredictCrop(body);
      Alert.alert('Prediction', `Recommended crop: ${res.recommended_crop}\nConfidence: ${Math.round(res.confidence * 100)}%`);
    } catch (e) {
      Alert.alert('Prediction failed', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const InputRow = ({ label, value, onChange, placeholder }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string }) => (
    <View className='mb-4'>
      <Text className='font-semibold text-base mb-1'>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType='numeric'
        className='border border-gray-300 px-3 py-2 rounded'
      />
    </View>
  );

  return (
    <View className='flex-1 bg-background dark:bg-surface-dark'>
      <ScrollView className='p-6'>
        <Text className='text-2xl font-headline font-extrabold mb-4'>Manual Input</Text>
        <InputRow label='Temperature (°C)' value={temperature} onChange={setTemperature} placeholder='e.g. 24.5' />
        <InputRow label='Humidity (%)' value={humidity} onChange={setHumidity} placeholder='e.g. 45' />
        <InputRow label='pH' value={ph} onChange={setPh} placeholder='e.g. 6.8' />
        <InputRow label='Nitrogen (N)' value={N} onChange={setN} placeholder='e.g. 20' />
        <InputRow label='Phosphorus (P)' value={P} onChange={setP} placeholder='e.g. 15' />
        <InputRow label='Potassium (K)' value={K} onChange={setK} placeholder='e.g. 30' />
        <InputRow label='Rainfall (mm) — optional' value={rainfall} onChange={setRainfall} placeholder='e.g. 5' />

        <Pressable onPress={handlePredict} className='mt-4 bg-primary px-4 py-3 rounded' disabled={loading}>
          <Text className='text-on-primary font-semibold text-center'>{loading ? 'Predicting…' : 'Predict'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
