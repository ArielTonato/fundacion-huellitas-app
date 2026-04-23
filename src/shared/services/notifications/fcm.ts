import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { updateDocument } from '@src/shared/services/firebase/firestore';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function registerFcmToken(uid: string): Promise<void> {
  const token = await messaging().getToken();
  await updateDocument('users', uid, { fcmToken: token });
}

export function onFcmTokenRefresh(uid: string): () => void {
  return messaging().onTokenRefresh(async (token) => {
    await updateDocument('users', uid, { fcmToken: token });
  });
}

export function onForegroundMessage(
  callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
  return messaging().onMessage(callback);
}

export function onNotificationOpened(
  callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
  return messaging().onNotificationOpenedApp(callback);
}
