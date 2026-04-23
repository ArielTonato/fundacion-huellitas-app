import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { registerSchema, type RegisterFormData } from '@src/shared/schemas/registerSchema';
import { useAuth } from '@src/shared/hooks/useAuth';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';

export default function RegisterScreen(): React.JSX.Element {
  const { signUp } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

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
      await signUp(data.email, data.password, data.nombre, data.telefono || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la cuenta.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
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
            label="Contrasena"
            placeholder="Minimo 6 caracteres"
            secureTextEntry
            errorMessage={errors.password?.message}
          />

          <FormField
            control={control}
            name="confirmPassword"
            label="Confirmar contrasena"
            placeholder="Repite tu contrasena"
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
              <Text style={styles.buttonText}>Registrarme</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
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
    marginTop: Spacing.sm,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  linkButton: {
    alignItems: 'center',
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
