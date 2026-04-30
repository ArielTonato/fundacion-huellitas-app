import { ReporteForm } from '@src/modules/mascotas/components/ReporteForm';
import { crearReporte } from '@src/modules/mascotas/services/reportesService';
import { useAuth } from '@src/shared/hooks/useAuth';
import type { ReporteFormData } from '@src/modules/mascotas/schemas/reporteSchema';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function ReportarScreen(): React.JSX.Element {
  const router = useRouter();
  const { authUser } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const submitReport = async (data: ReporteFormData): Promise<void> => {
    if (!authUser) {
      Alert.alert('Sesion requerida', 'Debes iniciar sesion para crear un reporte.');
      return;
    }

    try {
      setSubmitting(true);
      await crearReporte(data, authUser.uid);
      Alert.alert('Reporte publicado', 'Se notificara a la comunidad para ayudar a encontrarla.');
      router.replace('/(adoptante)/reportes' as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el reporte.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return <ReporteForm submitting={submitting} onSubmit={submitReport} />;
}
