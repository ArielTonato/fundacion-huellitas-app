import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FotoUsuarioPickerSheetProps {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onCancel: () => void;
}

export function FotoUsuarioPickerSheet({
  visible,
  onCamera,
  onGallery,
  onCancel,
}: FotoUsuarioPickerSheetProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Ahora sube tu foto</Text>
        <Text style={styles.subtitle}>Usaremos esta imagen junto a la foto de la mascota para crear la vista previa.</Text>

        <TouchableOpacity style={styles.optionButton} activeOpacity={0.86} onPress={onCamera}>
          <View style={styles.iconBox}>
            <Ionicons name="camera" size={22} color={Colors.white} />
          </View>
          <Text style={styles.optionText}>Tomar foto</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} activeOpacity={0.86} onPress={onGallery}>
          <View style={styles.iconBox}>
            <Ionicons name="image" size={22} color={Colors.white} />
          </View>
          <Text style={styles.optionText}>Elegir de galería</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 31, 46, 0.38)',
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 6,
    marginBottom: Spacing.xl,
    width: 72,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 18,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
