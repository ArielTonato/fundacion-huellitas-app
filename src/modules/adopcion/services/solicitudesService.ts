import {
  collection,
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { uploadMultipleImages } from '@src/shared/services/firebase/storage';
import type { EstadoSolicitud, Solicitud } from '@src/shared/types/models';
import type { SolicitudFormData } from '../schemas/solicitudSchema';

type SolicitudFirestoreData = Omit<Solicitud, 'id' | 'creadoEn'> & {
  creadoEn: unknown;
};

export async function crearSolicitud(
  animalId: string,
  adoptanteId: string,
  data: SolicitudFormData
): Promise<string> {
  const db = getFirestore();
  const solicitudRef = doc(collection(db, 'solicitudes'));
  const fotos = await uploadMultipleImages(`solicitudes/${solicitudRef.id}`, [
    data.fotoCedulaFrontal,
    data.fotoCedulaPosterior,
    data.fotoUbicacionAnimal,
  ]);
  const solicitudData: SolicitudFirestoreData = {
    animalId,
    adoptanteId,
    nombreCompleto: data.nombreCompleto,
    fotoCedulaFrontal: fotos[0],
    fotoCedulaPosterior: fotos[1],
    telefonoCelular: data.telefonoCelular,
    telefonoFijo: data.telefonoFijo,
    ingresosMensuales: data.ingresosMensuales,
    fotoUbicacionAnimal: fotos[2],
    viveAcompanado: data.viveAcompanado,
    estado: 'pendiente',
    creadoEn: serverTimestamp(),
  };

  await setDoc(solicitudRef, solicitudData);
  return solicitudRef.id;
}

export async function cambiarEstadoSolicitud(
  solicitudId: string,
  estado: EstadoSolicitud
): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, 'solicitudes', solicitudId), { estado });
}

export async function confirmarEntrega(solicitudId: string): Promise<void> {
  const db = getFirestore();
  await runTransaction(db, async (transaction) => {
    const solicitudRef = doc(db, 'solicitudes', solicitudId);
    const solicitudDoc = await transaction.get(solicitudRef);

    if (!solicitudDoc.exists) {
      throw new Error('No se encontro la solicitud.');
    }

    const solicitud = { id: solicitudDoc.id, ...solicitudDoc.data() } as Solicitud;
    const animalRef = doc(db, 'animales', solicitud.animalId);
    transaction.update(solicitudRef, { estado: 'aprobada' });
    transaction.update(animalRef, { estado: 'adoptado' });
  });
}

export async function obtenerSolicitud(solicitudId: string): Promise<Solicitud | null> {
  const db = getFirestore();
  const solicitudDoc = await getDoc(doc(db, 'solicitudes', solicitudId));

  if (!solicitudDoc.exists) {
    return null;
  }

  return { id: solicitudDoc.id, ...solicitudDoc.data() } as Solicitud;
}
