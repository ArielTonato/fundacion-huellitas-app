import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import type { Reporte } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

interface UseReportesOptions {
  search?: string;
}

interface UseReportesResult {
  reportes: Reporte[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function matchesSearch(reporte: Reporte, search: string | undefined): boolean {
  const normalizedSearch = search?.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    reporte.nombre,
    reporte.especie,
    reporte.descripcion,
    reporte.ultimaUbicacion.direccion,
  ].join(' ').toLowerCase().includes(normalizedSearch);
}

export function useReportes(options: UseReportesOptions = {}): UseReportesResult {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { search } = options;

  useEffect(() => {
    const db = getFirestore();
    const reportesQuery = query(
      collection(db, 'reportes'),
      where('estado', '==', 'activo'),
      orderBy('creadoEn', 'desc')
    );

    setLoading(true);
    return onSnapshot(
      reportesQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Reporte))
          .filter((reporte) => matchesSearch(reporte, search));
        setReportes(items);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [search, refreshKey]);

  return { reportes, loading, error, refresh: () => setRefreshKey((current) => current + 1) };
}
