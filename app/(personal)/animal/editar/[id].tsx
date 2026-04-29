import { Ionicons } from '@expo/vector-icons';
import { AnimalRegistrationForm } from '@src/modules/adopcion/components/AnimalRegistrationForm';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import type { AnimalFormData } from '@src/modules/adopcion/schemas/animalSchema';
import { editarAnimal } from '@src/modules/adopcion/services/animalesService';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { EstadoAnimal } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function buildInitialValues(animal: NonNullable<ReturnType<typeof useAnimal>['animal']>): AnimalFormData {
  return {
    nombre: animal.nombre,
    especie: animal.especie,
    raza: animal.raza,
    edad: {
      anios: animal.edad.anios,
      meses: animal.edad.meses,
      dias: animal.edad.dias,
    },
    sexo: animal.sexo as 'macho' | 'hembra',
    tamano: animal.tamano as 'pequeno' | 'mediano' | 'grande',
    descripcion: animal.descripcion,
    estadoSalud: animal.estadoSalud,
    vacunado: animal.vacunado,
    esterilizado: animal.esterilizado,
    fotos: animal.fotos,
  };
}

export default function EditarAnimalScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { animal, loading, error } = useAnimal(id);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (data: AnimalFormData, status: EstadoAnimal): Promise<void> => {
    if (!id) {
      Alert.alert('Error', 'No se pudo identificar el animal.');
      return;
    }

    setSubmitting(true);
    try {
      await editarAnimal(id, data, status);
      Alert.alert('Animal actualizado', 'Los cambios fueron guardados correctamente.');
      router.replace('/(personal)/' as never);
    } catch (submitError) {
      Alert.alert('Error', submitError instanceof Error ? submitError.message : 'No se pudo actualizar el animal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />

      <View style={styles.sheet} pointerEvents="box-none">
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Editar Mascota</Text>
            {animal ? <Text style={styles.sheetSubtitle}>{animal.nombre}</Text> : null}
          </View>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.75} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <LoadingIndicator />
        ) : !animal ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.errorText}>
              {error?.message ?? 'No se pudo cargar la ficha del animal.'}
            </Text>
          </View>
        ) : (
          <AnimalRegistrationForm
            initialValues={buildInitialValues(animal)}
            submitLabel="Guardar cambios"
            submitting={submitting}
            showStatus
            initialStatus={animal.estado}
            onSubmit={handleSubmit}
          />
        )}
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
    height: '90%',
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
    marginTop: Spacing.md,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sheetTitle: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
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
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});
