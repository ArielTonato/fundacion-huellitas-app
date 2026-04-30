import { ReportesList } from '@src/modules/mascotas/components/ReportesList';

export default function ListaReportesPersonalScreen(): React.JSX.Element {
  return (
    <ReportesList
      title="Reportes activos"
      eyebrow="Panel del personal"
      detailRoute={(id) => `/(personal)/(tabs)/reportes/${id}`}
      mapRoute="/(personal)/(tabs)/reportes/mapa"
    />
  );
}
