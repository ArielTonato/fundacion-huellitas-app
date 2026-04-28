import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  Timestamp,
  writeBatch,
  updateDoc,
} from '@react-native-firebase/firestore';
import type { Entrevista, EstadoEntrevista } from '@src/shared/types/models';
import type { EntrevistaFormData } from '../schemas/entrevistaSchema';

type EntrevistaFirestoreData = Omit<Entrevista, 'id' | 'fecha'> & {
  fecha: Timestamp;
  creadoEn: unknown;
};

export async function crearEntrevista(
  solicitudId: string,
  data: EntrevistaFormData
): Promise<string> {
  const db = getFirestore();
  const entrevistaRef = doc(collection(db, 'entrevistas'));
  const batch = writeBatch(db);
  const entrevistaData: EntrevistaFirestoreData = {
    solicitudId,
    fecha: Timestamp.fromDate(data.fecha),
    hora: data.hora,
    notas: data.notas ?? '',
    estado: 'programada',
    creadoEn: serverTimestamp(),
  };

  batch.set(entrevistaRef, entrevistaData);
  batch.update(doc(db, 'solicitudes', solicitudId), { estado: 'entrevista_agendada' });
  await batch.commit();

  return entrevistaRef.id;
}

export async function actualizarEntrevista(
  entrevistaId: string,
  estado: EstadoEntrevista,
  resultado?: string
): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, 'entrevistas', entrevistaId), {
    estado,
    ...(resultado ? { resultado } : {}),
  });
}
