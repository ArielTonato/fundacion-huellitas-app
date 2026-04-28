import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  signUp as firebaseSignUp,
  getUserProfile,
  onAuthStateChanged,
  type AuthUser,
} from '@src/shared/services/firebase/auth';
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
      setLoading(true);
      try {
        const user = await firebaseSignUp(email, password, nombre, telefono, fotoPerfilLocalUri);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    await firebaseSignOut();
    setUserProfile(null);
  }, []);

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
