import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { AuthProvider, useAuth } from '@src/shared/hooks/useAuth';
import {
  getInitialNotificationMessage,
  onLocalNotificationPressed,
  onNotificationOpened,
  type NotificationData,
} from '@src/shared/services/notifications/fcm';
import type { Role } from '@src/shared/types/models';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function getReportNotificationRoute(data: NotificationData, role: Role): string | null {
  const reporteId = data?.reporteId;
  if (typeof reporteId !== 'string') {
    return null;
  }

  if (role === 'adoptante') {
    return `/(adoptante)/reportes/${reporteId}`;
  }

  if (role === 'personal') {
    return `/(personal)/(tabs)/reportes/${reporteId}`;
  }

  return null;
}

function RootLayoutNav(): React.JSX.Element {
  const { authUser, userProfile, loading, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inactiveSignOutStarted = useRef<boolean>(false);
  const lastNotificationRoute = useRef<string | null>(null);

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

    if (userProfile.activo === false) {
      if (!inactiveSignOutStarted.current) {
        inactiveSignOutStarted.current = true;
        signOut().catch(() => undefined);
      }
      if (firstSegment !== '(auth)') {
        router.replace('/(auth)/login' as never);
      }
      return;
    }

    inactiveSignOutStarted.current = false;

    const role = userProfile.role;

    if (role === 'adoptante' && firstSegment !== '(adoptante)') {
      router.replace('/(adoptante)/' as never);
    } else if (role === 'personal' && firstSegment !== '(personal)') {
      router.replace('/(personal)/' as never);
    } else if (role === 'superadmin' && firstSegment !== '(superadmin)') {
      router.replace('/(superadmin)/' as never);
    }
  }, [authUser, userProfile, loading, segments, signOut, router]);

  useEffect(() => {
    if (loading || !userProfile || userProfile.activo === false) return;

    const openNotificationData = (data: NotificationData): void => {
      const route = getReportNotificationRoute(data, userProfile.role);
      if (!route || lastNotificationRoute.current === route) return;

      lastNotificationRoute.current = route;
      router.push(route as never);
    };

    const unsubscribeNotificationOpened = onNotificationOpened((message) => {
      openNotificationData(message.data);
    });
    const unsubscribeLocalNotificationPressed = onLocalNotificationPressed(openNotificationData);

    getInitialNotificationMessage()
      .then((message) => {
        openNotificationData(message?.data);
      })
      .catch((error) => {
        console.warn('No se pudo abrir la notificacion inicial.', error);
      });

    return () => {
      unsubscribeNotificationOpened();
      unsubscribeLocalNotificationPressed();
    };
  }, [loading, userProfile, router]);

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
