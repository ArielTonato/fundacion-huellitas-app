import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore';
import type { Role, User } from '@src/shared/types/models';
import { uploadProfileImage } from './storage';

export type AuthUser = FirebaseAuthTypes.User;

type UserCreationData = {
  uid: string;
  email: string;
  nombre: string;
  role: Role;
  creadoEn: unknown;
  telefono?: string;
  fotoPerfilUrl?: string;
};

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

  if (telefono) {
    userData.telefono = telefono;
  }

  if (fotoPerfilLocalUri) {
    userData.fotoPerfilUrl = await uploadProfileImage(credential.user.uid, fotoPerfilLocalUri);
  }

  await setDoc(userRef, userData);

  return credential.user;
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
  
  // Update Firestore
  await setDoc(userRef, data, { merge: true });

  // Update Auth Email if provided
  if (data.email && auth.currentUser && data.email !== auth.currentUser?.email) {
    await auth.currentUser?.updateEmail(data.email);
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
