import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isGuest = useAuthStore((state) => state.isGuest);

  // Redirect based on authentication status
  if (accessToken) {
    // Guest users go to predict page, regular users go to dashboard
    return <Redirect href={isGuest ? "/(app)/predict" : "/(app)/dashboard"} />;
  }

  return <Redirect href="/(auth)/landing" />;
}
