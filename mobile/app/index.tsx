import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Redirect to dashboard if authenticated, otherwise to landing
  if (accessToken) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/landing" />;
}
