import { Ionicons } from '@expo/vector-icons';
import type { Reporte } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';

interface ReporteCardProps {
  reporte: Reporte;
  index?: number;
  onPress: (reporte: Reporte) => void;
}

function formatRelativeDate(reporte: Reporte): string {
  const createdAt = reporte.creadoEn?.toDate?.();
  if (!createdAt) return 'Fecha no disponible';

  const diffHours = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (60 * 60 * 1000)));
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

export function ReporteCard({ reporte, index = 0, onPress }: ReporteCardProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const entering = reducedMotion ? undefined : FadeInUp.delay(index * 45).duration(320);

  return (
    <Animated.View entering={entering}>
      <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => onPress(reporte)}>
        <Image source={{ uri: reporte.fotos[0] }} style={styles.image} resizeMode="cover" />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Text style={styles.name} numberOfLines={1}>{reporte.nombre}</Text>
              <Text style={styles.meta}>{reporte.especie}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="alert-circle" size={14} color={Colors.white} />
              <Text style={styles.badgeText}>Extraviad{reporte.sexo === 'macho' ? 'o' : 'a'}</Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>{reporte.descripcion}</Text>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detail} numberOfLines={1}>{reporte.ultimaUbicacion.direccion}</Text>
            </View>
            <Text style={styles.date}>{formatRelativeDate(reporte)}</Text>
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
    elevation: 3,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  image: {
    backgroundColor: Colors.neutralLight,
    height: 190,
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
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
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    gap: Spacing.sm,
  },
  footerItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  detail: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  date: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
