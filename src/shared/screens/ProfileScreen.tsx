import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { ProfileAvatar } from '@src/shared/components/ProfileAvatar';
import { useAuth } from '@src/shared/hooks/useAuth';
import { uploadProfileImage } from '@src/shared/services/firebase/storage';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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
  password: yup
    .string()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .min(6, 'Minimo 6 caracteres')
    .optional(),
});

type ProfileFormInput = {
  nombre: string;
  email: string;
  telefono: string | undefined;
  password: string | undefined;
};

type ProfileFormData = yup.InferType<typeof profileSchema>;

export function ProfileScreen(): React.JSX.Element {
  const { authUser, userProfile, signOut, updateProfile, updateUserPassword, deleteAccount } = useAuth();
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormData>({
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

  const pickProfilePhoto = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galeria para subir una foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setSubmitting(true);
    const emailChanged = data.email !== authUser?.email;
    try {
      let fotoPerfilUrl = userProfile?.fotoPerfilUrl;

      if (profilePhotoUri && authUser) {
        fotoPerfilUrl = await uploadProfileImage(authUser.uid, profilePhotoUri);
      }

      await updateProfile({
        nombre: data.nombre,
        email: data.email,
        ...(data.telefono ? { telefono: data.telefono } : {}),
        ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
      });

      if (data.password) {
        await updateUserPassword(data.password);
      }

      setProfilePhotoUri(null);

      if (emailChanged) {
        Alert.alert(
          'Verifica tu nuevo correo',
          `Enviamos un enlace de verificación a ${data.email}. Tu correo cambiará en la app al hacer clic en el enlace.`
        );
      } else {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
      }
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

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente. Se eliminarán tu cuenta y todas tus solicitudes de adopción.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '¿Estás completamente seguro?',
              'No podrás recuperar tu cuenta ni ningún dato asociado.',
              [
                { text: 'No, conservar cuenta', style: 'cancel' },
                {
                  text: 'Eliminar permanentemente',
                  style: 'destructive',
                  onPress: async () => {
                    setSubmitting(true);
                    try {
                      await deleteAccount();
                    } catch (error) {
                      setSubmitting(false);
                      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo eliminar la cuenta. Inténtalo más tarde.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Datos</Text>

          <View style={styles.photoSection}>
            <ProfileAvatar
              uri={profilePhotoUri ?? userProfile?.fotoPerfilUrl ?? null}
              size={120}
              fallbackIconSize={60}
            />
            <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={16} color={Colors.accent} />
              <Text style={styles.photoButtonText}>
                {profilePhotoUri || userProfile?.fotoPerfilUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil (opcional)'}
              </Text>
            </TouchableOpacity>
          </View>
          
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
              <LoadingIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {userProfile?.role === 'adoptante' ? (
          <View style={styles.section}>
            <Text style={styles.dangerZoneTitle}>Zona de peligro</Text>
            <Text style={styles.dangerZoneSubtitle}>
              Al eliminar tu cuenta se borrarán permanentemente tus datos y solicitudes.
            </Text>
            <TouchableOpacity
              style={[styles.deleteAccountButton, submitting ? styles.deleteAccountButtonDisabled : null]}
              onPress={handleDeleteAccount}
              disabled={submitting}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.deleteAccountButtonText}>Eliminar mi cuenta</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.accent,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  dangerZoneTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  dangerZoneSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  deleteAccountButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteAccountButtonDisabled: {
    opacity: 0.5,
  },
  deleteAccountButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
