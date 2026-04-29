import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as FileSystem from 'expo-file-system/legacy';

export const DAILY_GENERATION_LIMIT = 3;

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

export interface ImageBase64Payload {
  base64: string;
  mimeType: string;
}

export interface GenerarImagenRequest {
  animalImageBase64: string;
  animalMimeType: string;
  userImageBase64: string;
  userMimeType: string;
  animalName?: string;
}

export interface GenerarImagenResponse {
  imageBase64: string;
  mimeType: string;
  remainingToday: number;
}

function getTodayKey(): string {
  const parts = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: '2-digit',
    timeZone: ECUADOR_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getGenerationDocId(uid: string): string {
  return `${uid}_${getTodayKey()}`;
}

function getMimeTypeFromUri(uri: string): string {
  const normalizedUri = decodeURIComponent(uri.split('?')[0] ?? '').toLowerCase();

  if (normalizedUri.endsWith('.png')) {
    return 'image/png';
  }

  if (normalizedUri.endsWith('.webp')) {
    return 'image/webp';
  }

  if (normalizedUri.endsWith('.heic')) {
    return 'image/heic';
  }

  if (normalizedUri.endsWith('.heif')) {
    return 'image/heif';
  }

  return 'image/jpeg';
}

function getFileExtension(mimeType: string): string {
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  if (mimeType === 'image/heic') {
    return 'heic';
  }

  if (mimeType === 'image/heif') {
    return 'heif';
  }

  return 'jpg';
}

async function getReadableImageUri(uri: string, mimeType: string): Promise<string> {
  if (!uri.startsWith('http')) {
    return uri;
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error('No se pudo preparar la imagen remota.');
  }

  const fileUri = `${FileSystem.cacheDirectory}huellitas-ai-${Date.now()}.${getFileExtension(mimeType)}`;
  const downloadedImage = await FileSystem.downloadAsync(uri, fileUri);

  return downloadedImage.uri;
}

async function writeGeneratedImageFile(imageBase64: string, mimeType: string): Promise<string> {
  if (!FileSystem.cacheDirectory) {
    throw new Error('No se pudo preparar la imagen generada.');
  }

  const fileUri = `${FileSystem.cacheDirectory}huellitas-ai-generada-${Date.now()}.${getFileExtension(mimeType)}`;
  await FileSystem.writeAsStringAsync(fileUri, imageBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export async function imageUriToBase64Payload(uri: string): Promise<ImageBase64Payload> {
  const mimeType = getMimeTypeFromUri(uri);
  const readableUri = await getReadableImageUri(uri, mimeType);
  const base64 = await FileSystem.readAsStringAsync(readableUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { base64, mimeType };
}

export async function generarImagenAdopcion(data: GenerarImagenRequest): Promise<GenerarImagenResponse> {
  const callable = httpsCallable<GenerarImagenRequest, GenerarImagenResponse>(
    getFunctions(),
    'generarImagenAdopcion',
    { timeout: 180000 }
  );
  const result = await callable(data);

  return result.data;
}

export async function downloadGeneratedImageToGallery(imageBase64: string, mimeType: string): Promise<void> {
  const MediaLibrary = await import('expo-media-library');
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Necesitas permitir acceso a la galeria para descargar la imagen.');
  }

  const fileUri = await writeGeneratedImageFile(imageBase64, mimeType);
  await MediaLibrary.saveToLibraryAsync(fileUri);
}

export async function shareGeneratedImage(imageBase64: string, mimeType: string): Promise<void> {
  const Sharing = await import('expo-sharing');
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error('Compartir no esta disponible en este dispositivo.');
  }

  const fileUri = await writeGeneratedImageFile(imageBase64, mimeType);
  await Sharing.shareAsync(fileUri, {
    dialogTitle: 'Compartir imagen generada',
    mimeType,
  });
}
