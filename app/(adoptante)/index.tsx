import { Ionicons } from '@expo/vector-icons';
import { AnimalCard } from '@src/modules/adopcion/components/AnimalCard';
import { useAnimales, type AnimalFilters } from '@src/modules/adopcion/hooks/useAnimales';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Animal, Especie } from '@src/shared/types/models';
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

type EsterilizadoFilter = 'todos' | 'si' | 'no';

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

const SPECIES_OPTIONS: FilterOption<'todos' | Especie>[] = [
  { label: 'Todos', value: 'todos' },
  { label: '🐶 Perros', value: 'perro' },
  { label: '🐱 Gatos', value: 'gato' },
];

const SIZE_OPTIONS: FilterOption<'todos' | string>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pequeño', value: 'pequeno' },
  { label: 'Mediano', value: 'mediano' },
  { label: 'Grande', value: 'grande' },
];

const STERILIZED_OPTIONS: FilterOption<EsterilizadoFilter>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Esterilizados', value: 'si' },
  { label: 'No esterilizados', value: 'no' },
];

type ActiveFilter = 'especie' | 'tamano' | 'esterilizado' | null;

function matchesSearch(animal: Animal, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return [animal.nombre, animal.raza, animal.descripcion, animal.especie]
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

function FilterSheet<T extends string>({
  visible,
  title,
  options,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: FilterOption<T>[];
  current: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {options.map((option) => {
          const selected = option.value === current;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.sheetOption, selected && styles.sheetOptionActive]}
              activeOpacity={0.75}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextActive]}>
                {option.label}
              </Text>
              {selected && <Ionicons name="checkmark" size={18} color={Colors.secondary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

export default function CatalogoScreen(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');
  const [species, setSpecies] = useState<'todos' | Especie>('todos');
  const [size, setSize] = useState<string>('todos');
  const [sterilized, setSterilized] = useState<EsterilizadoFilter>('todos');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);

  const filters: AnimalFilters = {
    soloDisponibles: true,
    especie: species === 'todos' ? undefined : species,
    tamano: size === 'todos' ? undefined : size,
    esterilizado: sterilized === 'todos' ? 'todos' : sterilized === 'si',
  };

  const { animales, loading, error, refresh } = useAnimales(filters);
  const filteredAnimals = useMemo(
    () => animales.filter((animal) => matchesSearch(animal, search)),
    [animales, search]
  );

  const activeCount = [species !== 'todos', size !== 'todos', sterilized !== 'todos'].filter(Boolean).length;

  const openAnimal = (animal: Animal): void => {
    router.push(`/(adoptante)/animal/${animal.id}` as never);
  };

  const speciesLabel = species !== 'todos' ? SPECIES_OPTIONS.find((o) => o.value === species)?.label ?? null : null;
  const sizeLabel = size !== 'todos' ? SIZE_OPTIONS.find((o) => o.value === size)?.label ?? null : null;
  const sterilizedLabel =
    sterilized !== 'todos' ? STERILIZED_OPTIONS.find((o) => o.value === sterilized)?.label ?? null : null;

  if (loading && animales.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FilterSheet
        visible={activeFilter === 'especie'}
        title="Especie"
        options={SPECIES_OPTIONS}
        current={species}
        onSelect={setSpecies}
        onClose={() => setActiveFilter(null)}
      />
      <FilterSheet
        visible={activeFilter === 'tamano'}
        title="Tamaño"
        options={SIZE_OPTIONS}
        current={size}
        onSelect={setSize}
        onClose={() => setActiveFilter(null)}
      />
      <FilterSheet
        visible={activeFilter === 'esterilizado'}
        title="Esterilización"
        options={STERILIZED_OPTIONS}
        current={sterilized}
        onSelect={setSterilized}
        onClose={() => setActiveFilter(null)}
      />

      <FlatList
        data={filteredAnimals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <AnimalCard animal={item} index={index} onPress={openAnimal} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Adopciones responsables</Text>
            <Text style={styles.title}>Encuentra a tu nuevo compañero</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={Colors.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Busca por nombre, raza..."
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <FilterChip
                label="Especie"
                activeLabel={speciesLabel}
                isActive={species !== 'todos'}
                onPress={() => setActiveFilter('especie')}
              />
              <FilterChip
                label="Tamaño"
                activeLabel={sizeLabel}
                isActive={size !== 'todos'}
                onPress={() => setActiveFilter('tamano')}
              />
              <FilterChip
                label="Esterilizado"
                activeLabel={sterilizedLabel}
                isActive={sterilized !== 'todos'}
                onPress={() => setActiveFilter('esterilizado')}
              />
              {activeCount > 0 && (
                <TouchableOpacity
                  style={styles.clearChip}
                  onPress={() => {
                    setSpecies('todos');
                    setSize('todos');
                    setSterilized('todos');
                  }}
                >
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
            title="No hay animales para mostrar"
            message="Prueba ajustando los filtros o vuelve a actualizar el catalogo."
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
  listContent: {
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
    fontSize: FontSize.xxl,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    marginBottom: Spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    gap: Spacing.sm,
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
  // Bottom sheet
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
