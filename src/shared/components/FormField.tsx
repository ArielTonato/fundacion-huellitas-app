import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useState } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';

interface FormFieldProps<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues>
  extends Omit<TextInputProps, 'onChange' | 'onChangeText'> {
  control: Control<TFieldValues, any, TTransformedValues>;
  name: Path<TFieldValues>;
  label: string;
  errorMessage?: string;
  formatValue?: (value: string) => string;
  showSecureTextToggle?: boolean;
}

export function FormField<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues>({
  control,
  name,
  label,
  errorMessage,
  formatValue,
  secureTextEntry,
  showSecureTextToggle = false,
  ...inputProps
}: FormFieldProps<TFieldValues, TTransformedValues>): React.JSX.Element {
  const [secureTextVisible, setSecureTextVisible] = useState<boolean>(false);
  const shouldShowSecureTextToggle = Boolean(secureTextEntry && showSecureTextToggle);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                shouldShowSecureTextToggle ? styles.inputWithSecureTextToggle : undefined,
                errorMessage ? styles.inputError : undefined,
              ]}
              onBlur={onBlur}
              onChangeText={(text) => onChange(formatValue ? formatValue(text) : text)}
              secureTextEntry={Boolean(secureTextEntry && !secureTextVisible)}
              value={typeof value === 'string' ? value : String(value ?? '')}
              placeholderTextColor={Colors.textSecondary}
              {...inputProps}
            />
            {shouldShowSecureTextToggle ? (
              <TouchableOpacity
                style={styles.secureTextToggle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={secureTextVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onPress={() => setSecureTextVisible((currentValue) => !currentValue)}
              >
                <Ionicons
                  name={secureTextVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutralMid,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputWithSecureTextToggle: {
    paddingRight: 52,
  },
  inputError: {
    borderColor: Colors.error,
  },
  secureTextToggle: {
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.md,
    top: 0,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
