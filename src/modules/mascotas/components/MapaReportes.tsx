import type { Reporte } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapaReportesProps {
  reportes: Reporte[];
  onSelectReporte: (reporte: Reporte) => void;
}

const DEFAULT_REGION = {
  latitude: -1.362023,
  longitude: -78.66621,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const FALLBACK_IMAGE = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
const MARKER_COLORS = [
  Colors.accent,
  Colors.primary,
  Colors.secondary,
  Colors.error,
  '#7C3AED',
  '#0EA5E9',
  '#F59E0B',
  '#10B981',
] as const;

function getInitialRegion(reportes: Reporte[]) {
  const firstReporte = reportes[0];
  if (!firstReporte) return DEFAULT_REGION;

  return {
    latitude: firstReporte.ultimaUbicacion.latitude,
    longitude: firstReporte.ultimaUbicacion.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
}

function getMarkerColor(index: number): string {
  return MARKER_COLORS[index % MARKER_COLORS.length];
}

interface ReporteMarkerProps {
  reporte: Reporte;
  color: string;
  selected: boolean;
  onPress: () => void;
}

function ReporteMarker({ reporte, color, selected, onPress }: ReporteMarkerProps): React.JSX.Element {
  return (
    <Marker
      coordinate={{
        latitude: reporte.ultimaUbicacion.latitude,
        longitude: reporte.ultimaUbicacion.longitude,
      }}
      pinColor={color}
      zIndex={selected ? 1 : 0}
      onPress={onPress}
    />
  );
}

export function MapaReportes({ reportes, onSelectReporte }: MapaReportesProps): React.JSX.Element {
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const selectedPhoto = selectedReporte?.fotos?.[0] ?? FALLBACK_IMAGE;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={getInitialRegion(reportes)}>
        {reportes.map((reporte, index) => (
          <ReporteMarker
            key={reporte.id}
            reporte={reporte}
            color={getMarkerColor(index)}
            selected={selectedReporte?.id === reporte.id}
            onPress={() => setSelectedReporte(reporte)}
          />
        ))}
      </MapView>

      {selectedReporte ? (
        <TouchableOpacity
          style={styles.previewCard}
          activeOpacity={0.88}
          onPress={() => onSelectReporte(selectedReporte)}
        >
          <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>{selectedReporte.nombre}</Text>
            <Text style={styles.previewAddress} numberOfLines={2}>
              {selectedReporte.ultimaUbicacion.direccion}
            </Text>
            <Text style={styles.previewAction}>Ver detalle</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const PREVIEW_IMAGE_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    bottom: Spacing.lg,
    elevation: 6,
    flexDirection: 'row',
    gap: Spacing.md,
    left: Spacing.lg,
    padding: Spacing.md,
    position: 'absolute',
    right: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  previewImage: {
    borderRadius: 14,
    height: PREVIEW_IMAGE_SIZE,
    width: PREVIEW_IMAGE_SIZE,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  previewAddress: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  previewAction: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
});
