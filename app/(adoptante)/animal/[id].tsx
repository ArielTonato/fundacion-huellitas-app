import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import { formatEdad } from '@src/modules/adopcion/utils/formatEdad';
import type { EstadoAnimal } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.detailTextGroup}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

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

  const requestAdoption = (): void => {
    router.push(`/(adoptante)/solicitud/${animal.id}` as never);
  };

  const openGenerativePreview = (): void => {
    Alert.alert('Proximamente', 'La vista de IA generativa se implementara en la Fase 6.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FlatList
        data={animal.fotos}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />}
        style={styles.carousel}
      />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.name}>{animal.nombre}</Text>
            <Text style={styles.subtitle}>{animal.especie} • {animal.raza}</Text>
          </View>
          <StatusBadge label={STATUS_LABELS[animal.estado]} variant={STATUS_VARIANTS[animal.estado]} />
        </View>

        <Text style={styles.description}>{animal.descripcion}</Text>

        <View style={styles.detailsGrid}>
          <DetailRow icon="calendar-outline" label="Edad" value={formatEdad(animal.edad)} />
          <DetailRow icon="resize-outline" label="Tamaño" value={animal.tamano} />
          <DetailRow icon="male-female-outline" label="Sexo" value={animal.sexo} />
          <DetailRow icon="location-outline" label="Ubicación" value={animal.ubicacion} />
          <DetailRow icon="medkit-outline" label="Salud" value={animal.estadoSalud} />
          <DetailRow icon="shield-checkmark-outline" label="Vacunado" value={animal.vacunado ? 'Si' : 'No'} />
          <DetailRow icon="heart-circle-outline" label="Esterilizado" value={animal.esterilizado ? 'Si' : 'No'} />
        </View>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, animal.estado !== 'disponible' ? styles.disabledButton : null]}
          activeOpacity={0.86}
          disabled={animal.estado !== 'disponible'}
          onPress={requestAdoption}
        >
          <Ionicons name="document-text-outline" size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Solicitar adopcion</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.accentButton} activeOpacity={0.86} onPress={openGenerativePreview}>
          <Ionicons name="sparkles-outline" size={20} color={Colors.accent} />
          <Text style={styles.accentButtonText}>Como se vera conmigo?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxxl,
  },
  carousel: {
    backgroundColor: Colors.neutralLight,
  },
  heroImage: {
    width: 390,
    height: 300,
    backgroundColor: Colors.neutralLight,
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -Spacing.xl,
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flex: 1,
  },
  name: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  description: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  detailsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 16,
    flexDirection: 'row',
    padding: Spacing.md,
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    marginRight: Spacing.md,
    width: 36,
  },
  detailTextGroup: {
    flex: 1,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
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
  accentButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.accent,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  accentButtonText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
});
