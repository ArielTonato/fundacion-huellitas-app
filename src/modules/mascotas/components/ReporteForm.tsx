import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { reporteSchema, type ReporteFormData } from '../schemas/reporteSchema';
import { LocationPicker } from './LocationPicker';

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface ReporteFormProps {
  submitting: boolean;
  onSubmit: (data: ReporteFormData) => Promise<void>;
}

const MAX_PHOTOS = 3;
const DEFAULT_LOCATION = {
  latitude: 0,
  longitude: 0,
  direccion: '',
};
const DEFAULT_VALUES: ReporteFormData = {
  nombre: '',
  especie: 'perro',
  sexo: 'hembra',
  descripcion: '',
  fotos: [],
  ultimaUbicacion: DEFAULT_LOCATION,
  telefonoContacto: '',
};
const SPECIES_OPTIONS: SelectOption<'perro' | 'gato'>[] = [
  { label: 'Perro', value: 'perro' },
  { label: 'Gato', value: 'gato' },
];
const SEX_OPTIONS: SelectOption<'macho' | 'hembra'>[] = [
  { label: 'Macho', value: 'macho' },
  { label: 'Hembra', value: 'hembra' },
];

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

export function ReporteForm({ submitting, onSubmit }: ReporteFormProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReporteFormData>({
    resolver: yupResolver(reporteSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const photos = watch('fotos');

  const pickPhotos = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galeria para subir fotos.');
      return;
    }

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limite alcanzado', 'Puedes subir maximo 3 fotos.');
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
      setValue('fotos', [...photos, ...selectedUris].slice(0, MAX_PHOTOS), { shouldValidate: true });
    }
  };

  const removePhoto = (photoUri: string): void => {
    setValue('fotos', photos.filter((photo) => photo !== photoUri), { shouldValidate: true });
  };

  const ubicacionError =
    errors.ultimaUbicacion?.direccion?.message ??
    errors.ultimaUbicacion?.latitude?.message ??
    errors.ultimaUbicacion?.longitude?.message;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle icon="paw" title="DATOS DE LA MASCOTA" />
      <View style={styles.card}>
        <FormField control={control} name="nombre" label="Nombre" placeholder="Ej. Luna" errorMessage={errors.nombre?.message} />
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
        <FormField
          control={control}
          name="descripcion"
          label="Descripcion"
          placeholder="Describe señas particulares, collar, comportamiento..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          errorMessage={errors.descripcion?.message}
        />
        <FormField
          control={control}
          name="telefonoContacto"
          label="Telefono de contacto"
          placeholder="0999999999"
          keyboardType="phone-pad"
          maxLength={10}
          errorMessage={errors.telefonoContacto?.message}
        />
      </View>

      <SectionTitle icon="images-outline" title="FOTOS" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.photoButton} activeOpacity={0.84} onPress={pickPhotos}>
          <Ionicons name="camera" size={22} color={Colors.primary} />
          <Text style={styles.photoButtonText}>Agregar fotos ({photos.length}/3)</Text>
        </TouchableOpacity>
        {errors.fotos?.message ? <Text style={styles.inlineError}>{errors.fotos.message}</Text> : null}

        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(photo)}>
                <Ionicons name="close" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <SectionTitle icon="location-outline" title="ULTIMA UBICACION" />
      <View style={styles.card}>
        <Text style={styles.helpText}>
          Buscá la dirección o arrastrá el mapa para colocar el pin exactamente sobre el lugar.
        </Text>
        <Controller
          control={control}
          name="ultimaUbicacion"
          render={({ field: { value, onChange } }) => (
            <LocationPicker
              value={value}
              onChange={(next) =>
                onChange({
                  latitude: next.latitude,
                  longitude: next.longitude,
                  direccion: next.direccion,
                  placeId: next.placeId,
                })
              }
              error={ubicacionError}
            />
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        activeOpacity={0.86}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      >
        {submitting ? (
          <LoadingIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="megaphone-outline" size={20} color={Colors.white} />
            <Text style={styles.submitButtonText}>Publicar reporte</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
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
  inlineError: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  helpText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: Spacing.lg,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
