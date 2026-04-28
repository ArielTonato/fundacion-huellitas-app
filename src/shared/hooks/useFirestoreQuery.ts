import { useState, useEffect } from 'react';
import { onSnapshotQuery } from '@src/shared/services/firebase/firestore';
import type { Query } from '@react-native-firebase/firestore';

interface UseFirestoreQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestoreQuery<T>(
  collectionPath: string,
  buildQuery?: (ref: Query) => Query
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshotQuery<T>(
      collectionPath,
      buildQuery,
      (items) => {
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionPath]);

  return { data, loading, error };
}
