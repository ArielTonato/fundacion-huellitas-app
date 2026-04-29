import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { DAILY_GENERATION_LIMIT, getGenerationDocId } from '../services/generarImagenService';

interface UseGeneracionesRestantesResult {
  remaining: number;
  used: number;
  loading: boolean;
  error: Error | null;
}

export function useGeneracionesRestantes(uid: string | undefined): UseGeneracionesRestantesResult {
  const [used, setUsed] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setUsed(0);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const db = getFirestore();
    const generationRef = doc(db, 'generaciones', getGenerationDocId(uid));
    setLoading(true);

    return onSnapshot(
      generationRef,
      (snapshot) => {
        setUsed(snapshot.exists() ? Number(snapshot.data()?.cantidad ?? 0) : 0);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [uid]);

  return {
    remaining: Math.max(DAILY_GENERATION_LIMIT - used, 0),
    used,
    loading,
    error,
  };
}
