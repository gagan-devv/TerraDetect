import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api, SensorData } from '../../lib/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSensorStore } from '../../store/sensorStore';
import { StatCard } from '../../components/StatCard';
import { HealthMeter } from '../../components/HealthMeter';
import { Card } from '../../components/Card';
import { ProfileDropdown } from '../../components/ProfileDropdown';

export default function Dashboard() {
    const router = useRouter();
    const { accessToken, username } = useAuthStore();
    const accessExpiry = useAuthStore((s) => s.accessExpiry ?? null);
    const { setLatest } = useSensorStore();
    const [data, setData] = useState<SensorData | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fabOpen, setFabOpen] = useState(false);
    const [sessionRemaining, setSessionRemaining] = useState<number | null>(null);

    const fetchData = async () => {
        if (!accessToken) return;
        try {
            setError(null);
            // Try to get latest sensor data
            try {
                const res = await api.latestSensor(accessToken);
                console.log('=== Latest sensor API response ===');
                console.log('Full response:', JSON.stringify(res, null, 2));
                
                // Extract data from nested structure if present
                const sensorValues = (res as any).data || res;
                console.log('Extracted sensor values:', JSON.stringify(sensorValues, null, 2));
                
                // Map lowercase field names to uppercase
                const normalizedData = {
                    temperature: sensorValues.temperature,
                    humidity: sensorValues.humidity,
                    ph: sensorValues.ph,
                    N: sensorValues.N ?? sensorValues.n ?? 0,
                    P: sensorValues.P ?? sensorValues.p ?? 0,
                    K: sensorValues.K ?? sensorValues.k ?? 0,
                    rainfall: sensorValues.rainfall ?? 0,
                    timestamp: (res as any).timestamp || new Date().toISOString(),
                };
                
                console.log('=== Normalized data ===');
                console.log('temperature:', normalizedData.temperature);
                console.log('humidity:', normalizedData.humidity);
                console.log('ph:', normalizedData.ph);
                console.log('N:', normalizedData.N);
                console.log('P:', normalizedData.P);
                console.log('K:', normalizedData.K);
                console.log('Setting data state...');
                setData(normalizedData);
                console.log('Data state set successfully');
                
                // Update sensor store with the latest data
                setLatest({
                    temperature: normalizedData.temperature,
                    humidity: normalizedData.humidity,
                    ph: normalizedData.ph,
                    N: normalizedData.N,
                    P: normalizedData.P,
                    K: normalizedData.K,
                    ec: sensorValues.ec ?? 0,
                    moisture: sensorValues.moisture ?? 0,
                }, normalizedData.timestamp);
            } catch (latestError) {
                // If no latest data, try to get from history
                console.log('=== No latest sensor data, trying history ===');
                console.log('Latest error:', latestError);
                try {
                    const historyRes = await api.sensorHistory(accessToken, 1, 1);
                    console.log('History response:', JSON.stringify(historyRes, null, 2));
                    if (historyRes.history && historyRes.history.length > 0) {
                        // Convert history item to SensorData format
                        const lastReading = historyRes.history[0];
                        console.log('Last reading from history:', JSON.stringify(lastReading, null, 2));
                        const sensorData = {
                            temperature: lastReading.temperature,
                            humidity: lastReading.humidity,
                            ph: lastReading.ph,
                            N: lastReading.N,
                            P: lastReading.P,
                            K: lastReading.K,
                            rainfall: 0, // History doesn't have rainfall
                            timestamp: lastReading.timestamp,
                        };
                        console.log('=== Setting data from history ===');
                        console.log('temperature:', sensorData.temperature);
                        console.log('humidity:', sensorData.humidity);
                        console.log('ph:', sensorData.ph);
                        console.log('N:', sensorData.N);
                        console.log('P:', sensorData.P);
                        console.log('K:', sensorData.K);
                        setData(sensorData);
                        console.log('Data state set from history successfully');
                        // Update sensor store with history data
                        setLatest({
                            temperature: lastReading.temperature,
                            humidity: lastReading.humidity,
                            ph: lastReading.ph,
                            N: lastReading.N,
                            P: lastReading.P,
                            K: lastReading.K,
                            ec: lastReading.ec ?? 0,
                            moisture: lastReading.moisture ?? 0,
                        }, lastReading.timestamp);
                    } else {
                        throw new Error('No sensor data available');
                    }
                } catch (historyError) {
                    throw latestError; // Throw the original error if history also fails
                }
            }
        } catch (err: unknown) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : String(err) || 'Failed to load sensor data');
        } finally {
            setLoading(false);
        }
    };

    const handlePredictSnapshot = async () => {
        if (!accessToken) return Alert.alert('Not signed in');
        if (!data) return Alert.alert('No sensor data', 'Refresh to load latest sensor values before predicting.');
        try {
            const body = {
                temperature: data.temperature,
                humidity: data.humidity,
                ph: data.ph,
                N: data.N,
                P: data.P,
                K: data.K,
            };
            const res = await api.predictCrop(accessToken!, body);
            Alert.alert('Prediction', `Recommended crop: ${res.recommended_crop}\nConfidence: ${Math.round(res.confidence * 100)}%`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert('Prediction failed', msg || 'Unknown error');
        }
    };

    const handleClaimDevice = () => {
        Alert.alert('Claim Device', 'To claim a device, go to Settings → Devices in the app.');
    };

    const handleLogout = async () => {
        const store = useAuthStore.getState();
        await store.logout();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        // Set up 30-second polling for real-time updates
        const interval = setInterval(fetchData, 30000);
        // Session countdown
        let sessionTimer: ReturnType<typeof setInterval> | null = null;
        if (accessExpiry) {
            const update = () => {
                const rem = Math.max(0, Math.floor((accessExpiry - Date.now()) / 1000));
                setSessionRemaining(rem);
                if (rem <= 0) {
                    const store = useAuthStore.getState();
                    void store.logout();
                }
            };
            update();
            sessionTimer = setInterval(update, 1000);
        } else {
            setSessionRemaining(null);
        }
        return () => {
            clearInterval(interval);
            if (sessionTimer) clearInterval(sessionTimer);
        };
    }, [accessToken]);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Loading skeleton
    if (loading) {
        return (
            <View className='flex-1 bg-background dark:bg-surface-dark'>
                {/* Top App Bar Skeleton */}
                <View className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm'>
                    <View className='flex-row justify-between items-center px-6 py-4'>
                        <View className='flex-row items-center gap-3'>
                            <View className='w-8 h-8 bg-surface-container dark:bg-surface-container-dark rounded-full' />
                            <View className='w-32 h-6 bg-surface-container dark:bg-surface-container-dark rounded-lg' />
                        </View>
                        <View className='flex-row items-center gap-4'>
                            <View className='w-10 h-10 bg-surface-container dark:bg-surface-container-dark rounded-full' />
                            <View className='w-10 h-10 bg-surface-container dark:bg-surface-container-dark rounded-full' />
                        </View>
                    </View>
                </View>

                <ScrollView className='flex-1'>
                    <View className='pt-6 pb-32 px-6'>
                        <View className='mb-10'>
                            <View className='h-12 w-64 bg-surface-container dark:bg-surface-container-dark rounded-lg mb-2' />
                            <View className='h-6 w-full bg-surface-container dark:bg-surface-container-dark rounded-lg' />
                        </View>
                        <View className='h-64 bg-surface-container dark:bg-surface-container-dark rounded-lg mb-6' />
                        <View className='flex-row gap-4'>
                            <View className='flex-1 h-32 bg-surface-container dark:bg-surface-container-dark rounded-lg' />
                            <View className='flex-1 h-32 bg-surface-container dark:bg-surface-container-dark rounded-lg' />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View className='flex-1 bg-background dark:bg-surface-dark'>
                {/* Top App Bar */}
                <View className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm'>
                    <View className='flex-row justify-between items-center px-6 py-4'>
                        <View className='flex-row items-center gap-3'>
                            <Text className='text-primary dark:text-primary-dark text-3xl'>🌱</Text>
                            <Text className='font-headline font-bold text-2xl text-primary dark:text-primary-dark tracking-tight'>
                                TerraDetect
                            </Text>
                            {sessionRemaining !== null && (
                                <Text className='ml-3 text-sm text-on-surface-variant dark:text-on-surface-variant-dark'>
                                    {sessionRemaining > 0 ? `Session: ${Math.floor(sessionRemaining / 60)}m ${sessionRemaining % 60}s` : 'Session expired'}
                                </Text>
                            )}
                        </View>
                        <View className='flex-row items-center gap-4'>
                            <Pressable className='p-2 rounded-full active:bg-primary-fixed/20 dark:active:bg-primary-fixed-dark/20'>
                                <Text className='text-on-surface-variant dark:text-on-surface-variant-dark text-2xl'>🔔</Text>
                            </Pressable>
                            <View className='w-10 h-10 rounded-full bg-surface-container-high dark:bg-surface-container-high-dark items-center justify-center'>
                                <Text className='text-xl'>👨‍🌾</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView
                    className='flex-1'
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View className='pt-6 pb-32 px-6 items-center justify-center min-h-[400px]'>
                        <View className='w-16 h-16 bg-error-container dark:bg-error-container-dark rounded-full items-center justify-center mb-4'>
                            <Text className='text-3xl'>⚠️</Text>
                        </View>
                        <Text className='text-error dark:text-error-dark font-headline text-xl font-bold mb-2 text-center'>
                            Failed to Load Data
                        </Text>
                        <Text className='text-on-surface-variant dark:text-on-surface-variant-dark font-body text-base mb-6 text-center'>
                            {error}
                        </Text>
                        <Pressable
                            onPress={onRefresh}
                            className='bg-primary dark:bg-primary-dark px-6 py-3 rounded-full active:opacity-80'
                        >
                            <Text className='text-on-primary dark:text-on-primary-dark font-label font-semibold'>
                                Retry
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View className='flex-1 bg-background dark:bg-surface-dark'>
            {/* TopAppBar - Glassmorphic */}
            <View className='bg-white/80 dark:bg-slate-900/80 shadow-sm'>
                <View className='flex-row justify-between items-center px-6 py-4 pt-12'>
                    <View className='flex-row items-center gap-3'>
                        <Text className='text-primary dark:text-primary-dark text-3xl'>🌱</Text>
                        <Text className='font-headline font-bold text-2xl text-primary dark:text-primary-dark tracking-tight'>
                            TerraDetect
                        </Text>
                    </View>
                    <View className='flex-row items-center gap-3'>
                        <Pressable className='p-2 rounded-full active:bg-primary-fixed/20 dark:active:bg-primary-fixed/10'>
                            <Text className='text-on-surface-variant dark:text-on-surface-variant-dark text-2xl'>🔔</Text>
                        </Pressable>
                        <ProfileDropdown username={username || 'Farmer'} />
                    </View>
                </View>
            </View>

            <ScrollView
                className='flex-1'
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#006b2c' />}
            >
                <View className='pt-6 pb-32 px-6'>
                    {/* Welcome Section */}
                    <View className='mb-6'>
                        <Text className='font-headline font-extrabold text-4xl text-on-surface dark:text-on-surface-dark tracking-tight leading-tight'>
                            {getGreeting()},{'\n'}
                            <Text className='text-primary dark:text-primary-dark'>{username || 'Farmer'}!</Text>
                        </Text>
                        <Text className='mt-2 text-on-surface-variant dark:text-on-surface-variant-dark font-body text-lg'>
                            Your crops are thriving today. Here's your real-time soil health overview.
                        </Text>
                    </View>

                    {/* Quick Health Status */}
                    {data && (
                        <View className='mb-10 bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg p-4 flex-row items-center justify-between'>
                            <View className='flex-row items-center gap-3'>
                                <View className='w-12 h-12 bg-primary/10 dark:bg-primary-dark/20 rounded-full items-center justify-center'>
                                    <Text className='text-2xl'>
                                        {data.ph >= 6.0 && data.ph <= 7.5 ? '✅' : '⚠️'}
                                    </Text>
                                </View>
                                <View>
                                    <Text className='font-headline font-bold text-base text-on-surface dark:text-on-surface-dark'>
                                        {data.ph >= 6.0 && data.ph <= 7.5 ? 'Optimal Conditions' : 'Needs Attention'}
                                    </Text>
                                    <Text className='font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark'>
                                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            <Pressable 
                                onPress={() => router.push('/(app)/history')}
                                className='px-4 py-2 bg-surface-container-high dark:bg-surface-container-high-dark rounded-full'
                            >
                                <Text className='font-label font-semibold text-xs text-on-surface dark:text-on-surface-dark'>
                                    History
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Hero Bento Grid - Mobile Optimized */}
                    <View className='gap-4 mb-8'>
                        {/* Featured Field Status - Full Width on Mobile */}
                        <Card variant='elevated' padding='lg' className='min-h-[200px]'>
                            <View className='absolute inset-0 z-0 bg-primary/20 dark:bg-primary-dark/20 rounded-lg'>
                                {/* Gradient overlay */}
                                <LinearGradient
                                    colors={(['transparent', 'rgba(25,28,29,0.8)'] as const)}
                                    className='absolute inset-0 rounded-lg'
                                />
                            </View>
                            <View className='relative z-10 h-full justify-end'>
                                <View className='flex-row items-center gap-2 mb-2'>
                                    <View className='px-3 py-1 bg-primary dark:bg-primary-dark rounded-full'>
                                        <Text className='text-on-primary dark:text-on-primary-dark text-[10px] font-bold uppercase tracking-widest'>
                                            Active Monitoring
                                        </Text>
                                    </View>
                                </View>
                                <Text className='text-white font-headline font-bold text-3xl'>
                                    North Sector Beta
                                </Text>
                                <Text className='text-white/80 font-body text-sm'>
                                    Last scan: 2 minutes ago
                                </Text>
                            </View>
                        </Card>

                        {/* pH Health Meter - Full Width on Mobile */}
                        <View className='bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg border-l-4 border-tertiary dark:border-tertiary-dark shadow-sm'>
                            <View className='flex-row justify-between items-start mb-4'>
                                <View className='flex-row items-center gap-3'>
                                    <View className='w-12 h-12 bg-tertiary-fixed dark:bg-tertiary-fixed-dark rounded-xl items-center justify-center'>
                                        <Text className='text-2xl'>🧪</Text>
                                    </View>
                                    <View>
                                        <Text className='text-on-surface-variant dark:text-on-surface-variant-dark font-label font-medium uppercase text-xs tracking-widest'>
                                            Soil pH Level
                                        </Text>
                                        <Text className='text-4xl font-black font-headline text-on-surface dark:text-on-surface-dark'>
                                            {data?.ph?.toFixed(1) ?? '--'}
                                        </Text>
                                    </View>
                                </View>
                                <View className='px-3 py-1 bg-tertiary/10 dark:bg-tertiary-dark/20 rounded-full'>
                                    <Text className='text-tertiary dark:text-tertiary-dark font-headline font-bold text-sm'>
                                        {data?.ph && data.ph >= 6.0 && data.ph <= 7.5 ? 'Optimal' : 'Monitor'}
                                    </Text>
                                </View>
                            </View>
                            <HealthMeter
                                value={data?.ph ?? 7.0}
                                min={0}
                                max={14}
                                optimal={[6.0, 7.5]}
                                label='pH Scale'
                            />
                        </View>
                    </View>

                    {/* Sensor Data Cards Section */}
                    <View className='mb-12'>
                        <View className='flex-row items-center gap-2 mb-6'>
                            <View className='w-1.5 h-6 bg-primary dark:bg-primary-dark rounded-full' />
                            <Text className='font-headline font-bold text-xl text-on-surface dark:text-on-surface-dark'>
                                Real-time Telemetry
                            </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='gap-4'>
                            <StatCard
                                label='Temperature'
                                value={data?.temperature != null ? `${data.temperature.toFixed(1)}°C` : '--°C'}
                                icon='🌡️'
                                trend='+2.1%'
                                color='orange'
                                className='mr-4'
                            />
                            <StatCard
                                label='Humidity'
                                value={data?.humidity != null ? `${data.humidity.toFixed(0)}%` : '--%'}
                                icon='💧'
                                trend='-0.5%'
                                color='blue'
                                className='mr-4'
                            />
                            <StatCard
                                label='Nitrogen (N)'
                                value={data?.N != null ? `${data.N.toFixed(0)}` : '--'}
                                icon='🌿'
                                trend='Stable'
                                color='green'
                                className='mr-4'
                            />
                            <StatCard
                                label='Phosphorus (P)'
                                value={data?.P != null ? `${data.P.toFixed(0)}` : '--'}
                                icon='🧪'
                                trend='+12%'
                                color='purple'
                                className='mr-4'
                            />
                            <StatCard
                                label='Potassium (K)'
                                value={data?.K != null ? `${data.K.toFixed(0)}` : '--'}
                                icon='🌾'
                                trend='-2.4%'
                                color='amber'
                                className='mr-4'
                            />
                            <StatCard
                                label='EC (mS/cm)'
                                value={(data as any)?.ec != null ? `${((data as any).ec).toFixed(1)}` : '--'}
                                icon='⚡'
                                trend='Normal'
                                color='blue'
                            />
                        </ScrollView>
                    </View>

                    {/* Secondary Insights Area - Mobile Optimized */}
                    <View className='gap-4'>
                        {/* Hydration Forecast */}
                        <View className='bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg'>
                            <Text className='font-headline font-bold text-lg text-on-surface dark:text-on-surface-dark mb-4'>
                                Hydration Forecast
                            </Text>
                            <View className='flex-row items-end gap-2 h-32'>
                                <View className='bg-primary/20 dark:bg-primary-dark/20 flex-1 rounded-t-md' style={{ height: '40%' }} />
                                <View className='bg-primary/20 dark:bg-primary-dark/20 flex-1 rounded-t-md' style={{ height: '60%' }} />
                                <View className='bg-primary/40 dark:bg-primary-dark/40 flex-1 rounded-t-md' style={{ height: '80%' }} />
                                <View className='bg-primary dark:bg-primary-dark flex-1 rounded-t-md' style={{ height: '100%' }} />
                                <View className='bg-primary/60 dark:bg-primary-dark/60 flex-1 rounded-t-md' style={{ height: '70%' }} />
                                <View className='bg-primary/30 dark:bg-primary-dark/30 flex-1 rounded-t-md' style={{ height: '50%' }} />
                            </View>
                            <View className='flex-row justify-between mt-4'>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <Text key={day} className='text-[10px] font-bold text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-tighter'>
                                        {day}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        {/* Predictive Action */}
                        <View className='bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg'>
                            <View className='flex-row items-center gap-4 mb-4'>
                                <View className='w-16 h-16 bg-primary-fixed dark:bg-primary-fixed-dark rounded-full items-center justify-center'>
                                    <Text className='text-3xl'>💡</Text>
                                </View>
                                <Text className='font-headline font-bold text-xl text-on-surface dark:text-on-surface-dark flex-1'>
                                    Predictive Action
                                </Text>
                            </View>
                            <Text className='text-on-surface-variant dark:text-on-surface-variant-dark font-body text-base leading-relaxed mb-4'>
                                Nitrogen levels are peaking. Delay fertilization for 48 hours to prevent runoff.
                            </Text>
                            <Pressable 
                                className='bg-primary dark:bg-primary-dark px-6 py-3 rounded-full self-start'
                                onPress={() => router.push('/(app)/output')}
                            >
                                <Text className='text-on-primary dark:text-on-primary-dark font-label font-bold text-sm'>
                                    View Full Analysis →
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button - Quick Actions */}
            <View className='absolute right-6 bottom-6 z-50 items-end'>
                {fabOpen && (
                    <View className='mb-3'>
                        <Pressable onPress={onRefresh} className='bg-surface-container px-4 py-2 rounded-full mb-2 shadow-sm'>
                            <Text className='text-on-surface'>🔄 Refresh</Text>
                        </Pressable>
                        <Pressable onPress={handlePredictSnapshot} className='bg-surface-container px-4 py-2 rounded-full mb-2 shadow-sm'>
                            <Text className='text-on-surface'>📸 Snapshot → Predict</Text>
                        </Pressable>
                        <Pressable onPress={handleClaimDevice} className='bg-surface-container px-4 py-2 rounded-full mb-2 shadow-sm'>
                            <Text className='text-on-surface'>🧷 Claim Device</Text>
                        </Pressable>
                        <Pressable onPress={handleLogout} className='bg-error-container px-4 py-2 rounded-full shadow-sm'>
                            <Text className='text-on-error'>🚪 Logout</Text>
                        </Pressable>
                    </View>
                )}

                <Pressable
                    onPress={() => setFabOpen((s) => !s)}
                    className='w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg'
                >
                    <Text className='text-on-primary text-2xl'>{fabOpen ? '×' : '+'}</Text>
                </Pressable>
            </View>
        </View>
    );
}