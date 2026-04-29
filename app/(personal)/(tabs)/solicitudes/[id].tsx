import { Ionicons } from '@expo/vector-icons';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import { cambiarEstadoSolicitud, confirmarEntrega, obtenerSolicitud } from '@src/modules/adopcion/services/solicitudesService';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { EstadoSolicitud, Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

interface SelectedDocument {
  label: string;
  uri: string;
}

function DocumentPreview({ label, uri, onOpen }: SelectedDocument & { onOpen: (document: SelectedDocument) => void }): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.documentCard} activeOpacity={0.86} onPress={() => onOpen({ label, uri })}>
      <Image source={{ uri }} style={styles.documentImage} />
      <Text style={styles.documentLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DetalleSolicitudScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);
  const { animal } = useAnimal(solicitud?.animalId);

  useEffect(() => {
    let active = true;

    async function loadSolicitud(): Promise<void> {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const loadedSolicitud = await obtenerSolicitud(id);
        if (active) setSolicitud(loadedSolicitud);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSolicitud();
    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async (estado: EstadoSolicitud): Promise<void> => {
    if (!solicitud) return;

    setSubmitting(true);
    try {
      await cambiarEstadoSolicitud(solicitud.id, estado);
      setSolicitud({ ...solicitud, estado });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleInterview = (): void => {
    if (solicitud) {
      router.push(`/(personal)/(tabs)/entrevistas/agendar/${solicitud.id}` as never);
    }
  };

  const confirmDelivery = async (): Promise<void> => {
    if (!solicitud) return;

    Alert.alert('Confirmar entrega', '¿Confirmas que el animal fue entregado al adoptante?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setSubmitting(true);
          try {
            await confirmarEntrega(solicitud.id);
            Alert.alert('Entrega confirmada', 'El animal fue marcado como adoptado.');
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo confirmar la entrega.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!solicitud) {
    return <EmptyState title="Solicitud no encontrada" message="No se pudo cargar la solicitud seleccionada." />;
  }

  return (
    <>
      <Modal
        visible={Boolean(selectedDocument)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDocument(null)}
      >
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerCloseButton} activeOpacity={0.86} onPress={() => setSelectedDocument(null)}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          {selectedDocument ? (
            <View style={styles.viewerContent}>
              <Image source={{ uri: selectedDocument.uri }} style={styles.viewerImage} resizeMode="contain" />
              <Text style={styles.viewerLabel}>{selectedDocument.label}</Text>
            </View>
          ) : null}
        </View>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        {animal?.fotos[0] ? <Image source={{ uri: animal.fotos[0] }} style={styles.animalImage} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{animal?.nombre ?? 'Solicitud de adopción'}</Text>
          <Text style={styles.subtitle}>{solicitud.nombreCompleto}</Text>
        </View>
        <StatusBadge label={STATUS_LABELS[solicitud.estado]} variant={STATUS_VARIANTS[solicitud.estado]} />
      </View>

      {solicitud.viveAcompanado ? (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.accent} />
          <Text style={styles.warningText}>
            El adoptante vive acompañado. Debe asistir a la entrevista con una persona mayor de 18 años que conviva con el/ella.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos del solicitante</Text>
        <InfoRow label="Nombre" value={solicitud.nombreCompleto} />
        <InfoRow label="Celular" value={solicitud.telefonoCelular ?? 'No registrado'} />
        <InfoRow label="Fijo" value={solicitud.telefonoFijo ?? 'No registrado'} />
        <InfoRow label="Ingresos" value={`$ ${solicitud.ingresosMensuales}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <View style={styles.documentsRow}>
          <DocumentPreview label="Cédula frontal" uri={solicitud.fotoCedulaFrontal} onOpen={setSelectedDocument} />
          <DocumentPreview label="Cédula posterior" uri={solicitud.fotoCedulaPosterior} onOpen={setSelectedDocument} />
        </View>
        <DocumentPreview label="Foto del hogar" uri={solicitud.fotoUbicacionAnimal} onOpen={setSelectedDocument} />
      </View>

      <View style={styles.actions}>
        {solicitud.estado === 'pendiente' ? (
          <TouchableOpacity style={styles.secondaryButton} disabled={submitting} onPress={() => updateStatus('en_revision')}>
            <Ionicons name="eye-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Marcar en revisión</Text>
          </TouchableOpacity>
        ) : null}

        {solicitud.estado !== 'rechazada' && solicitud.estado !== 'aprobada' ? (
          <TouchableOpacity style={styles.primaryButton} disabled={submitting} onPress={scheduleInterview}>
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Agendar entrevista</Text>
          </TouchableOpacity>
        ) : null}

        {solicitud.estado === 'entrevista_agendada' ? (
          <TouchableOpacity style={styles.successButton} disabled={submitting} onPress={() => updateStatus('aprobada')}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Aprobar solicitud</Text>
          </TouchableOpacity>
        ) : null}

        {solicitud.estado === 'aprobada' ? (
          <TouchableOpacity style={styles.successButton} disabled={submitting} onPress={confirmDelivery}>
            <Ionicons name="gift-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Confirmar entrega</Text>
          </TouchableOpacity>
        ) : null}

        {solicitud.estado !== 'rechazada' && solicitud.estado !== 'aprobada' ? (
          <TouchableOpacity style={styles.dangerButton} disabled={submitting} onPress={() => updateStatus('rechazada')}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Rechazar solicitud</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  headerCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  animalImage: { borderRadius: 14, height: 70, width: 70 },
  viewerBackdrop: {
    backgroundColor: 'rgba(15, 31, 46, 0.72)',
    flex: 1,
    justifyContent: 'center',
  },
  viewerCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.lg,
    top: 52,
    width: 44,
    zIndex: 2,
  },
  viewerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  viewerImage: {
    height: '82%',
    width: '100%',
  },
  viewerLabel: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  headerText: { flex: 1 },
  title: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: '700', textTransform: 'capitalize' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },
  warningBox: {
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  warningText: { color: Colors.textPrimary, flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 18, marginBottom: Spacing.lg, padding: Spacing.lg },
  sectionTitle: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing.sm },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm },
  value: { color: Colors.textPrimary, flex: 1, fontSize: FontSize.sm, fontWeight: '600', textAlign: 'right' },
  documentsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  documentCard: { flex: 1, backgroundColor: Colors.neutralLight, borderRadius: 14, overflow: 'hidden' },
  documentImage: { height: 130, width: '100%' },
  documentLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', padding: Spacing.md },
  actions: { gap: Spacing.md },
  primaryButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', gap: 8, padding: Spacing.lg },
  successButton: { alignItems: 'center', backgroundColor: Colors.secondary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', gap: 8, padding: Spacing.lg },
  dangerButton: { alignItems: 'center', backgroundColor: Colors.error, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', gap: 8, padding: Spacing.lg },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.lg,
  },
  primaryButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  secondaryButtonText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
