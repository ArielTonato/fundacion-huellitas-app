import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import type { EstadoSolicitud, Solicitud } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

type WhereConstraint = ReturnType<typeof where>;

interface UseSolicitudesOptions {
  adoptanteId?: string;
  estado?: EstadoSolicitud;
}

interface UseSolicitudesResult {
  solicitudes: Solicitud[];
  loading: boolean;
  error: Error | null;
}

function buildSolicitudConstraints(options: UseSolicitudesOptions): WhereConstraint[] {
  return [
    options.adoptanteId ? where('adoptanteId', '==', options.adoptanteId) : null,
    options.estado ? where('estado', '==', options.estado) : null,
  ].filter((constraint): constraint is WhereConstraint => Boolean(constraint));
}

export function useSolicitudes(options: UseSolicitudesOptions = {}): UseSolicitudesResult {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { adoptanteId, estado } = options;

  useEffect(() => {
    const db = getFirestore();
    const solicitudesQuery = query(collection(db, 'solicitudes'), ...buildSolicitudConstraints({ adoptanteId, estado }));

    setLoading(true);
    return onSnapshot(
      solicitudesQuery,
      (snapshot) => {
        setSolicitudes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Solicitud)));
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [adoptanteId, estado]);

  return { solicitudes, loading, error };
}
