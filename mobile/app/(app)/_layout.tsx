import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { useRouter, usePathname } from 'expo-router'
import { useAuthStore } from '../../store/authStore'
import { BottomNavigation } from '../../components/BottomNavigation'

export default function AppLayout() {
    const router = useRouter()
    const pathname = usePathname()
    const { accessToken, isGuest, loadFromStorage } = useAuthStore()
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const init = async () => {
            await loadFromStorage()
            const { accessToken: token, isGuest: guest } = useAuthStore.getState()
            
            // Guest users can only access predict and output pages
            const guestAllowedPages = ['predict', 'output']
            const currentPage = pathname.split('/').pop() || ''
            const isGuestAllowedPage = guestAllowedPages.includes(currentPage)
            
            if (!token) {
                // No token at all - redirect to landing
                router.replace('/(auth)/landing')
            } else if (guest && !isGuestAllowedPage) {
                // Guest trying to access restricted page - redirect to predict
                router.replace('/(app)/predict')
            } else {
                setIsReady(true)
            }
        }
        init()
    }, [pathname])

    if (!isReady) return null

    // For guest users, only show predict/output pages without navigation
    if (isGuest) {
        return (
            <View className="flex-1">
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="predict" />
                    <Stack.Screen name="output" />
                </Stack>
            </View>
        )
    }

    // For authenticated users, show all pages with navigation
    return (
        <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="dashboard" />
                <Stack.Screen name="history" />
                <Stack.Screen name="predict" />
                <Stack.Screen name="output" />
                <Stack.Screen name="profile" />
            </Stack>
            <BottomNavigation />
        </View>
    )
}