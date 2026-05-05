import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  signUp as firebaseSignUp,
  getUserProfile,
  onAuthStateChanged,
  type AuthUser,
  deleteAccount as firebaseDeleteAccount,
} from '@src/shared/services/firebase/auth';
import { updateDocument } from '@src/shared/services/firebase/firestore';
import {
  displayForegroundNotification,
  ensureAndroidNotificationChannel,
  onFcmTokenRefresh,
  onForegroundMessage,
  registerFcmToken,
  requestNotificationPermission,
} from '@src/shared/services/notifications/fcm';
import type { User } from '@src/shared/types/models';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthContextValue {
  authUser: AuthUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nombre: string,
    telefono?: string,
    fotoPerfilLocalUri?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

interface NotificationCleanup {
  unsubscribeTokenRefresh: () => void;
  unsubscribeForegroundMessages: () => void;
}

async function setupNotifications(uid: string): Promise<NotificationCleanup | undefined> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return undefined;
  }

  await ensureAndroidNotificationChannel();
  await registerFcmToken(uid);

  const unsubscribeTokenRefresh = onFcmTokenRefresh(uid);
  const unsubscribeForegroundMessages = onForegroundMessage((remoteMessage) => {
    displayForegroundNotification(remoteMessage).catch((error) => {
      console.warn('No se pudo mostrar la notificacion en primer plano.', error);
    });
  });

  return { unsubscribeTokenRefresh, unsubscribeForegroundMessages };
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let notificationCleanup: NotificationCleanup | undefined;
    let notificationSetupId = 0;

    const releaseNotifications = (): void => {
      notificationSetupId += 1;
      notificationCleanup?.unsubscribeTokenRefresh();
      notificationCleanup?.unsubscribeForegroundMessages();
      notificationCleanup = undefined;
    };

    const unsubscribe = onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        releaseNotifications();
        const currentSetupId = notificationSetupId;
        setupNotifications(user.uid)
          .then((cleanup) => {
            if (currentSetupId !== notificationSetupId) {
              cleanup?.unsubscribeTokenRefresh();
              cleanup?.unsubscribeForegroundMessages();
              return;
            }
            notificationCleanup = cleanup;
          })
          .catch((error) => {
            console.warn('No se pudo registrar el token FCM.', error);
          });
      } else {
        releaseNotifications();
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      releaseNotifications();
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const user = await firebaseSignIn(email, password);
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      nombre: string,
      telefono?: string,
      fotoPerfilLocalUri?: string
    ): Promise<void> => {
      const user = await firebaseSignUp(email, password, nombre, telefono, fotoPerfilLocalUri);
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (authUser) {
      try {
        await updateDocument('users', authUser.uid, { fcmToken: null });
      } catch (error) {
        console.warn('No se pudo limpiar el token FCM antes de cerrar sesion.', error);
      }
    }
    await firebaseSignOut();
    setUserProfile(null);
  }, [authUser]);

  const updateProfile = useCallback(
    async (data: Partial<User>): Promise<void> => {
      if (!authUser) throw new Error('Usuario no autenticado.');
      const { updateUserProfile } = await import('@src/shared/services/firebase/auth');
      await updateUserProfile(authUser.uid, data);
      const profile = await getUserProfile(authUser.uid);
      setUserProfile(profile);
    },
    [authUser]
  );

  const updateUserPassword = useCallback(async (password: string): Promise<void> => {
    const { updatePassword } = await import('@src/shared/services/firebase/auth');
    await updatePassword(password);
  }, []);

  const deleteAccount = useCallback(async (): Promise<void> => {
    await firebaseDeleteAccount();
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updateUserPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return context;
}
