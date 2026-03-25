import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/authStore'

export default function AppLayout() {
    const router = useRouter()
    const { accessToken, loadFromStorage } = useAuthStore()

    useEffect(() => {
        const init = async () => {
            await loadFromStorage()
            if (!useAuthStore.getState().accessToken) {
                router.replace('/(auth)/landing')
            }
        }
        init()
    }, [])

    if (!accessToken) return null

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="history" />
            <Stack.Screen name="predict" />
        </Stack>
    )
}