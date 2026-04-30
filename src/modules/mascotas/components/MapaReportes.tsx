import type { Reporte } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

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

export function MapaReportes({ reportes, onSelectReporte }: MapaReportesProps): React.JSX.Element {
  return (
    <MapView style={styles.map} initialRegion={getInitialRegion(reportes)}>
      {reportes.map((reporte) => (
        <Marker
          key={reporte.id}
          coordinate={{
            latitude: reporte.ultimaUbicacion.latitude,
            longitude: reporte.ultimaUbicacion.longitude,
          }}
          title={reporte.nombre}
          description={reporte.ultimaUbicacion.direccion}
        >
          <Callout tooltip onPress={() => onSelectReporte(reporte)}>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{reporte.nombre}</Text>
              <Text style={styles.calloutText} numberOfLines={2}>
                {reporte.ultimaUbicacion.direccion}
              </Text>
              <TouchableOpacity style={styles.calloutButton} activeOpacity={0.86}>
                <Text style={styles.calloutButtonText}>Ver detalle</Text>
              </TouchableOpacity>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    minWidth: 190,
    padding: Spacing.md,
  },
  calloutTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calloutText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  calloutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  calloutButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
});
