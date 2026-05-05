import {
  getMessaging,
  getToken,
  getInitialNotification,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import { updateDocument } from '@src/shared/services/firebase/firestore';

const DEFAULT_CHANNEL_ID = 'default';
export type NotificationData = Record<string, string | object | number> | undefined;

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
  const reporteId = remoteMessage.data?.reporteId;
  const type = remoteMessage.data?.type;
  const notificationId = typeof reporteId === 'string'
    ? `${typeof type === 'string' ? type : 'notification'}-${reporteId}`
    : remoteMessage.messageId;

  if (!title && !body) {
    return;
  }

  await notifee.displayNotification({
    id: notificationId,
    title: typeof title === 'string' ? title : undefined,
    body: typeof body === 'string' ? body : undefined,
    data: remoteMessage.data,
    android: {
      channelId: DEFAULT_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
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

export function onLocalNotificationPressed(
  callback: (data: NotificationData) => void
): () => void {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      callback(detail.notification?.data);
    }
  });
}

export function getInitialNotificationMessage(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
  const messaging = getMessaging();
  return getInitialNotification(messaging);
}
