import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Timestamp = FirebaseFirestoreTypes.Timestamp;

export type Role = 'superadmin' | 'personal' | 'adoptante';

export type Especie = 'perro' | 'gato';
export type SexoAnimal = 'macho' | 'hembra';

export type EstadoAnimal = 'disponible' | 'en_proceso' | 'adoptado';

export type EstadoSolicitud =
  | 'pendiente'
  | 'en_revision'
  | 'entrevista_agendada'
  | 'aprobada'
  | 'rechazada';

export type EstadoEntrevista = 'programada' | 'completada' | 'cancelada';

export type EstadoReporte = 'activo' | 'resuelto';

export interface User {
  uid: string;
  email: string;
  nombre: string;
  role: Role;
  activo?: boolean;
  telefono?: string;
  fotoPerfilUrl?: string;
  direccion?: string;
  fcmToken?: string;
}

export interface Edad {
  anios?: number;
  meses?: number;
  dias?: number;
}

export interface Animal {
  id: string;
  nombre: string;
  especie: Especie;
  raza: string;
  edad: Edad;
  sexo: string;
  tamano: string;
  descripcion: string;
  estadoSalud: string;
  vacunado: boolean;
  esterilizado: boolean;
  desparasitado: boolean;
  fotos: string[];
  estado: EstadoAnimal;
  ubicacion: string;
  creadoPor: string;
  creadoEn: Timestamp;
}

export interface Solicitud {
  id: string;
  animalId: string;
  adoptanteId: string;
  nombreCompleto: string;
  fotoCedulaFrontal: string;
  fotoCedulaPosterior: string;
  telefonoCelular?: string;
  telefonoFijo?: string;
  ingresosMensuales: number;
  fotoUbicacionAnimal: string;
  viveAcompanado: boolean;
  estado: EstadoSolicitud;
  creadoEn: Timestamp;
}

export interface Entrevista {
  id: string;
  solicitudId: string;
  fecha: Timestamp;
  hora: string;
  notas: string;
  estado: EstadoEntrevista;
  resultado?: string;
}

export interface Reporte {
  id: string;
  nombre: string;
  especie: Especie;
  sexo?: SexoAnimal;
  descripcion: string;
  fotos: string[];
  ultimaUbicacion: {
    latitude: number;
    longitude: number;
    direccion: string;
    placeId?: string;
  };
  telefonoContacto: string;
  reportadoPor: string;
  estado: EstadoReporte;
  creadoEn: Timestamp;
}
