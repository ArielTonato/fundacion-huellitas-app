import { Ionicons } from '@expo/vector-icons';
import { useReverseGeocode } from '@src/shared/hooks/useReverseGeocode';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { PinOverlay } from './PinOverlay';
import { PlacesSearchInput } from './PlacesSearchInput';

const DEFAULT_REGION: Region = {
  latitude: -1.362023,
  longitude: -78.66621,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
  direccion: string;
  placeId?: string;
}

interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  error?: string;
}

function regionFromCoords(latitude: number, longitude: number): Region {
  return { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps): React.JSX.Element {
  const mapRef = useRef<MapView | null>(null);
  const initializedRef = useRef(false);

  const [centerCoords, setCenterCoords] = useState<{ latitude: number; longitude: number } | null>(
    value.latitude && value.longitude
      ? { latitude: value.latitude, longitude: value.longitude }
      : null
  );
  const [moving, setMoving] = useState(false);
  // Suppress reverse geocoding when we just set the address from a search selection.
  const [skipReverseFor, setSkipReverseFor] = useState<{ lat: number; lng: number } | null>(null);
  const [requestingGps, setRequestingGps] = useState(false);

  const reverseEnabled =
    !!centerCoords &&
    !(
      skipReverseFor &&
      skipReverseFor.lat === centerCoords.latitude &&
      skipReverseFor.lng === centerCoords.longitude
    );

  const { address, loading: reverseLoading } = useReverseGeocode({
    coords: centerCoords,
    enabled: reverseEnabled,
  });

  // Push reverse-geocoded address back into the form.
  useEffect(() => {
    if (!centerCoords || !reverseEnabled) return;
    if (address && address !== value.direccion) {
      onChange({
        latitude: centerCoords.latitude,
        longitude: centerCoords.longitude,
        direccion: address,
        placeId: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, reverseEnabled]);

  const goToCurrentLocation = async (silent = false): Promise<boolean> => {
    setRequestingGps(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        if (!silent) {
          Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la ubicación.');
        }
        return false;
      }

      const current = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setSkipReverseFor(null);
      setCenterCoords(coords);
      onChange({ ...coords, direccion: '', placeId: undefined });
      mapRef.current?.animateToRegion(regionFromCoords(coords.latitude, coords.longitude), 600);
      return true;
    } catch {
      if (!silent) {
        Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
      }
      return false;
    } finally {
      setRequestingGps(false);
    }
  };

  // On first mount, if no coords yet, try GPS silently.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!value.latitude || !value.longitude) {
      void goToCurrentLocation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFromSearch = (selection: {
    latitude: number;
    longitude: number;
    address: string;
    placeId: string;
  }): void => {
    const coords = { latitude: selection.latitude, longitude: selection.longitude };
    setSkipReverseFor({ lat: coords.latitude, lng: coords.longitude });
    setCenterCoords(coords);
    onChange({
      ...coords,
      direccion: selection.address,
      placeId: selection.placeId,
    });
    mapRef.current?.animateToRegion(regionFromCoords(coords.latitude, coords.longitude), 600);
  };

  const initialRegion: Region = value.latitude && value.longitude
    ? regionFromCoords(value.latitude, value.longitude)
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <PlacesSearchInput
        initialAddress={value.direccion}
        locationBias={centerCoords}
        onSelect={handleSelectFromSearch}
      />

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onRegionChange={() => {
            if (!moving) setMoving(true);
          }}
          onRegionChangeComplete={(region) => {
            setMoving(false);
            const coords = { latitude: region.latitude, longitude: region.longitude };
            // Treat manual movement as user-driven → re-enable reverse geocoding.
            setSkipReverseFor(null);
            setCenterCoords(coords);
          }}
        />
        <PinOverlay isMoving={moving} />

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => void goToCurrentLocation(false)}
          disabled={requestingGps}
        >
          {requestingGps ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location" size={18} color={Colors.primary} />
        {moving || reverseLoading ? (
          <Text style={styles.addressLoading}>Buscando dirección…</Text>
        ) : (
          <Text style={styles.addressText} numberOfLines={2}>
            {value.direccion || 'Mové el mapa o usá el buscador.'}
          </Text>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  mapWrapper: {
    borderRadius: 16,
    height: 260,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    bottom: Spacing.md,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: 44,
  },
  addressRow: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  addressText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
  },
  addressLoading: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
  },
});
