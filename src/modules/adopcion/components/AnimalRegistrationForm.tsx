import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { animalSchema, type AnimalFormData } from '../schemas/animalSchema';

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface AnimalRegistrationFormProps {
  initialValues?: AnimalFormData;
  submitLabel: string;
  submitting: boolean;
  showStatus?: boolean;
  initialStatus?: 'disponible' | 'en_proceso' | 'adoptado';
  onSubmit: (data: AnimalFormData, status: 'disponible' | 'en_proceso' | 'adoptado') => Promise<void>;
}

const SPECIES_OPTIONS: SelectOption<'perro' | 'gato'>[] = [
  { label: 'Perro', value: 'perro' },
  { label: 'Gato', value: 'gato' },
];

const SEX_OPTIONS: SelectOption<'macho' | 'hembra'>[] = [
  { label: 'Macho', value: 'macho' },
  { label: 'Hembra', value: 'hembra' },
];

const SIZE_OPTIONS: SelectOption<'pequeno' | 'mediano' | 'grande'>[] = [
  { label: 'Pequeño', value: 'pequeno' },
  { label: 'Mediano', value: 'mediano' },
  { label: 'Grande', value: 'grande' },
];

const STATUS_OPTIONS: SelectOption<'disponible' | 'en_proceso' | 'adoptado'>[] = [
  { label: 'Disponible', value: 'disponible' },
  { label: 'En proceso', value: 'en_proceso' },
  { label: 'Adoptado', value: 'adoptado' },
];

const DEFAULT_VALUES: AnimalFormData = {
  nombre: '',
  especie: 'perro',
  raza: '',
  edad: {
    anios: undefined,
    meses: undefined,
    dias: undefined,
  },
  sexo: 'macho',
  tamano: 'mediano',
  descripcion: '',
  estadoSalud: '',
  vacunado: false,
  esterilizado: false,
  desparasitado: false,
  fotos: [],
};

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }): React.JSX.Element {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SelectGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}): React.JSX.Element {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.optionPill, value === option.value ? styles.optionPillActive : null]}
            activeOpacity={0.82}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.optionText, value === option.value ? styles.optionTextActive : null]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function BooleanToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.booleanRow} activeOpacity={0.82} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value ? styles.checkboxActive : null]}>
        {value ? <Ionicons name="checkmark" size={18} color={Colors.white} /> : null}
      </View>
      <Text style={styles.booleanText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AnimalRegistrationForm({
  initialValues,
  submitLabel,
  submitting,
  showStatus = false,
  initialStatus = 'disponible',
  onSubmit,
}: AnimalRegistrationFormProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnimalFormData>({
    resolver: yupResolver(animalSchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });
  const photos = watch('fotos');
  const [status, setStatus] = useState<'disponible' | 'en_proceso' | 'adoptado'>(initialStatus);

  const pickPhotos = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galeria para subir fotos.');
      return;
    }

    const remainingSlots = 5 - photos.length;

    if (remainingSlots <= 0) {
      Alert.alert('Limite alcanzado', 'Puedes subir maximo 5 fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri).filter(Boolean);
      setValue('fotos', [...photos, ...selectedUris].slice(0, 5), { shouldValidate: true });
    }
  };

  const removePhoto = (photoUri: string): void => {
    setValue('fotos', photos.filter((photo) => photo !== photoUri), { shouldValidate: true });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle icon="paw" title="DATOS BASICOS" />
      <View style={styles.card}>
        <FormField control={control} name="nombre" label="Nombre" placeholder="Ej. Luna" errorMessage={errors.nombre?.message} />
        <FormField control={control} name="raza" label="Raza" placeholder="Ej. Mestizo" errorMessage={errors.raza?.message} />

        <Controller
          control={control}
          name="especie"
          render={({ field: { value, onChange } }) => (
            <SelectGroup label="Especie" value={value} options={SPECIES_OPTIONS} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="sexo"
          render={({ field: { value, onChange } }) => (
            <SelectGroup label="Sexo" value={value} options={SEX_OPTIONS} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="tamano"
          render={({ field: { value, onChange } }) => (
            <SelectGroup label="Tamaño" value={value} options={SIZE_OPTIONS} onChange={onChange} />
          )}
        />

        <FormField
          control={control}
          name="descripcion"
          label="Descripción"
          placeholder="Cuenta su personalidad, historia y necesidades"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          errorMessage={errors.descripcion?.message}
        />
      </View>

      <SectionTitle icon="calendar-outline" title="EDAD" />
      <View style={styles.card}>
        <View style={styles.ageRow}>
          <View style={styles.ageField}>
            <FormField control={control} name="edad.anios" label="Años" placeholder="0" keyboardType="numeric" />
          </View>
          <View style={styles.ageField}>
            <FormField control={control} name="edad.meses" label="Meses" placeholder="0" keyboardType="numeric" />
          </View>
          <View style={styles.ageField}>
            <FormField control={control} name="edad.dias" label="Días" placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        {errors.edad?.message ? <Text style={styles.inlineError}>{errors.edad.message}</Text> : null}
        {errors.edad?.meses?.message ? <Text style={styles.inlineError}>{errors.edad.meses.message}</Text> : null}
        {errors.edad?.dias?.message ? <Text style={styles.inlineError}>{errors.edad.dias.message}</Text> : null}
      </View>

      <SectionTitle icon="medkit-outline" title="SALUD" />
      <View style={styles.card}>
        <FormField
          control={control}
          name="estadoSalud"
          label="Estado de salud"
          placeholder="Ej. Sano, con vacunas al dia"
          errorMessage={errors.estadoSalud?.message}
        />
        <Controller
          control={control}
          name="vacunado"
          render={({ field: { value, onChange } }) => (
            <BooleanToggle label="Vacunado" value={value} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="esterilizado"
          render={({ field: { value, onChange } }) => (
            <BooleanToggle label="Esterilizado" value={value} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="desparasitado"
          render={({ field: { value, onChange } }) => (
            <BooleanToggle label="Desparasitado" value={value} onChange={onChange} />
          )}
        />
      </View>

      {showStatus ? (
        <>
          <SectionTitle icon="flag-outline" title="ESTADO" />
          <View style={styles.card}>
            <SelectGroup label="Estado del animal" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          </View>
        </>
      ) : null}

      <SectionTitle icon="images-outline" title="FOTOS" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.photoButton} activeOpacity={0.84} onPress={pickPhotos}>
          <Ionicons name="camera" size={22} color={Colors.primary} />
          <Text style={styles.photoButtonText}>Agregar fotos ({photos.length}/5)</Text>
        </TouchableOpacity>
        {errors.fotos?.message ? <Text style={styles.inlineError}>{errors.fotos.message}</Text> : null}

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={photo} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              {index === 0 ? <Text style={styles.coverBadge}>Portada</Text> : null}
              <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(photo)}>
                <Ionicons name="close" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        activeOpacity={0.86}
        disabled={submitting}
        onPress={handleSubmit((data) => onSubmit(data, status))}
      >
        {submitting ? (
          <LoadingIndicator color={Colors.white} size="small" />
        ) : (
          <View style={styles.submitButtonContent}>
            <Ionicons name="paw" size={18} color={Colors.white} />
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          </View>
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
    borderRadius: 16,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  fieldBlock: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionPill: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionPillActive: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  optionTextActive: {
    color: Colors.white,
  },
  ageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ageField: {
    flex: 1,
  },
  inlineError: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  booleanRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
  booleanText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  photoButton: {
    alignItems: 'center',
    borderColor: Colors.neutralMid,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.4,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  photoButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoItem: {
    borderRadius: 14,
    height: 112,
    overflow: 'hidden',
    width: 112,
  },
  photoImage: {
    height: '100%',
    width: '100%',
  },
  coverBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    position: 'absolute',
    top: Spacing.xs,
  },
  removePhotoButton: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.xs,
    top: Spacing.xs,
    width: 24,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: Spacing.lg,
  },
  submitButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
