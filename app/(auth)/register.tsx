import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { ProfileAvatar } from '@src/shared/components/ProfileAvatar';
import { useAuth } from '@src/shared/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@src/shared/schemas/registerSchema';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function RegisterScreen(): React.JSX.Element {
  const { signUp } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmPassword: '', telefono: '' },
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await signUp(
        data.email,
        data.password,
        data.nombre,
        data.telefono || undefined,
        profilePhotoUri || undefined
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la cuenta.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Registrate como adoptante</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.photoSection}>
            <ProfileAvatar uri={profilePhotoUri} size={110} fallbackIconSize={56} />
            <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={16} color={Colors.accent} />
              <Text style={styles.photoButtonText}>
                {profilePhotoUri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil (opcional)'}
              </Text>
            </TouchableOpacity>
          </View>

          <FormField
            control={control}
            name="nombre"
            label="Nombre completo"
            placeholder="Tu nombre completo"
            errorMessage={errors.nombre?.message}
          />

          <FormField
            control={control}
            name="email"
            label="Correo electronico"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            errorMessage={errors.email?.message}
          />

          <FormField
            control={control}
            name="password"
            label="Contraseña"
            placeholder="Minimo 6 caracteres"
            secureTextEntry
            errorMessage={errors.password?.message}
          />

          <FormField
            control={control}
            name="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            secureTextEntry
            errorMessage={errors.confirmPassword?.message}
          />

          <FormField
            control={control}
            name="telefono"
            label="Telefono (opcional)"
            placeholder="0999999999"
            keyboardType="phone-pad"
            errorMessage={errors.telefono?.message}
          />

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
                <Text style={styles.buttonText}>Registrarme</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Ionicons name="log-in-outline" size={15} color={Colors.accent} />
            <Text style={styles.linkText}>
              Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesion</Text>
            </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
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
  submitError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  linkButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  linkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  linkAccent: {
    color: Colors.accent,
    fontWeight: '600',
  },
});
