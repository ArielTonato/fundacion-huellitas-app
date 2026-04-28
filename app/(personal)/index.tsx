import { Ionicons } from '@expo/vector-icons';
import { AnimalCard } from '@src/modules/adopcion/components/AnimalCard';
import { useAnimales } from '@src/modules/adopcion/hooks/useAnimales';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Animal, EstadoAnimal } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type EstadoFilter = 'todos' | EstadoAnimal;

interface FilterOption {
  label: string;
  value: EstadoFilter;
}

const STATUS_FILTERS: FilterOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Disponible', value: 'disponible' },
  { label: 'En proceso', value: 'en_proceso' },
  { label: 'Adoptado', value: 'adoptado' },
];

function matchesSearch(animal: Animal, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return [animal.nombre, animal.raza, animal.especie, animal.descripcion]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

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

export default function GestionAnimalesScreen(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<EstadoFilter>('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { animales, loading, error, refresh } = useAnimales();

  const filteredAnimals = useMemo(
    () =>
      animales.filter(
        (animal) =>
          (statusFilter === 'todos' || animal.estado === statusFilter) &&
          matchesSearch(animal, search)
      ),
    [animales, search, statusFilter]
  );

  const activeLabel = statusFilter !== 'todos'
    ? STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? null
    : null;

  const openEdit = (animal: Animal): void => {
    router.push(`/(personal)/animal/editar/${animal.id}` as never);
  };

  const openRegister = (): void => {
    router.push('/(personal)/animal/registrar' as never);
  };

  if (loading && animales.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Estado del animal</Text>
          {STATUS_FILTERS.map((filter) => {
            const selected = filter.value === statusFilter;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                activeOpacity={0.75}
                onPress={() => {
                  setStatusFilter(filter.value);
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
        data={filteredAnimals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <AnimalCard animal={item} index={index} onPress={openEdit} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Panel del personal</Text>
            <Text style={styles.title}>Gestión de animales</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Busca por nombre, raza, descripción..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <FilterChip
                label="Estado"
                activeLabel={activeLabel}
                isActive={statusFilter !== 'todos'}
                onPress={() => setSheetOpen(true)}
              />
              {statusFilter !== 'todos' && (
                <TouchableOpacity style={styles.clearChip} onPress={() => setStatusFilter('todos')}>
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
            title="No hay animales"
            message="Registra el primer animal para que aparezca en el catálogo."
          />
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.86} onPress={openRegister}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
    paddingBottom: 96,
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
    marginBottom: Spacing.sm,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.xs,
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
    marginTop: Spacing.md,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 999,
    bottom: Spacing.xl,
    elevation: 4,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.xl,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    width: 58,
  },
});
