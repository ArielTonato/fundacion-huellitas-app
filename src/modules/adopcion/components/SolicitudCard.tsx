import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { EstadoSolicitud, Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Image, StyleSheet, Text, View } from 'react-native';

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
  const { animal } = useAnimal(solicitud.animalId);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {animal?.fotos[0] ? (
          <Image source={{ uri: animal.fotos[0] }} style={styles.animalPhoto} />
        ) : (
          <View style={[styles.animalPhoto, styles.animalPhotoPlaceholder]} />
        )}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{animal?.nombre ?? 'Cargando...'}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {animal ? `${animal.especie} • ${animal.raza}` : `#${solicitud.animalId.slice(0, 8)}`}
          </Text>
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  animalPhoto: {
    borderRadius: 12,
    height: 56,
    width: 56,
  },
  animalPhotoPlaceholder: {
    backgroundColor: Colors.neutralLight,
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
