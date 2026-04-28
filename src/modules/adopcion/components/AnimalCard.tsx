import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { Animal, EstadoAnimal } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { formatEdad } from '../utils/formatEdad';

interface AnimalCardProps {
  animal: Animal;
  index?: number;
  onPress: (animal: Animal) => void;
}

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

export function AnimalCard({ animal, index = 0, onPress }: AnimalCardProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const entering = reducedMotion ? undefined : FadeInUp.delay(index * 45).duration(320);

  return (
    <Animated.View entering={entering}>
      <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => onPress(animal)}>
        <Image source={{ uri: animal.fotos[0] }} style={styles.image} resizeMode="cover" />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Text style={styles.name} numberOfLines={1}>{animal.nombre}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {animal.especie} • {animal.raza}
              </Text>
            </View>
            <StatusBadge label={STATUS_LABELS[animal.estado]} variant={STATUS_VARIANTS[animal.estado]} />
          </View>

          <Text style={styles.description} numberOfLines={2}>{animal.descripcion}</Text>

          <View style={styles.footer}>
            <Text style={styles.detail}>{formatEdad(animal.edad)}</Text>
            <Text style={styles.detail}>{animal.tamano}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: Colors.neutralLight,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  detail: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    textTransform: 'capitalize',
  },
});
