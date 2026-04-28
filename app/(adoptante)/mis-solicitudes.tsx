import { Ionicons } from '@expo/vector-icons';
import { SolicitudCard } from '@src/modules/adopcion/components/SolicitudCard';
import { useSolicitudes } from '@src/modules/adopcion/hooks/useSolicitudes';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useAuth } from '@src/shared/hooks/useAuth';
import type { EstadoSolicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SolicitudFilter = 'todas' | EstadoSolicitud;

interface FilterOption {
  label: string;
  value: SolicitudFilter;
}

const FILTERS: FilterOption[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En revisión', value: 'en_revision' },
  { label: 'Entrevista agendada', value: 'entrevista_agendada' },
  { label: 'Aprobada', value: 'aprobada' },
  { label: 'Rechazada', value: 'rechazada' },
];

function FilterChip({
  label,
  activeLabel,
  isActive,
  onPress,
}: {
  label: string;
  activeLabel: string | null;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {isActive && activeLabel ? activeLabel : label}
      </Text>
      <Ionicons
        name="chevron-down"
        size={13}
        color={isActive ? Colors.white : Colors.textSecondary}
        style={{ marginLeft: 3 }}
      />
    </TouchableOpacity>
  );
}

export default function MisSolicitudesScreen(): React.JSX.Element {
  const { authUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<SolicitudFilter>('todas');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { solicitudes, loading, error, refresh } = useSolicitudes({ adoptanteId: authUser?.uid });

  const filteredSolicitudes = useMemo(
    () => solicitudes.filter((s) => activeFilter === 'todas' || s.estado === activeFilter),
    [activeFilter, solicitudes]
  );

  const activeLabel = activeFilter !== 'todas'
    ? FILTERS.find((f) => f.value === activeFilter)?.label ?? null
    : null;

  if (!authUser) {
    return <EmptyState title="Inicia sesión" message="Necesitas iniciar sesión para ver tus solicitudes." />;
  }

  if (loading && solicitudes.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Estado de solicitud</Text>
          {FILTERS.map((filter) => {
            const selected = filter.value === activeFilter;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                activeOpacity={0.75}
                onPress={() => {
                  setActiveFilter(filter.value);
                  setSheetOpen(false);
                }}
              >
                <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>
                  {filter.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={18} color={Colors.secondary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      <FlatList
        data={filteredSolicitudes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SolicitudCard solicitud={item} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Seguimiento</Text>
            <Text style={styles.title}>Mis solicitudes</Text>
            <Text style={styles.subtitle}>
              Revisa el estado de tus procesos de adopción y mantente pendiente de las entrevistas.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <FilterChip
                label="Estado"
                activeLabel={activeLabel}
                isActive={activeFilter !== 'todas'}
                onPress={() => setSheetOpen(true)}
              />
              {activeFilter !== 'todas' && (
                <TouchableOpacity style={styles.clearChip} onPress={() => setActiveFilter('todas')}>
                  <Ionicons name="close" size={13} color={Colors.error} />
                  <Text style={styles.clearChipText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No hay solicitudes"
            message="Cuando envíes una solicitud de adopción, aparecerá aquí con su estado actual."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
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
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
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
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
});
