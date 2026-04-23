import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { User, Role } from '@src/shared/types/models';

export type AuthUser = FirebaseAuthTypes.User;

export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void
): () => void {
  return auth().onAuthStateChanged(callback);
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const credential = await auth().signInWithEmailAndPassword(email, password);
  if (!credential.user) {
    throw new Error('No se pudo iniciar sesion.');
  }
  return credential.user;
}

export async function signUp(
  email: string,
  password: string,
  nombre: string,
  telefono?: string
): Promise<AuthUser> {
  const credential = await auth().createUserWithEmailAndPassword(email, password);
  if (!credential.user) {
    throw new Error('No se pudo crear la cuenta.');
  }

  await firestore().collection('users').doc(credential.user.uid).set({
    uid: credential.user.uid,
    email,
    nombre,
    role: 'adoptante' as Role,
    telefono: telefono ?? null,
    creadoEn: firestore.FieldValue.serverTimestamp(),
  });

  return credential.user;
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const doc = await firestore().collection('users').doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  return { uid: doc.id, ...doc.data() } as User;
}

export async function getIdToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado.');
  }
  return user.getIdToken();
}
