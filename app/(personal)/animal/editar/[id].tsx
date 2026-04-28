import { Ionicons } from '@expo/vector-icons';
import { AnimalRegistrationForm } from '@src/modules/adopcion/components/AnimalRegistrationForm';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import type { AnimalFormData } from '@src/modules/adopcion/schemas/animalSchema';
import { editarAnimal } from '@src/modules/adopcion/services/animalesService';
import { EmptyState } from '@src/shared/components/EmptyState';
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

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!animal) {
    return (
      <EmptyState
        title="Animal no encontrado"
        message={error?.message ?? 'No se pudo cargar la ficha del animal.'}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.78} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Editar animal</Text>
          <Text style={styles.subtitle}>Actualiza la ficha de {animal.nombre}.</Text>
        </View>
      </View>

      <AnimalRegistrationForm
        initialValues={buildInitialValues(animal)}
        submitLabel="Guardar cambios"
        submitting={submitting}
        showStatus
        initialStatus={animal.estado}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});
