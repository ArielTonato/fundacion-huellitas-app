import { Ionicons } from '@expo/vector-icons';
import { useReportes } from '@src/modules/mascotas/hooks/useReportes';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Reporte } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReporteCard } from './ReporteCard';

interface ReportesListProps {
  title: string;
  eyebrow: string;
  detailRoute: (id: string) => string;
  mapRoute: string;
  reportRoute?: string;
}

export function ReportesList({
  title,
  eyebrow,
  detailRoute,
  mapRoute,
  reportRoute,
}: ReportesListProps): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');
  const { reportes, loading, error, refresh } = useReportes({ search });

  const openReporte = (reporte: Reporte): void => {
    router.push(detailRoute(reporte.id) as never);
  };

  if (loading && reportes.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ReporteCard reporte={item} index={index} onPress={openReporte} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Busca por nombre, especie o ubicacion..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={() => router.push(mapRoute as never)}>
                <Ionicons name="map" size={18} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Mapa</Text>
              </TouchableOpacity>
              {reportRoute ? (
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.86} onPress={() => router.push(reportRoute as never)}>
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Reportar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No hay reportes activos"
            message="Cuando se reporte una mascota extraviada, aparecera aqui en tiempo real."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
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
    fontSize: FontSize.xs,
    paddingVertical: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
});
