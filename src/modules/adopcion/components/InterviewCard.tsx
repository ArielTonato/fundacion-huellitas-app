import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { Entrevista, EstadoEntrevista } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';

interface InterviewCardProps {
  entrevista: Entrevista;
  viveAcompanado?: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
}

const STATUS_LABELS: Record<EstadoEntrevista, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const STATUS_VARIANTS: Record<EstadoEntrevista, 'success' | 'warning' | 'error'> = {
  programada: 'warning',
  completada: 'success',
  cancelada: 'error',
};

function formatFecha(entrevista: Entrevista): string {
  return entrevista.fecha.toDate().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function InterviewCard({
  entrevista,
  viveAcompanado = false,
  onCancel,
  onComplete,
}: InterviewCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{formatFecha(entrevista)}</Text>
          <Text style={styles.subtitle}>{entrevista.hora}</Text>
        </View>
        <StatusBadge label={STATUS_LABELS[entrevista.estado]} variant={STATUS_VARIANTS[entrevista.estado]} />
      </View>
      {entrevista.notas ? <Text style={styles.notes}>{entrevista.notas}</Text> : null}
      {viveAcompanado ? (
        <View style={styles.companionBox}>
          <Text style={styles.companionText}>
            Debe asistir con al menos una persona mayor de 18 años que conviva con el/ella.
          </Text>
        </View>
      ) : null}
      {entrevista.resultado ? <Text style={styles.result}>Resultado: {entrevista.resultado}</Text> : null}
      {entrevista.estado === 'programada' && onComplete && onCancel ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.successSmallButton} activeOpacity={0.86} onPress={onComplete}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.smallButtonText}>Completar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerSmallButton} activeOpacity={0.86} onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.smallButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  notes: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  companionBox: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  companionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  result: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  successSmallButton: {
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  dangerSmallButton: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  smallButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
