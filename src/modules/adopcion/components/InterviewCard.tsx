import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { Entrevista, EstadoEntrevista } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';

interface InterviewCardProps {
  entrevista: Entrevista;
  viveAcompanado?: boolean;
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

export function InterviewCard({ entrevista, viveAcompanado = false }: InterviewCardProps): React.JSX.Element {
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
});
