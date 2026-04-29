import { Ionicons } from '@expo/vector-icons';
import { InterviewCard } from '@src/modules/adopcion/components/InterviewCard';
import { useEntrevistas } from '@src/modules/adopcion/hooks/useEntrevistas';
import { actualizarEntrevista } from '@src/modules/adopcion/services/entrevistasService';
import { obtenerSolicitud } from '@src/modules/adopcion/services/solicitudesService';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Entrevista, EstadoEntrevista, Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type EntrevistaFilter = 'todas' | EstadoEntrevista;

const FILTERS: { label: string; value: EntrevistaFilter }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Programadas', value: 'programada' },
  { label: 'Completadas', value: 'completada' },
  { label: 'Canceladas', value: 'cancelada' },
];

function InterviewListItem({ entrevista, onUpdated }: { entrevista: Entrevista; onUpdated: () => void }): React.JSX.Element {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSolicitud(): Promise<void> {
      const loadedSolicitud = await obtenerSolicitud(entrevista.solicitudId);
      if (active) setSolicitud(loadedSolicitud);
    }

    loadSolicitud();
    return () => {
      active = false;
    };
  }, [entrevista.solicitudId]);

  const updateStatus = async (estado: EstadoEntrevista): Promise<void> => {
    try {
      await actualizarEntrevista(entrevista.id, estado);
      onUpdated();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar la entrevista.');
    }
  };

  return (
    <View>
      <InterviewCard entrevista={entrevista} viveAcompanado={solicitud?.viveAcompanado} />
      {entrevista.estado === 'programada' ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.successSmallButton} onPress={() => updateStatus('completada')}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.smallButtonText}>Completar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerSmallButton} onPress={() => updateStatus('cancelada')}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.smallButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function EntrevistasScreen(): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<EntrevistaFilter>('todas');
  const { entrevistas, loading, error, refresh } = useEntrevistas();
  const filteredEntrevistas = useMemo(
    () => entrevistas.filter((entrevista) => activeFilter === 'todas' || entrevista.estado === activeFilter),
    [activeFilter, entrevistas]
  );

  if (loading && entrevistas.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEntrevistas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InterviewListItem entrevista={item} onUpdated={refresh} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Agenda</Text>
            <Text style={styles.title}>Entrevistas</Text>
            <Text style={styles.subtitle}>Controla las entrevistas programadas para los procesos de adopción.</Text>
            <View style={styles.filtersRow}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[styles.filterPill, activeFilter === filter.value ? styles.filterPillActive : null]}
                  onPress={() => setActiveFilter(filter.value)}
                >
                  <Text style={[styles.filterText, activeFilter === filter.value ? styles.filterTextActive : null]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No hay entrevistas" message="Agenda una entrevista desde el detalle de una solicitud." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.lg },
  eyebrow: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.xs, textTransform: 'uppercase' },
  title: { color: Colors.primary, fontSize: FontSize.xxxl, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg, marginTop: Spacing.sm },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterPill: {
    backgroundColor: Colors.white,
    borderColor: Colors.neutralLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.white },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginTop: Spacing.md },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg, marginTop: -Spacing.sm },
  successSmallButton: { alignItems: 'center', backgroundColor: Colors.secondary, borderRadius: 12, flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6, padding: Spacing.md },
  dangerSmallButton: { alignItems: 'center', backgroundColor: Colors.error, borderRadius: 12, flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6, padding: Spacing.md },
  smallButtonText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
});
