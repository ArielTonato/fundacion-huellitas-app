import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const VARIANT_COLORS: Record<BadgeVariant, { background: string; text: string }> = {
  success: { background: Colors.secondary, text: Colors.white },
  warning: { background: Colors.accent, text: Colors.white },
  error: { background: Colors.error, text: Colors.white },
  neutral: { background: Colors.neutralLight, text: Colors.textSecondary },
};

export function StatusBadge({ label, variant }: StatusBadgeProps): React.JSX.Element {
  const colors = VARIANT_COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
