import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import type { Reporte } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

interface UseReporteResult {
  reporte: Reporte | null;
  loading: boolean;
  error: Error | null;
}

export function useReporte(reporteId: string | undefined): UseReporteResult {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!reporteId) {
      setReporte(null);
      setLoading(false);
      return undefined;
    }

    const db = getFirestore();
    setLoading(true);
    return onSnapshot(
      doc(db, 'reportes', reporteId),
      (snapshot) => {
        setReporte(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Reporte) : null);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [reporteId]);

  return { reporte, loading, error };
}
