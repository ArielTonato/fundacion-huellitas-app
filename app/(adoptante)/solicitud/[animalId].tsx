import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { AdoptionImageCard } from '@src/modules/adopcion/components/AdoptionImageCard';
import { useAnimal } from '@src/modules/adopcion/hooks/useAnimal';
import { solicitudSchema, type SolicitudFormData } from '@src/modules/adopcion/schemas/solicitudSchema';
import { crearSolicitud } from '@src/modules/adopcion/services/solicitudesService';
import { formatEdad } from '@src/modules/adopcion/utils/formatEdad';
import { EmptyState } from '@src/shared/components/EmptyState';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SolicitudFormInput = {
  nombreCompleto: string;
  fotoCedulaFrontal: string;
  fotoCedulaPosterior: string;
  telefonoCelular: string | undefined;
  telefonoFijo: string | undefined;
  ingresosMensuales: number;
  fotoUbicacionAnimal: string;
  viveAcompanado: boolean;
};

type ImageFieldName = 'fotoCedulaFrontal' | 'fotoCedulaPosterior' | 'fotoUbicacionAnimal';

interface SectionTitleProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

function SectionTitle({ icon, title }: SectionTitleProps): React.JSX.Element {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function SolicitudScreen(): React.JSX.Element {
  const router = useRouter();
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const { authUser, userProfile } = useAuth();
  const { animal, loading: animalLoading } = useAnimal(animalId);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SolicitudFormInput, unknown, SolicitudFormData>({
    resolver: yupResolver(solicitudSchema),
    defaultValues: {
      nombreCompleto: '',
      fotoCedulaFrontal: '',
      fotoCedulaPosterior: '',
      telefonoCelular: '',
      telefonoFijo: '',
      ingresosMensuales: undefined as unknown as number,
      fotoUbicacionAnimal: '',
      viveAcompanado: false,
    },
  });
  const imageValues = watch(['fotoCedulaFrontal', 'fotoCedulaPosterior', 'fotoUbicacionAnimal']);

  useEffect(() => {
    reset((currentValues) => ({
      ...currentValues,
      nombreCompleto: currentValues.nombreCompleto || userProfile?.nombre || '',
      telefonoCelular: currentValues.telefonoCelular || userProfile?.telefono || '',
    }));
  }, [reset, userProfile]);

  const pickImage = async (fieldName: ImageFieldName): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galeria para subir la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setValue(fieldName, result.assets[0].uri, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: SolicitudFormData): Promise<void> => {
    setSubmitError(null);

    if (!authUser || !animalId) {
      setSubmitError('No se pudo identificar al usuario o al animal.');
      return;
    }

    setSubmitting(true);
    try {
      await crearSolicitud(animalId, authUser.uid, data);
      Alert.alert('Solicitud enviada', 'Tu solicitud fue registrada correctamente.');
      router.replace('/(adoptante)/mis-solicitudes' as never);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  if (animalLoading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!animal) {
    return <EmptyState title="Animal no encontrado" message="No se pudo cargar el animal para la solicitud." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.78}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Solicitud de Adopción</Text>
        <View style={styles.helpDot}>
          <Ionicons name="help" size={15} color={Colors.white} />
        </View>
      </View>

      <View style={styles.brandBlock}>
        <View style={styles.logoBox}>
          <Image source={require('../../../assets/huellitas/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brandTitle}>Fundación Huellitas</Text>
        <Text style={styles.brandSubtitle}>Formulario de registro para futuros adoptantes</Text>
      </View>

      <View style={styles.animalSummary}>
        <Image source={{ uri: animal.fotos[0] }} style={styles.animalImage} />
        <View style={styles.animalText}>
          <Text style={styles.animalName}>{animal.nombre}</Text>
          <Text style={styles.animalMeta}>{animal.especie} • {animal.raza} • {formatEdad(animal.edad)}</Text>
        </View>
      </View>

      <SectionTitle icon="person" title="DATOS PERSONALES" />
      <View style={styles.card}>
        <FormField
          control={control}
          name="nombreCompleto"
          label="Nombre completo"
          placeholder="Ej. Juan Pérez"
          errorMessage={errors.nombreCompleto?.message}
        />
        <FormField
          control={control}
          name="telefonoCelular"
          label="Teléfono celular"
          placeholder="0999999999"
          keyboardType="phone-pad"
          errorMessage={errors.telefonoCelular?.message}
        />
        <FormField
          control={control}
          name="telefonoFijo"
          label="Teléfono fijo"
          placeholder="Opcional"
          keyboardType="phone-pad"
          errorMessage={errors.telefonoFijo?.message}
        />
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={Colors.textPrimary} />
          <Text style={styles.infoText}>Se requiere al menos un número de teléfono.</Text>
        </View>
        <FormField
          control={control}
          name="ingresosMensuales"
          label="Ingresos mensuales"
          placeholder="$ Monto aproximado"
          keyboardType="numeric"
          errorMessage={errors.ingresosMensuales?.message}
        />
      </View>

      <SectionTitle icon="id-card" title="DOCUMENTOS" />
      <View style={styles.documentsRow}>
        <AdoptionImageCard
          label="Foto cédula frontal"
          uri={imageValues[0]}
          errorMessage={errors.fotoCedulaFrontal?.message}
          onPress={() => pickImage('fotoCedulaFrontal')}
        />
        <AdoptionImageCard
          label="Foto cédula posterior"
          uri={imageValues[1]}
          errorMessage={errors.fotoCedulaPosterior?.message}
          onPress={() => pickImage('fotoCedulaPosterior')}
        />
      </View>

      <SectionTitle icon="home" title="VIVIENDA" />
      <View style={styles.homeCard}>
        <AdoptionImageCard
          label="Subir foto del hogar"
          uri={imageValues[2]}
          wide
          errorMessage={errors.fotoUbicacionAnimal?.message}
          onPress={() => pickImage('fotoUbicacionAnimal')}
        />
        <Text style={styles.homeHelp}>Foto del lugar donde vivirá el animal (patio, sala o habitación).</Text>
      </View>

      <SectionTitle icon="checkmark-circle-outline" title="VALIDACIÓN" />
      <View style={styles.card}>
        <Controller
          control={control}
          name="viveAcompanado"
          render={({ field: { value, onChange } }) => (
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.82}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value ? styles.checkboxActive : null]}>
                {value ? <Ionicons name="checkmark" size={18} color={Colors.white} /> : null}
              </View>
              <Text style={styles.checkboxText}>¿Vive con al menos una persona mayor de 18 años?</Text>
            </TouchableOpacity>
          )}
        />
        {errors.viveAcompanado?.message ? <Text style={styles.inlineError}>{errors.viveAcompanado.message}</Text> : null}
      </View>

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <TouchableOpacity
        style={styles.submitButton}
        disabled={submitting}
        activeOpacity={0.86}
        onPress={handleSubmit(onSubmit)}
      >
        {submitting ? (
          <LoadingIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Enviar solicitud</Text>
            <Ionicons name="send" size={21} color={Colors.white} />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  screenTitle: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  helpDot: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 64,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 64,
  },
  logo: {
    height: 48,
    width: 48,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  animalSummary: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  animalImage: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 14,
    height: 64,
    width: 64,
  },
  animalText: {
    flex: 1,
  },
  animalName: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  animalMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 10,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  infoText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  documentsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  homeCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  homeHelp: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 22,
    padding: Spacing.lg,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.textSecondary,
    borderRadius: 5,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  inlineError: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },
  submitError: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
    minHeight: 58,
    paddingVertical: Spacing.lg,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
