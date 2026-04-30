import { useDebounce } from '@src/shared/hooks/useDebounce';
import { reverseGeocode } from '@src/shared/services/places';
import axios from 'axios';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

interface Coords {
  latitude: number;
  longitude: number;
}

interface UseReverseGeocodeParams {
  coords: Coords | null;
  delay?: number;
  enabled?: boolean;
}

interface UseReverseGeocodeResult {
  address: string | null;
  loading: boolean;
  error: string | null;
}

async function fallbackToExpoLocation(coords: Coords): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const first = results[0];
    if (!first) return null;
    return [first.street, first.name, first.district, first.city, first.region]
      .filter(Boolean)
      .join(', ') || null;
  } catch {
    return null;
  }
}

export function useReverseGeocode({
  coords,
  delay = 250,
  enabled = true,
}: UseReverseGeocodeParams): UseReverseGeocodeResult {
  const debouncedCoords = useDebounce(coords, delay);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !debouncedCoords) {
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    reverseGeocode({
      latitude: debouncedCoords.latitude,
      longitude: debouncedCoords.longitude,
      signal: controller.signal,
    })
      .then(async (result) => {
        if (controller.signal.aborted) return;
        if (result.address) {
          setAddress(result.address);
          return;
        }
        const fallback = await fallbackToExpoLocation(debouncedCoords);
        setAddress(fallback);
      })
      .catch(async (err) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        const fallback = await fallbackToExpoLocation(debouncedCoords);
        if (controller.signal.aborted) return;
        if (fallback) {
          setAddress(fallback);
        } else {
          setError(err?.message ?? 'No se pudo obtener la dirección.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedCoords?.latitude, debouncedCoords?.longitude, enabled]);

  return { address, loading, error };
}
