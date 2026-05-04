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
import notifee, { AndroidImportance } from '@notifee/react-native';
import { updateDocument } from '@src/shared/services/firebase/firestore';

const DEFAULT_CHANNEL_ID = 'default';

export async function ensureAndroidNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: 'Notificaciones generales',
    importance: AndroidImportance.HIGH,
  });
}

export async function displayForegroundNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const title = remoteMessage.notification?.title ?? remoteMessage.data?.title;
  const body = remoteMessage.notification?.body ?? remoteMessage.data?.body;

  if (!title && !body) {
    return;
  }

  await notifee.displayNotification({
    title: typeof title === 'string' ? title : undefined,
    body: typeof body === 'string' ? body : undefined,
    data: remoteMessage.data,
    android: {
      channelId: DEFAULT_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

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
