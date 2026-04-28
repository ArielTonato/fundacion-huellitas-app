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
  refresh: () => void;
}

function buildSolicitudConstraints(options: UseSolicitudesOptions): WhereConstraint[] {
  return [
    options.adoptanteId ? where('adoptanteId', '==', options.adoptanteId) : null,
  ].filter((constraint): constraint is WhereConstraint => Boolean(constraint));
}

export function useSolicitudes(options: UseSolicitudesOptions = {}): UseSolicitudesResult {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { adoptanteId, estado } = options;

  useEffect(() => {
    const db = getFirestore();
    const solicitudesQuery = query(collection(db, 'solicitudes'), ...buildSolicitudConstraints({ adoptanteId, estado }));

    setLoading(true);
    return onSnapshot(
      solicitudesQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Solicitud))
          .filter((solicitud) => !estado || solicitud.estado === estado);
        setSolicitudes(items);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [adoptanteId, estado, refreshKey]);

  return { solicitudes, loading, error, refresh: () => setRefreshKey((current) => current + 1) };
}
