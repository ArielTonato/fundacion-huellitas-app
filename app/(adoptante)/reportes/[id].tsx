import { ReporteDetail } from '@src/modules/mascotas/components/ReporteDetail';
import { useLocalSearchParams } from 'expo-router';

export default function DetalleReporteScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReporteDetail reporteId={id} showResolveAction listRoute="/(adoptante)/reportes" />;
}
