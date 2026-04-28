import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  getAuth,
  signInWithEmailAndPassword,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import type { Role, User } from '@src/shared/types/models';
import { uploadProfileImage } from './storage';

export type AuthUser = FirebaseAuthTypes.User;

interface FirebaseAuthError extends Error {
  code?: string;
}

type UserCreationData = {
  uid: string;
  email: string;
  nombre: string;
  role: Role;
  creadoEn: unknown;
  telefono?: string;
  fotoPerfilUrl?: string;
};

type UserPhoneIndex = {
  uid: string;
  telefono: string;
  creadoEn: unknown;
};

const DUPLICATE_PHONE_ERROR_MESSAGE = 'Ya existe un usuario con ese numero de telefono.';

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

function getPhoneIndexRef(db: ReturnType<typeof getFirestore>, phone: string) {
  return doc(db, 'userPhones', phone);
}

function getCreateAccountErrorMessage(error: unknown, hasPhone: boolean): string {
  if (error instanceof Error) {
    const authError = error as FirebaseAuthError;

    if (authError.code === 'auth/email-already-in-use') {
      return 'Ya existe una cuenta con ese correo electronico.';
    }

    if (authError.code === 'auth/invalid-email') {
      return 'Ingrese un correo electronico valido.';
    }

    if (authError.code === 'auth/weak-password') {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (hasPhone && (authError.code === 'permission-denied' || authError.code === 'firestore/permission-denied')) {
      return DUPLICATE_PHONE_ERROR_MESSAGE;
    }

    return error.message;
  }

  return 'No se pudo crear la cuenta.';
}

function buildUserPhoneIndex(phone: string, uid: string): UserPhoneIndex {
  return {
    uid,
    telefono: phone,
    creadoEn: serverTimestamp(),
  };
}

export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void
): () => void {
  const auth = getAuth();
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const auth = getAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user) {
    throw new Error('No se pudo iniciar sesion.');
  }
  return credential.user;
}

export async function signUp(
  email: string,
  password: string,
  nombre: string,
  telefono?: string,
  fotoPerfilLocalUri?: string
): Promise<AuthUser> {
  const auth = getAuth();
  const db = getFirestore();
  const normalizedPhone = telefono ? normalizePhoneNumber(telefono) : undefined;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (!credential.user) {
      throw new Error('No se pudo crear la cuenta.');
    }

    const userRef = doc(db, 'users', credential.user.uid);
    const userData: UserCreationData = {
      uid: credential.user.uid,
      email,
      nombre,
      role: 'adoptante' as Role,
      creadoEn: serverTimestamp(),
    };

    if (normalizedPhone) {
      userData.telefono = normalizedPhone;
    }

    const batch = writeBatch(db);
    batch.set(userRef, userData);

    if (normalizedPhone) {
      batch.set(getPhoneIndexRef(db, normalizedPhone), buildUserPhoneIndex(normalizedPhone, credential.user.uid));
    }

    if (fotoPerfilLocalUri) {
      userData.fotoPerfilUrl = await uploadProfileImage(credential.user.uid, fotoPerfilLocalUri);
      batch.set(userRef, userData);
    }

    await batch.commit();

    return credential.user;
  } catch (error) {
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch {
        await firebaseSignOut(auth);
      }
    }

    throw new Error(getCreateAccountErrorMessage(error, Boolean(normalizedPhone)));
  }
}

export async function signOut(): Promise<void> {
  const auth = getAuth();
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists) {
    return null;
  }
  return { uid: userDoc.id, ...userDoc.data() } as User;
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const db = getFirestore();
  const auth = getAuth();
  const userRef = doc(db, 'users', uid);
  const updateData: Partial<User> = { ...data };
  const currentUserDoc = await getDoc(userRef);

  if (!currentUserDoc.exists) {
    throw new Error('No se pudo actualizar el perfil porque el usuario no existe.');
  }

  const currentUserData = currentUserDoc.data() as User;
  const currentPhone = currentUserData.telefono ? normalizePhoneNumber(currentUserData.telefono) : '';

  if (typeof updateData.telefono === 'string' && updateData.telefono.trim().length > 0) {
    const normalizedPhone = normalizePhoneNumber(updateData.telefono);
    updateData.telefono = normalizedPhone;

    const batch = writeBatch(db);
    batch.set(userRef, updateData, { merge: true });

    if (currentPhone && currentPhone !== normalizedPhone) {
      batch.delete(getPhoneIndexRef(db, currentPhone));
    }

    batch.set(getPhoneIndexRef(db, normalizedPhone), buildUserPhoneIndex(normalizedPhone, uid));
    await batch.commit();
  } else {
    await setDoc(userRef, updateData, { merge: true });
  }

  // Update Auth Email if provided
  if (updateData.email && auth.currentUser && updateData.email !== auth.currentUser?.email) {
    await auth.currentUser?.updateEmail(updateData.email);
  }
}

export async function updatePassword(password: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    await user.updatePassword(password);
  } else {
    throw new Error('Usuario no autenticado.');
  }
}

export async function getIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado.');
  }
  return user.getIdToken();
}
