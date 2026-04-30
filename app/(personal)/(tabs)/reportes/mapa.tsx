import { MapaReportes } from '@src/modules/mascotas/components/MapaReportes';
import { useReportes } from '@src/modules/mascotas/hooks/useReportes';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useRouter } from 'expo-router';

export default function MapaReportesPersonalScreen(): React.JSX.Element {
  const router = useRouter();
  const { reportes, loading, error } = useReportes();

  if (loading && reportes.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  if (error) {
    return <EmptyState title="No se pudo cargar el mapa" message={error.message} />;
  }

  if (reportes.length === 0) {
    return <EmptyState title="No hay reportes activos" message="Aun no hay ubicaciones para mostrar." />;
  }

  return (
    <MapaReportes
      reportes={reportes}
      onSelectReporte={(reporte) => router.push(`/(personal)/(tabs)/reportes/${reporte.id}` as never)}
    />
  );
}
