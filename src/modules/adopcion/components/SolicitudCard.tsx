import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { EstadoSolicitud, Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

interface SolicitudCardProps {
  solicitud: Solicitud;
}

const STATUS_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  entrevista_agendada: 'Entrevista',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const STATUS_VARIANTS: Record<EstadoSolicitud, 'success' | 'warning' | 'error' | 'neutral'> = {
  pendiente: 'warning',
  en_revision: 'neutral',
  entrevista_agendada: 'warning',
  aprobada: 'success',
  rechazada: 'error',
};

function formatCreatedAt(solicitud: Solicitud): string {
  const timestamp = solicitud.creadoEn;

  if (!timestamp) {
    return 'Fecha pendiente';
  }

  return timestamp.toDate().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function SolicitudCard({ solicitud }: SolicitudCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Solicitud de adopción</Text>
          <Text style={styles.subtitle}>Animal #{solicitud.animalId.slice(0, 8)}</Text>
        </View>
        <StatusBadge label={STATUS_LABELS[solicitud.estado]} variant={STATUS_VARIANTS[solicitud.estado]} />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Solicitante</Text>
        <Text style={styles.value}>{solicitud.nombreCompleto}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.value}>{formatCreatedAt(solicitud)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Contacto</Text>
        <Text style={styles.value}>{solicitud.telefonoCelular || solicitud.telefonoFijo || 'Sin teléfono'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    backgroundColor: Colors.neutralLight,
    height: 1,
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  value: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
});
