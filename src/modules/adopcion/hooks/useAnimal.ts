import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import type { Animal } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

interface UseAnimalResult {
  animal: Animal | null;
  loading: boolean;
  error: Error | null;
}

export function useAnimal(animalId: string | undefined): UseAnimalResult {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!animalId) {
      setAnimal(null);
      setLoading(false);
      return undefined;
    }

    const db = getFirestore();
    setLoading(true);
    return onSnapshot(
      doc(db, 'animales', animalId),
      (snapshot) => {
        setAnimal(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Animal) : null);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [animalId]);

  return { animal, loading, error };
}
