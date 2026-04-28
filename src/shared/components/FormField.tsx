import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

interface FormFieldProps<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues>
  extends Omit<TextInputProps, 'onChange'> {
  control: Control<TFieldValues, any, TTransformedValues>;
  name: Path<TFieldValues>;
  label: string;
  errorMessage?: string;
}

export function FormField<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues>({
  control,
  name,
  label,
  errorMessage,
  ...inputProps
}: FormFieldProps<TFieldValues, TTransformedValues>): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errorMessage ? styles.inputError : undefined]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={typeof value === 'string' ? value : String(value ?? '')}
            placeholderTextColor={Colors.textSecondary}
            {...inputProps}
          />
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
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
