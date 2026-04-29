import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import type { Entrevista, EstadoEntrevista } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

type WhereConstraint = ReturnType<typeof where>;

interface UseEntrevistasOptions {
  solicitudId?: string;
  estado?: EstadoEntrevista;
}

interface UseEntrevistasResult {
  entrevistas: Entrevista[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function buildEntrevistaConstraints(options: UseEntrevistasOptions): WhereConstraint[] {
  return [
    options.solicitudId ? where('solicitudId', '==', options.solicitudId) : null,
    options.estado ? where('estado', '==', options.estado) : null,
  ].filter((constraint): constraint is WhereConstraint => Boolean(constraint));
}

export function useEntrevistas(options: UseEntrevistasOptions = {}): UseEntrevistasResult {
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { solicitudId, estado } = options;

  useEffect(() => {
    const db = getFirestore();
    const entrevistasQuery = query(collection(db, 'entrevistas'), ...buildEntrevistaConstraints({ solicitudId, estado }));

    setLoading(true);
    return onSnapshot(
      entrevistasQuery,
      (snapshot) => {
        setEntrevistas(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Entrevista)));
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [solicitudId, estado, refreshKey]);

  return { entrevistas, loading, error, refresh: () => setRefreshKey((current) => current + 1) };
}
