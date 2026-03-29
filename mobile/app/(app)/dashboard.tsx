import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api, SensorData } from '../../lib/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/StatCard';
import { HealthMeter } from '../../components/HealthMeter';
import { Card } from '../../components/Card';

export default function Dashboard() {
    const { accessToken, username } = useAuthStore();
    const accessExpiry = useAuthStore((s) => s.accessExpiry ?? null);
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
            const res = await api.latestSensor(accessToken);
            setData(res);
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
            const res = await api.predictCrop(accessToken, body);
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

    const router = useRouter();

    const handleManualInput = () => {
        router.push('/manual-input');
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
                        <View className='w-10 h-10 rounded-full bg-primary-fixed dark:bg-primary-fixed items-center justify-center overflow-hidden'>
                            <Text className='text-xl'>👨‍🌾</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className='flex-1'
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#006b2c' />}
            >
                <View className='pt-6 pb-32 px-6'>
                    {/* Welcome Section */}
                    <View className='mb-10'>
                        <Text className='font-headline font-extrabold text-4xl text-on-surface dark:text-on-surface-dark tracking-tight leading-tight'>
                            {getGreeting()},{'\n'}
                            <Text className='text-primary dark:text-primary-dark'>{username || 'Farmer'}!</Text>
                        </Text>
                        <Text className='mt-2 text-on-surface-variant dark:text-on-surface-variant-dark font-body text-lg'>
                            Your crops are thriving today. Here's your real-time soil health overview.
                        </Text>
                    </View>

                    {/* Hero Bento Grid */}
                    <View className='flex-row gap-6 mb-12'>
                        {/* Featured Field Status - 2/3 width */}
                        <Card variant='elevated' padding='lg' className='flex-[2] min-h-[240px]'>
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

                        {/* pH Health Meter - 1/3 width */}
                        <View className='flex-1 bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg border-l-4 border-tertiary dark:border-tertiary-dark shadow-sm'>
                            <View className='flex-row justify-between items-start mb-6'>
                                <View className='w-12 h-12 bg-tertiary-fixed dark:bg-tertiary-fixed-dark rounded-xl items-center justify-center'>
                                    <Text className='text-2xl'>🧪</Text>
                                </View>
                                <Text className='text-tertiary dark:text-tertiary-dark font-headline font-bold'>
                                    {data?.ph && data.ph >= 6.0 && data.ph <= 7.5 ? 'Optimal' : 'Monitor'}
                                </Text>
                            </View>
                            <Text className='text-on-surface-variant dark:text-on-surface-variant-dark font-label font-medium uppercase text-xs tracking-widest mb-1'>
                                Soil pH Level
                            </Text>
                            <Text className='text-5xl font-black font-headline text-on-surface dark:text-on-surface-dark mb-8'>
                                {data?.ph?.toFixed(1) ?? '--'}
                            </Text>
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
                                value={`${data?.temperature?.toFixed(1) ?? '--'}°C`}
                                icon='🌡️'
                                trend='+2.1%'
                                color='orange'
                                className='mr-4'
                            />
                            <StatCard
                                label='Humidity'
                                value={`${data?.humidity?.toFixed(0) ?? '--'}%`}
                                icon='💧'
                                trend='-0.5%'
                                color='blue'
                                className='mr-4'
                            />
                            <StatCard
                                label='Nitrogen (N)'
                                value={`${data?.N?.toFixed(0) ?? '--'}`}
                                icon='🌿'
                                trend='Stable'
                                color='green'
                                className='mr-4'
                            />
                            <StatCard
                                label='Phosphorus (P)'
                                value={`${data?.P?.toFixed(0) ?? '--'}`}
                                icon='🧪'
                                trend='+12%'
                                color='purple'
                                className='mr-4'
                            />
                            <StatCard
                                label='Potassium (K)'
                                value={`${data?.K?.toFixed(0) ?? '--'}`}
                                icon='🌾'
                                trend='-2.4%'
                                color='amber'
                            />
                        </ScrollView>
                    </View>

                    {/* Secondary Insights Area */}
                    <View className='bg-surface-container-low dark:bg-surface-container-low-dark rounded-lg p-1'>
                        <View className='flex-row gap-1'>
                            {/* Hydration Forecast */}
                            <View className='flex-1 bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg'>
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
                            <View className='flex-1 bg-surface-container-lowest dark:bg-surface-container-lowest-dark p-6 rounded-lg items-center justify-center'>
                                <View className='w-16 h-16 bg-primary-fixed dark:bg-primary-fixed-dark rounded-full items-center justify-center mb-4'>
                                    <Text className='text-3xl'>💡</Text>
                                </View>
                                <Text className='font-headline font-bold text-lg text-on-surface dark:text-on-surface-dark text-center'>
                                    Predictive Action
                                </Text>
                                <Text className='text-on-surface-variant dark:text-on-surface-variant-dark font-body text-sm mt-2 text-center max-w-[240px]'>
                                    Nitrogen levels are peaking. Delay fertilization for 48 hours to prevent runoff.
                                </Text>
                                <Pressable className='mt-6'>
                                    <Text className='text-primary dark:text-primary-dark font-label font-bold text-sm'>
                                        View Full Analysis
                                    </Text>
                                </Pressable>
                            </View>
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