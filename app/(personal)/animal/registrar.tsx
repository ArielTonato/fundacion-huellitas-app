import { Ionicons } from '@expo/vector-icons';
import { AnimalRegistrationForm } from '@src/modules/adopcion/components/AnimalRegistrationForm';
import type { AnimalFormData } from '@src/modules/adopcion/schemas/animalSchema';
import { registrarAnimal } from '@src/modules/adopcion/services/animalesService';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
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
    <View style={styles.root}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />

      <View style={styles.sheet} pointerEvents="box-none">
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Nueva Mascota</Text>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.75} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <AnimalRegistrationForm submitLabel="Guardar Mascota" submitting={submitting} onSubmit={handleSubmit} />
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
