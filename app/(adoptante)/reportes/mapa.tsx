import { MapaReportes } from '@src/modules/mascotas/components/MapaReportes';
import { useReportes } from '@src/modules/mascotas/hooks/useReportes';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { Stack, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function MapaScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const router = useRouter();
  const { reportes, loading, error } = useReportes();

  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      parentNavigation?.setOptions({ headerShown: false });

      return () => parentNavigation?.setOptions({ headerShown: true });
    }, [navigation])
  );

  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        title: 'Mapa mascotas extraviadas',
      }}
    />
  );

  if (loading && reportes.length === 0) {
    return (
      <>
        {header}
        <LoadingIndicator fullScreen />
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <EmptyState title="No se pudo cargar el mapa" message={error.message} />
      </>
    );
  }

  if (reportes.length === 0) {
    return (
      <>
        {header}
        <EmptyState title="No hay reportes activos" message="Aun no hay ubicaciones para mostrar." />
      </>
    );
  }

  return (
    <>
      {header}
      <MapaReportes
        reportes={reportes}
        onSelectReporte={(reporte) => router.push(`/(adoptante)/reportes/${reporte.id}` as never)}
      />
    </>
  );
}
