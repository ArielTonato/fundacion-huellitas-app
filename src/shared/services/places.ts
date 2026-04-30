import axios, { type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

// Places API (New) — POST + JSON body + X-Goog-Api-Key + field masks.
// https://developers.google.com/maps/documentation/places/web-service/op-overview
const PLACES_NEW_BASE = 'https://places.googleapis.com/v1';
// Geocoding API is a separate product (not part of Places legacy/new), still uses GET + key param.
const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode';

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.googleMapsApiKey as string | undefined;
  if (!key) {
    throw new PlacesApiError('CONFIG_MISSING', 'GOOGLE_MAPS_API_KEY no configurada en app.config.ts.');
  }
  return key;
}

export class PlacesApiError extends Error {
  status: string;
  constructor(status: string, message: string) {
    super(message);
    this.name = 'PlacesApiError';
    this.status = status;
  }
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  latitude: number;
  longitude: number;
  address: string;
}

export interface ReverseGeocodeResult {
  address: string;
}

interface AutocompleteParams {
  input: string;
  sessionToken: string;
  location?: { latitude: number; longitude: number };
  radius?: number;
  language?: string;
  components?: string;
  signal?: AbortSignal;
}

interface DetailsParams {
  placeId: string;
  sessionToken: string;
  language?: string;
  signal?: AbortSignal;
}

interface ReverseParams {
  latitude: number;
  longitude: number;
  language?: string;
  signal?: AbortSignal;
}

function assertGeocodeOk(status: string, message: string | undefined): void {
  if (status === 'OK' || status === 'ZERO_RESULTS') return;
  throw new PlacesApiError(status, message ?? `Geocoding API respondió ${status}.`);
}

function buildRequest(signal?: AbortSignal): AxiosRequestConfig {
  return { signal, timeout: 8000 };
}

function newPlacesHeaders(fieldMask: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': getApiKey(),
    'X-Goog-FieldMask': fieldMask,
  };
}

export async function placesAutocomplete({
  input,
  sessionToken,
  location,
  radius = 50000,
  language = 'es',
  components = 'ec',
  signal,
}: AutocompleteParams): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];

  // `components` accepts 'country:ec' (legacy) or 'ec' — normalize to ISO region code for the new API.
  const regionCode = components.replace(/^country:/, '').toUpperCase();

  const body: Record<string, unknown> = {
    input,
    languageCode: language,
    regionCode,
    sessionToken,
    includedRegionCodes: [regionCode],
  };
  if (location) {
    body.locationBias = {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius,
      },
    };
  }

  try {
    const response = await axios.post(
      `${PLACES_NEW_BASE}/places:autocomplete`,
      body,
      {
        ...buildRequest(signal),
        headers: newPlacesHeaders(
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
        ),
      }
    );

    const suggestions = (response.data?.suggestions ?? []) as any[];
    return suggestions
      .map((s) => s?.placePrediction)
      .filter(Boolean)
      .map((p: any): PlacePrediction => ({
        placeId: p.placeId,
        description: p.text?.text ?? '',
        mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
      }));
  } catch (err: any) {
    if (axios.isCancel(err)) throw err;
    const status = err?.response?.data?.error?.status ?? err?.response?.status?.toString() ?? 'UNKNOWN';
    const message = err?.response?.data?.error?.message ?? err?.message ?? 'Error en autocomplete.';
    throw new PlacesApiError(status, message);
  }
}

export async function placeDetails({
  placeId,
  sessionToken,
  language = 'es',
  signal,
}: DetailsParams): Promise<PlaceDetails> {
  try {
    const response = await axios.get(`${PLACES_NEW_BASE}/places/${placeId}`, {
      ...buildRequest(signal),
      params: {
        sessionToken,
        languageCode: language,
      },
      headers: newPlacesHeaders('id,location,formattedAddress,displayName'),
    });

    const result = response.data;
    if (!result?.location) {
      throw new PlacesApiError('NO_GEOMETRY', 'El lugar seleccionado no tiene coordenadas.');
    }

    return {
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      address: result.formattedAddress ?? result.displayName?.text ?? '',
    };
  } catch (err: any) {
    if (err instanceof PlacesApiError) throw err;
    if (axios.isCancel(err)) throw err;
    const status = err?.response?.data?.error?.status ?? err?.response?.status?.toString() ?? 'UNKNOWN';
    const message = err?.response?.data?.error?.message ?? err?.message ?? 'Error obteniendo detalles del lugar.';
    throw new PlacesApiError(status, message);
  }
}

export async function reverseGeocode({
  latitude,
  longitude,
  language = 'es',
  signal,
}: ReverseParams): Promise<ReverseGeocodeResult> {
  const response = await axios.get(`${GEOCODE_BASE}/json`, {
    ...buildRequest(signal),
    params: {
      latlng: `${latitude},${longitude}`,
      language,
      key: getApiKey(),
    },
  });

  const data = response.data;
  assertGeocodeOk(data.status, data.error_message);

  const first = data.results?.[0];
  return {
    address: first?.formatted_address ?? '',
  };
}

export function generateSessionToken(): string {
  // UUID v4 — opaque correlator for Google session billing.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
