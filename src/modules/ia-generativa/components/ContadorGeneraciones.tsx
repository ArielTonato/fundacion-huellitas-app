import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

interface ContadorGeneracionesProps {
  remaining: number;
}

export function ContadorGeneraciones({ remaining }: ContadorGeneracionesProps): React.JSX.Element {
  const message = remaining > 0
    ? `Te ${remaining === 1 ? 'queda' : 'quedan'} ${remaining} ${remaining === 1 ? 'generación' : 'generaciones'} hoy`
    : 'Vuelve mañana';
  const color = remaining >= 3 ? Colors.secondary : remaining === 2 ? Colors.accent : Colors.error;

  return (
    <View style={styles.container}>
      <Ionicons name="flash" size={16} color={color} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: `${Colors.accent}16`,
    borderRadius: 999,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
