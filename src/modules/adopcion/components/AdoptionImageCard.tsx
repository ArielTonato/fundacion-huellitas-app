import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';

interface AdoptionImageCardProps {
  label: string;
  uri?: string;
  wide?: boolean;
  errorMessage?: string;
  onPress: () => void;
}

export function AdoptionImageCard({
  label,
  uri,
  wide = false,
  errorMessage,
  onPress,
}: AdoptionImageCardProps): React.JSX.Element {
  return (
    <View style={wide ? styles.wideContainer : styles.container}>
      <TouchableOpacity
        style={[wide ? styles.wideCard : styles.card, errorMessage ? styles.cardError : null]}
        activeOpacity={0.84}
        onPress={onPress}
      >
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
        <View style={[styles.overlay, uri ? styles.overlaySelected : null]}>
          <Ionicons name={uri ? 'checkmark-circle' : 'camera'} size={28} color={uri ? Colors.secondary : Colors.textSecondary} />
          <Text style={[styles.label, uri ? styles.labelSelected : null]}>{label}</Text>
        </View>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wideContainer: {
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.neutralMid,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.4,
    height: 138,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wideCard: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 16,
    height: 165,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardError: {
    borderColor: Colors.error,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    gap: Spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  overlaySelected: {
    backgroundColor: Colors.white,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.textPrimary,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
