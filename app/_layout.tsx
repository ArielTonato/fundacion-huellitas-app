import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { AuthProvider, useAuth } from '@src/shared/hooks/useAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav(): React.JSX.Element {
  const { authUser, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    const firstSegment = segments[0] as string;

    if (!authUser) {
      if (firstSegment !== '(auth)') {
        router.replace('/(auth)/login' as never);
      }
      return;
    }

    if (!userProfile) return;

    const role = userProfile.role;

    if (role === 'adoptante' && firstSegment !== '(adoptante)') {
      router.replace('/(adoptante)/' as never);
    } else if (role === 'personal' && firstSegment !== '(personal)') {
      router.replace('/(personal)/' as never);
    } else if (role === 'superadmin' && firstSegment !== '(superadmin)') {
      router.replace('/(superadmin)/' as never);
    }
  }, [authUser, userProfile, loading, segments]);

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(adoptante)" />
        <Stack.Screen name="(personal)" />
        <Stack.Screen name="(superadmin)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
