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
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <InterviewCard
      entrevista={entrevista}
      viveAcompanado={solicitud?.viveAcompanado}
      onCancel={() => updateStatus('cancelada')}
      onComplete={() => updateStatus('completada')}
    />
  );
}

export default function EntrevistasScreen(): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<EntrevistaFilter>('todas');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { entrevistas, loading, error, refresh } = useEntrevistas();
  const filteredEntrevistas = useMemo(
    () => entrevistas.filter((entrevista) => activeFilter === 'todas' || entrevista.estado === activeFilter),
    [activeFilter, entrevistas]
  );
  const activeLabel = activeFilter !== 'todas'
    ? FILTERS.find((filter) => filter.value === activeFilter)?.label ?? null
    : null;

  if (loading && entrevistas.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Estado de entrevista</Text>
          {FILTERS.map((filter) => {
            const selected = filter.value === activeFilter;

            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.sheetOption, selected ? styles.sheetOptionActive : null]}
                activeOpacity={0.75}
                onPress={() => {
                  setActiveFilter(filter.value);
                  setSheetOpen(false);
                }}
              >
                <Text style={[styles.sheetOptionText, selected ? styles.sheetOptionTextActive : null]}>
                  {filter.label}
                </Text>
                {selected ? <Ionicons name="checkmark" size={18} color={Colors.secondary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.filterChip, activeFilter !== 'todas' ? styles.filterChipActive : null]}
                activeOpacity={0.75}
                onPress={() => setSheetOpen(true)}
              >
                <Text style={[styles.filterChipText, activeFilter !== 'todas' ? styles.filterChipTextActive : null]}>
                  {activeFilter !== 'todas' && activeLabel ? activeLabel : 'Estado'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={13}
                  color={activeFilter !== 'todas' ? Colors.white : Colors.textSecondary}
                  style={{ marginLeft: 3 }}
                />
              </TouchableOpacity>
              {activeFilter !== 'todas' ? (
                <TouchableOpacity
                  style={styles.clearChip}
                  activeOpacity={0.75}
                  onPress={() => setActiveFilter('todas')}
                >
                  <Ionicons name="close" size={13} color={Colors.error} />
                  <Text style={styles.clearChipText}>Limpiar</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
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
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.neutralLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  filterChipTextActive: { color: Colors.white },
  clearChip: {
    alignItems: 'center',
    borderColor: Colors.error,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearChipText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 4,
    marginBottom: Spacing.lg,
    width: 40,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sheetOption: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sheetOptionActive: {
    backgroundColor: `${Colors.secondary}18`,
  },
  sheetOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  sheetOptionTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginTop: Spacing.md },
});
