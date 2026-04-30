import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { uploadProfileImage } from '@src/shared/services/firebase/storage';
import type { PersonalEditFormData, PersonalFormData } from '../schemas/personalSchema';

interface CrearPersonalRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

interface CrearPersonalResponse {
  uid: string;
}

interface EditarPersonalRequest {
  uid: string;
  nombre: string;
  email: string;
  telefono?: string;
  fotoPerfilUrl?: string;
}

interface PersonalStatusRequest {
  uid: string;
}

interface PersonalStatusResponse {
  success: boolean;
}

interface TestNotificationResponse {
  success: boolean;
  messageId: string;
}

function buildCrearPersonalRequest(data: PersonalFormData): CrearPersonalRequest {
  const telefono = data.telefono?.trim();

  return {
    nombre: data.nombre.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    ...(telefono ? { telefono } : {}),
  };
}

function buildEditarPersonalRequest(data: PersonalEditFormData, fotoPerfilUrl?: string): EditarPersonalRequest {
  const telefono = data.telefono?.trim();

  return {
    uid: data.uid,
    nombre: data.nombre.trim(),
    email: data.email.trim().toLowerCase(),
    ...(telefono ? { telefono } : {}),
    ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
  };
}

export async function crearPersonal(data: PersonalFormData, fotoPerfilLocalUri?: string): Promise<string> {
  const callable = httpsCallable<CrearPersonalRequest, CrearPersonalResponse>(
    getFunctions(),
    'crearPersonal'
  );
  const result = await callable(buildCrearPersonalRequest(data));
  const uid = result.data.uid;

  if (fotoPerfilLocalUri) {
    const fotoPerfilUrl = await uploadProfileImage(uid, fotoPerfilLocalUri);
    await editarPersonal({
      uid,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
    }, fotoPerfilUrl);
  }

  return uid;
}

export async function editarPersonal(data: PersonalEditFormData, fotoPerfilLocalUri?: string): Promise<void> {
  const fotoPerfilUrl = fotoPerfilLocalUri
    ? await uploadProfileImage(data.uid, fotoPerfilLocalUri)
    : undefined;
  const callable = httpsCallable<EditarPersonalRequest, PersonalStatusResponse>(
    getFunctions(),
    'editarPersonal'
  );
  await callable(buildEditarPersonalRequest(data, fotoPerfilUrl));
}

export async function desactivarPersonal(uid: string): Promise<void> {
  const callable = httpsCallable<PersonalStatusRequest, PersonalStatusResponse>(
    getFunctions(),
    'desactivarPersonal'
  );
  await callable({ uid });
}

export async function reactivarPersonal(uid: string): Promise<void> {
  const callable = httpsCallable<PersonalStatusRequest, PersonalStatusResponse>(
    getFunctions(),
    'reactivarPersonal'
  );
  await callable({ uid });
}

export async function enviarNotificacionPrueba(): Promise<void> {
  const callable = httpsCallable<Record<string, never>, TestNotificationResponse>(
    getFunctions(),
    'enviarNotificacionPrueba'
  );
  await callable({});
}
