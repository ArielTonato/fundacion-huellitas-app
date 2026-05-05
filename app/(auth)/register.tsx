import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { ProfileAvatar } from '@src/shared/components/ProfileAvatar';
import { DATA_TREATMENT_PURPOSES } from '@src/shared/constants/privacy';
import { useAuth } from '@src/shared/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@src/shared/schemas/registerSchema';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
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
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmPassword: '', telefono: '', aceptaPrivacidad: false },
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
        profilePhotoUri || undefined,
        data.aceptaPrivacidad
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
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPrivacyModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconBox}>
              <Ionicons name="shield-checkmark" size={34} color={Colors.secondary} />
            </View>
            <Text style={styles.modalTitle}>Finalidad del tratamiento de datos</Text>
            <Text style={styles.modalBody}>
              Tus datos personales se usan únicamente para el funcionamiento de la aplicación Fundación Huellitas.
              No se venden ni se usan para fines externos.
            </Text>
            <View style={styles.purposeList}>
              {DATA_TREATMENT_PURPOSES.map((purpose) => (
                <View key={purpose} style={styles.purposeItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                  <Text style={styles.purposeText}>{purpose}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.86}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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

          <Controller
            control={control}
            name="aceptaPrivacidad"
            render={({ field: { value, onChange } }) => (
              <View style={styles.privacyBlock}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.82}
                  onPress={() => onChange(!value)}
                >
                  <View style={[styles.checkbox, value ? styles.checkboxChecked : null]}>
                    {value ? <Ionicons name="checkmark" size={16} color={Colors.white} /> : null}
                  </View>
                  <Text style={styles.privacyText}>
                    Acepto la política de privacidad y autorizo el tratamiento de mis datos para usar la aplicación.
                  </Text>
                </TouchableOpacity>

                <View style={styles.privacyLinks}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setPrivacyModalVisible(true)}>
                    <Text style={styles.privacyLink}>Ver finalidad</Text>
                  </TouchableOpacity>
                  <Text style={styles.privacySeparator}>•</Text>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(auth)/privacy' as never)}>
                    <Text style={styles.privacyLink}>Política de privacidad</Text>
                  </TouchableOpacity>
                </View>

                {errors.aceptaPrivacidad?.message ? (
                  <Text style={styles.privacyError}>{errors.aceptaPrivacidad.message}</Text>
                ) : null}
              </View>
            )}
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
  privacyBlock: {
    backgroundColor: Colors.white,
    borderColor: Colors.neutralLight,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  checkboxRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.neutralMid,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  privacyText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  privacyLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginLeft: 30,
    marginTop: Spacing.sm,
  },
  privacyLink: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  privacySeparator: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  privacyError: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginLeft: 30,
    marginTop: Spacing.sm,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 31, 46, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
  },
  modalIconBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    width: 58,
  },
  modalTitle: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  purposeList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  purposeItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  purposeText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: Spacing.md,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
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
