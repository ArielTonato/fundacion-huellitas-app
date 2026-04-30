import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import type { User } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

interface UsePersonalUsersResult {
  users: User[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function sortUsersByName(users: User[]): User[] {
  return [...users].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function usePersonalUsers(): UsePersonalUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const db = getFirestore();
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'personal'));

    setLoading(true);
    return onSnapshot(
      usersQuery,
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({ uid: item.id, ...item.data() } as User));
        setUsers(sortUsersByName(items));
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [refreshKey]);

  return { users, loading, error, refresh: () => setRefreshKey((current) => current + 1) };
}
