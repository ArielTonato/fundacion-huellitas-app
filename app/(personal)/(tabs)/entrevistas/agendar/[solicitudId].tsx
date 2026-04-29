import { Ionicons } from '@expo/vector-icons';
import { crearEntrevista } from '@src/modules/adopcion/services/entrevistasService';
import { obtenerSolicitud } from '@src/modules/adopcion/services/solicitudesService';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AgendarEntrevistaScreen(): React.JSX.Element {
  const router = useRouter();
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fecha, setFecha] = useState<string>('');
  const [hora, setHora] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSolicitud(): Promise<void> {
      if (!solicitudId) {
        setLoading(false);
        return;
      }

      try {
        const loadedSolicitud = await obtenerSolicitud(solicitudId);
        if (active) setSolicitud(loadedSolicitud);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSolicitud();
    return () => {
      active = false;
    };
  }, [solicitudId]);

  const submit = async (): Promise<void> => {
    setError(null);

    if (!solicitudId || !fecha || !hora) {
      setError('Ingrese fecha y hora para agendar la entrevista.');
      return;
    }

    const fechaEntrevista = new Date(`${fecha}T${hora}:00`);

    if (Number.isNaN(fechaEntrevista.getTime()) || fechaEntrevista <= new Date()) {
      setError('La fecha y hora deben ser futuras.');
      return;
    }

    setSubmitting(true);
    try {
      await crearEntrevista(solicitudId, { fecha: fechaEntrevista, hora, notas });
      Alert.alert('Entrevista agendada', 'La entrevista fue registrada correctamente.');
      router.replace('/(personal)/(tabs)/entrevistas' as never);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo agendar la entrevista.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!solicitud) {
    return <EmptyState title="Solicitud no encontrada" message="No se pudo cargar la solicitud para agendar." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Agendar entrevista</Text>
      <Text style={styles.subtitle}>Define una fecha para entrevistar a {solicitud.nombreCompleto}.</Text>

      {solicitud.viveAcompanado ? (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.accent} />
          <Text style={styles.warningText}>
            El adoptante vive acompañado. Debe asistir con al menos una persona mayor de 18 años que conviva con el/ella.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Fecha</Text>
        <TextInput
          value={fecha}
          onChangeText={setFecha}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
        />
        <Text style={styles.label}>Hora</Text>
        <TextInput
          value={hora}
          onChangeText={setHora}
          placeholder="HH:mm"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
        />
        <Text style={styles.label}>Notas</Text>
        <TextInput
          value={notas}
          onChangeText={setNotas}
          placeholder="Indicaciones para la entrevista"
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.submitButton} disabled={submitting} activeOpacity={0.86} onPress={submit}>
        {submitting ? (
          <LoadingIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
            <Text style={styles.submitText}>Agendar entrevista</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  title: { color: Colors.primary, fontSize: FontSize.xxxl, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg, marginTop: Spacing.sm },
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
  label: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  textarea: { minHeight: 110 },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'center' },
  submitButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 14, flexDirection: 'row', gap: 8, minHeight: 56, justifyContent: 'center' },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
