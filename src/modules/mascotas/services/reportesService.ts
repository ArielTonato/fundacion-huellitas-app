import {
  Timestamp,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { uploadMultipleImages } from '@src/shared/services/firebase/storage';
import type { Reporte } from '@src/shared/types/models';
import type { ReporteFormData } from '../schemas/reporteSchema';

const REPORTE_LIMITE_DIAS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ReporteFirestoreData = Omit<Reporte, 'id' | 'creadoEn'> & {
  creadoEn: unknown;
};

function getFourteenDaysAgo(): Date {
  return new Date(Date.now() - REPORTE_LIMITE_DIAS * MS_PER_DAY);
}

function getRemainingDays(createdAt: Date): number {
  const availableAt = createdAt.getTime() + REPORTE_LIMITE_DIAS * MS_PER_DAY;
  return Math.max(1, Math.ceil((availableAt - Date.now()) / MS_PER_DAY));
}

export async function verificarLimite14Dias(uid: string): Promise<void> {
  const db = getFirestore();
  const reportesQuery = query(
    collection(db, 'reportes'),
    where('reportadoPor', '==', uid),
    where('creadoEn', '>=', Timestamp.fromDate(getFourteenDaysAgo())),
    orderBy('creadoEn', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(reportesQuery);

  if (!snapshot.empty) {
    const reporte = snapshot.docs[0].data() as Reporte;
    const remainingDays = getRemainingDays(reporte.creadoEn.toDate());
    throw new Error(`Ya reportaste una mascota recientemente. Intenta nuevamente en ${remainingDays} dias.`);
  }
}

export async function crearReporte(data: ReporteFormData, reportadoPor: string): Promise<string> {
  await verificarLimite14Dias(reportadoPor);

  const db = getFirestore();
  const reporteRef = doc(collection(db, 'reportes'));
  const fotos = await uploadMultipleImages(`reportes/${reporteRef.id}`, data.fotos, {
    customMetadata: {
      uploadedBy: reportadoPor,
    },
  });
  const ultimaUbicacion: Reporte['ultimaUbicacion'] = {
    latitude: data.ultimaUbicacion.latitude,
    longitude: data.ultimaUbicacion.longitude,
    direccion: data.ultimaUbicacion.direccion,
  };
  if (data.ultimaUbicacion.placeId) {
    ultimaUbicacion.placeId = data.ultimaUbicacion.placeId;
  }

  const reporteData: ReporteFirestoreData = {
    nombre: data.nombre,
    especie: data.especie,
    descripcion: data.descripcion,
    fotos,
    ultimaUbicacion,
    telefonoContacto: data.telefonoContacto,
    reportadoPor,
    estado: 'activo',
    creadoEn: serverTimestamp(),
  };

  await setDoc(reporteRef, reporteData);
  return reporteRef.id;
}

export async function marcarComoResuelto(reporteId: string): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, 'reportes', reporteId), { estado: 'resuelto' });
}
