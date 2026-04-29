import { Ionicons } from '@expo/vector-icons';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import { formatEdad } from '@src/modules/adopcion/utils/formatEdad';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { EstadoAnimal } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 400;

const FUNDACION_COORDS = { latitude: -1.362023, longitude: -78.666210 };
const FUNDACION_NOMBRE = 'Fundación Huellitas';
const FUNDACION_DIRECCION = 'Tres Esquinas, Santa Lucia';

const STATUS_LABELS: Record<EstadoAnimal, string> = {
  disponible: 'Disponible',
  en_proceso: 'En proceso',
  adoptado: 'Adoptado',
};

const STATUS_VARIANTS: Record<EstadoAnimal, 'success' | 'warning' | 'neutral'> = {
  disponible: 'success',
  en_proceso: 'warning',
  adoptado: 'neutral',
};

export default function AnimalDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { animal, loading, error } = useAnimal(id);

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!animal) {
    return (
      <EmptyState
        title="Animal no encontrado"
        message={error?.message ?? 'No se pudo cargar la informacion del animal.'}
      />
    );
  }

  const healthChips = [
    { label: 'Vacunado', active: animal.vacunado },
    { label: 'Esterilizado', active: animal.esterilizado },
  ].filter((c) => c.active);

  const requestAdoption = (): void => {
    router.push(`/(adoptante)/solicitud/${animal.id}` as never);
  };

  const openGenerativePreview = (): void => {
    Alert.alert('Proximamente', 'La vista de IA generativa se implementara en la Fase 6.');
  };

  return (
    <View style={styles.root}>
      <ScrollView  showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <FlatList
            data={animal.fotos}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            )}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Name + status */}
          <View style={styles.headerRow}>
            <Text style={styles.name}>{animal.nombre}</Text>
            <StatusBadge label={STATUS_LABELS[animal.estado]} variant={STATUS_VARIANTS[animal.estado]} />
          </View>


          {/* Stat chips */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Edad</Text>
              <Text style={styles.statValue}>{formatEdad(animal.edad)}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Sexo</Text>
              <Text style={styles.statValue}>{animal.sexo}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Tamaño</Text>
              <Text style={styles.statValue}>{animal.tamano}</Text>
            </View>
          </View>

          {/* Health chips */}
          {healthChips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Salud y Cuidados</Text>
              <View style={styles.healthRow}>
                {healthChips.map((chip) => (
                  <View key={chip.label} style={styles.healthChip}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                    <Text style={styles.healthChipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre {animal.nombre}</Text>
            <Text style={styles.description}>{animal.descripcion}</Text>
          </View>

          {/* Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación del Refugio</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                ...FUNDACION_COORDS,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={FUNDACION_COORDS} />
            </MapView>
            <View style={styles.foundationRow}>
              <View style={styles.foundationIconBox}>
                <Ionicons name="location" size={20} color={Colors.white} />
              </View>
              <View style={styles.foundationText}>
                <Text style={styles.foundationName}>{FUNDACION_NOMBRE}</Text>
                <Text style={styles.foundationAddress}>{FUNDACION_DIRECCION}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.accentButton} activeOpacity={0.86} onPress={openGenerativePreview}>
          <Ionicons name="sparkles" size={18} color={Colors.white} />
          <Text style={styles.accentButtonText}>¿Cómo se verá conmigo?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, animal.estado !== 'disponible' ? styles.disabledButton : null]}
          activeOpacity={0.86}
          disabled={animal.estado !== 'disponible'}
          onPress={requestAdoption}
        >
          <Text style={styles.primaryButtonText}>Solicitar adopción</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    left: Spacing.lg,
    position: 'absolute',
    top: 52,
    width: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textTransform: 'capitalize',
    flex: 1,
    marginRight: Spacing.md,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  healthChip: {
    alignItems: 'center',
    borderColor: Colors.secondary,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  healthChipText: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  map: {
    borderRadius: 16,
    height: 160,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    width: '100%',
  },
  foundationRow: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  foundationIconBox: {
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  foundationText: {
    flex: 1,
  },
  foundationName: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  foundationAddress: {
    color: Colors.neutralLight,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.neutralLight,
    borderTopWidth: 1,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  accentButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  accentButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
