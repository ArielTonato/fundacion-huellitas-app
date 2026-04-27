import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as yup from 'yup';

const profileSchema = yup.object().shape({
  nombre: yup.string().required('El nombre es requerido'),
  email: yup.string().email('Email invalido').required('El email es requerido'),
  telefono: yup.string().optional(),
  password: yup.string().min(6, 'Minimo 6 caracteres').optional(),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;

export function ProfileScreen(): React.JSX.Element {
  const { userProfile, signOut, updateProfile, updateUserPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      nombre: userProfile?.nombre || '',
      email: userProfile?.email || '',
      telefono: userProfile?.telefono || '',
      password: '',
    },
  });

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    if (userProfile && !initialDataLoaded) {
      reset({
        nombre: userProfile.nombre,
        email: userProfile.email,
        telefono: userProfile.telefono || '',
        password: '',
      });
      setInitialDataLoaded(true);
    }
  }, [userProfile, reset, initialDataLoaded]);

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setSubmitting(true);
    try {
      // Update profile info
      await updateProfile({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
      });

      // Update password if provided
      if (data.password) {
        await updateUserPassword(data.password);
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Datos</Text>
          
          <FormField
            control={control}
            name="nombre"
            label="Nombre completo"
            placeholder="Tu nombre"
            errorMessage={errors.nombre?.message}
          />

          <FormField
            control={control}
            name="email"
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            errorMessage={errors.email?.message}
          />

          <FormField
            control={control}
            name="telefono"
            label="Teléfono"
            placeholder="0999999999"
            keyboardType="phone-pad"
            errorMessage={errors.telefono?.message}
          />

          <FormField
            control={control}
            name="password"
            label="Nueva contraseña (opcional)"
            placeholder="Dejar en blanco para no cambiar"
            secureTextEntry
            errorMessage={errors.password?.message}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            {submitting ? (
              <LoadingIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
