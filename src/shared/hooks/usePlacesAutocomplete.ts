import { useDebounce } from '@src/shared/hooks/useDebounce';
import {
  generateSessionToken,
  placeDetails,
  placesAutocomplete,
  type PlaceDetails,
  type PlacePrediction,
} from '@src/shared/services/places';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePlacesAutocompleteParams {
  input: string;
  locationBias?: { latitude: number; longitude: number } | null;
  delay?: number;
  minLength?: number;
}

interface UsePlacesAutocompleteResult {
  predictions: PlacePrediction[];
  loading: boolean;
  error: string | null;
  resolveDetails: (placeId: string) => Promise<PlaceDetails>;
}

export function usePlacesAutocomplete({
  input,
  locationBias,
  delay = 300,
  minLength = 2,
}: UsePlacesAutocompleteParams): UsePlacesAutocompleteResult {
  const debouncedInput = useDebounce(input, delay);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string>(generateSessionToken());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedInput.trim().length < minLength) {
      setPredictions([]);
      setLoading(false);
      setError(null);
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    placesAutocomplete({
      input: debouncedInput,
      sessionToken: sessionTokenRef.current,
      location: locationBias ?? undefined,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setPredictions(result);
      })
      .catch((err) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        setPredictions([]);
        setError(err?.message ?? 'No se pudieron cargar sugerencias.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedInput, locationBias?.latitude, locationBias?.longitude, minLength]);

  const resolveDetails = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const details = await placeDetails({
      placeId,
      sessionToken: sessionTokenRef.current,
    });
    // Rotate session token after successful details — Google bills per session.
    sessionTokenRef.current = generateSessionToken();
    return details;
  }, []);

  return { predictions, loading, error, resolveDetails };
}
