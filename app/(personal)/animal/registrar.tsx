import { Ionicons } from '@expo/vector-icons';
import { AnimalRegistrationForm } from '@src/modules/adopcion/components/AnimalRegistrationForm';
import type { AnimalFormData } from '@src/modules/adopcion/schemas/animalSchema';
import { registrarAnimal } from '@src/modules/adopcion/services/animalesService';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RegistroAnimalScreen(): React.JSX.Element {
  const router = useRouter();
  const { authUser } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (data: AnimalFormData): Promise<void> => {
    if (!authUser) {
      Alert.alert('Error', 'No se pudo identificar al usuario.');
      return;
    }

    setSubmitting(true);
    try {
      await registrarAnimal(data, authUser.uid);
      Alert.alert('Animal registrado', 'El animal fue registrado correctamente.');
      router.replace('/(personal)/' as never);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo registrar el animal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.78} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Registrar animal</Text>
          <Text style={styles.subtitle}>Completa la ficha para publicarlo en el catálogo.</Text>
        </View>
      </View>

      <AnimalRegistrationForm submitLabel="Guardar animal" submitting={submitting} onSubmit={handleSubmit} />
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
