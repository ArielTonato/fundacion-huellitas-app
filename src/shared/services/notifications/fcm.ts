import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  AuthorizationStatus,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { updateDocument } from '@src/shared/services/firebase/firestore';

export async function requestNotificationPermission(): Promise<boolean> {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function registerFcmToken(uid: string): Promise<void> {
  const messaging = getMessaging();
  const token = await getToken(messaging);
  await updateDocument('users', uid, { fcmToken: token });
}

export function onFcmTokenRefresh(uid: string): () => void {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, async (token) => {
    await updateDocument('users', uid, { fcmToken: token });
  });
}

export function onForegroundMessage(
  callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
  const messaging = getMessaging();
  return onMessage(messaging, callback);
}

export function onNotificationOpened(
  callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
  const messaging = getMessaging();
  return onNotificationOpenedApp(messaging, callback);
}
