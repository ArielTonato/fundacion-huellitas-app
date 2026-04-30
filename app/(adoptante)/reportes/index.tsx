import { ReportesList } from '@src/modules/mascotas/components/ReportesList';

export default function ListaReportesScreen(): React.JSX.Element {
  return (
    <ReportesList
      title="Mascotas extraviadas"
      eyebrow="Ayudemos a encontrarlas"
      detailRoute={(id) => `/(adoptante)/reportes/${id}`}
      mapRoute="/(adoptante)/reportes/mapa"
      reportRoute="/(adoptante)/reportes/reportar"
    />
  );
}
