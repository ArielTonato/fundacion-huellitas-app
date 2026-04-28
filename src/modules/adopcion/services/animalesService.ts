import {
  arrayRemove,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { deleteObject, getStorage, ref } from '@react-native-firebase/storage';
import { uploadImage, uploadMultipleImages } from '@src/shared/services/firebase/storage';
import type { Animal, EstadoAnimal } from '@src/shared/types/models';
import type { AnimalFormData } from '../schemas/animalSchema';

const FUNDACION_UBICACION = '1°21\'43.3"S 78°39\'58.4"W (-1.362023, -78.666210)';
const MAX_ANIMAL_PHOTOS = 5;

type AnimalFirestoreData = Omit<Animal, 'id' | 'creadoEn'> & {
  creadoEn: unknown;
};

export async function registrarAnimal(data: AnimalFormData, creadoPor: string): Promise<string> {
  const db = getFirestore();
  const animalRef = doc(collection(db, 'animales'));
  const fotos = await uploadMultipleImages(`animales/${animalRef.id}`, data.fotos);
  const animalData: AnimalFirestoreData = {
    nombre: data.nombre,
    especie: data.especie,
    raza: data.raza,
    edad: data.edad,
    sexo: data.sexo,
    tamano: data.tamano,
    descripcion: data.descripcion,
    estadoSalud: data.estadoSalud,
    vacunado: data.vacunado,
    esterilizado: data.esterilizado,
    fotos,
    estado: 'disponible',
    ubicacion: FUNDACION_UBICACION,
    creadoPor,
    creadoEn: serverTimestamp(),
  };

  await setDoc(animalRef, animalData);
  return animalRef.id;
}

export async function editarAnimal(animalId: string, data: AnimalFormData, estado: EstadoAnimal): Promise<void> {
  const db = getFirestore();
  const animalRef = doc(db, 'animales', animalId);
  await updateDoc(animalRef, {
    nombre: data.nombre,
    especie: data.especie,
    raza: data.raza,
    edad: data.edad,
    sexo: data.sexo,
    tamano: data.tamano,
    descripcion: data.descripcion,
    estadoSalud: data.estadoSalud,
    vacunado: data.vacunado,
    esterilizado: data.esterilizado,
    fotos: data.fotos,
    estado,
  });
}

export async function agregarFoto(animalId: string, fotosActuales: string[], localUri: string): Promise<string> {
  if (fotosActuales.length >= MAX_ANIMAL_PHOTOS) {
    throw new Error('No se pueden agregar mas de 5 fotos.');
  }

  const db = getFirestore();
  const fotoUrl = await uploadImage(`animales/${animalId}/${Date.now()}`, localUri);
  await updateDoc(doc(db, 'animales', animalId), {
    fotos: [...fotosActuales, fotoUrl],
  });

  return fotoUrl;
}

export async function eliminarFoto(animalId: string, fotoUrl: string): Promise<void> {
  const db = getFirestore();
  const storage = getStorage();
  await deleteObject(ref(storage, fotoUrl));
  await updateDoc(doc(db, 'animales', animalId), {
    fotos: arrayRemove(fotoUrl),
  });
}
