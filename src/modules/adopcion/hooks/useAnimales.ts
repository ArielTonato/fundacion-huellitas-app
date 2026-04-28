import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import type { Animal, Especie } from '@src/shared/types/models';
import { useEffect, useState } from 'react';

type WhereConstraint = ReturnType<typeof where>;

export interface AnimalFilters {
  especie?: Especie;
  edadMinimaAnios?: number;
  edadMaximaAnios?: number;
  tamano?: string;
  esterilizado?: boolean | 'todos';
  soloDisponibles?: boolean;
}

interface UseAnimalesResult {
  animales: Animal[];
  loading: boolean;
  error: Error | null;
}

function isWithinAgeRange(animal: Animal, filters: AnimalFilters): boolean {
  const anios = animal.edad.anios ?? 0;
  const minValid = filters.edadMinimaAnios === undefined || anios >= filters.edadMinimaAnios;
  const maxValid = filters.edadMaximaAnios === undefined || anios <= filters.edadMaximaAnios;
  return minValid && maxValid;
}

function buildAnimalConstraints(filters: AnimalFilters): WhereConstraint[] {
  return [
    filters.soloDisponibles ? where('estado', '==', 'disponible') : null,
    filters.especie ? where('especie', '==', filters.especie) : null,
    filters.tamano ? where('tamano', '==', filters.tamano) : null,
    typeof filters.esterilizado === 'boolean' ? where('esterilizado', '==', filters.esterilizado) : null,
  ].filter((constraint): constraint is WhereConstraint => Boolean(constraint));
}

export function useAnimales(filters: AnimalFilters = {}): UseAnimalesResult {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { especie, edadMinimaAnios, edadMaximaAnios, tamano, esterilizado, soloDisponibles } = filters;

  useEffect(() => {
    const db = getFirestore();
    const constraints = buildAnimalConstraints({
      especie,
      edadMinimaAnios,
      edadMaximaAnios,
      tamano,
      esterilizado,
      soloDisponibles,
    });
    const animalesQuery = query(collection(db, 'animales'), ...constraints);

    setLoading(true);
    return onSnapshot(
      animalesQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Animal))
          .filter((animal) => isWithinAgeRange(animal, { edadMinimaAnios, edadMaximaAnios }));
        setAnimales(items);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [especie, edadMinimaAnios, edadMaximaAnios, tamano, esterilizado, soloDisponibles]);

  return { animales, loading, error };
}
