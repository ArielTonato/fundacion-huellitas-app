import { Ionicons } from '@expo/vector-icons';
import { ReporteForm } from '@src/modules/mascotas/components/ReporteForm';
import type { ReporteFormData } from '@src/modules/mascotas/schemas/reporteSchema';
import { crearReporte } from '@src/modules/mascotas/services/reportesService';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportarScreen(): React.JSX.Element {
  const router = useRouter();
  const { authUser } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const closeDrawer = (): void => {
    router.back();
  };

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

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDrawer} />

      <View style={styles.sheet} pointerEvents="box-none">
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Reportar Mascota</Text>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.75} onPress={closeDrawer}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ReporteForm submitting={submitting} onSubmit={submitReport} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    height: '80%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 4,
    marginBottom: Spacing.md,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sheetTitle: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    borderColor: Colors.neutralLight,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  divider: {
    backgroundColor: Colors.neutralLight,
    height: 1,
    marginBottom: Spacing.xs,
  },
});
