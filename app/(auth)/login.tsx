import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useAuth } from '@src/shared/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@src/shared/schemas/loginSchema';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FirebaseAuthError extends Error {
  code?: string;
}

function getSignInErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const authError = error as FirebaseAuthError;
    console.log('Error de autenticación:', authError);
    if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
      return 'La contraseña es incorrecta o el correo electronico es invalido.';
    }
    if (authError.code === 'auth/user-disabled') {
      return 'Esta cuenta esta desactivada. Contacta al superadmin para reactivarla.';
    }
    if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-email') {
      return 'No existe una cuenta con ese correo electronico.';
    }
    return error.message;
  }
  return 'Error al iniciar sesion.';
}

export default function LoginScreen(): React.JSX.Element {
  const { signIn } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      setSubmitError(getSignInErrorMessage(error));
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
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/huellitas/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Fundacion Huellitas</Text>
          <Text style={styles.subtitle}>Iniciar sesion</Text>
        </View>

        <View style={styles.form}>
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
            placeholder="Ingrese su contraseña"
            secureTextEntry
            showSecureTextToggle
            errorMessage={errors.password?.message}
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
                <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                <Text style={styles.buttonText}>Ingresar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/register' as never)}
          >
            <Ionicons name="person-add-outline" size={15} color={Colors.accent} />
            <Text style={styles.linkText}>
              No tienes cuenta? <Text style={styles.linkAccent}>Registrate</Text>
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
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: Colors.white,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 140,   // un poco más pequeño que el contenedor
    height: 140,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
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
