import { Ionicons } from '@expo/vector-icons';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ContadorGeneraciones } from './ContadorGeneraciones';

interface PreviewGeneracionSheetProps {
  visible: boolean;
  animalPhoto: string | null;
  userPhoto: string | null;
  remaining: number;
  loading: boolean;
  errorMessage: string | null;
  onGenerate: () => void;
  onChangePhotos: () => void;
  onCancel: () => void;
}

export function PreviewGeneracionSheet({
  visible,
  animalPhoto,
  userPhoto,
  remaining,
  loading,
  errorMessage,
  onGenerate,
  onChangePhotos,
  onCancel,
}: PreviewGeneracionSheetProps): React.JSX.Element {
  const disabled = loading || remaining <= 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>¡Casi listo!</Text>

        <View style={styles.previewRow}>
          <View style={styles.avatarWrap}>
            {animalPhoto ? <Image source={{ uri: animalPhoto }} style={styles.avatar} /> : null}
            <View style={[styles.miniBadge, styles.petBadge]}>
              <Ionicons name="paw" size={13} color={Colors.white} />
            </View>
          </View>
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </View>
          <View style={styles.avatarWrap}>
            {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.avatar} /> : null}
            <View style={[styles.miniBadge, styles.userBadge]}>
              <Ionicons name="person" size={13} color={Colors.white} />
            </View>
          </View>
        </View>

        <ContadorGeneraciones remaining={remaining} />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.generateButton, disabled ? styles.disabledButton : null]}
          activeOpacity={0.86}
          disabled={disabled}
          onPress={onGenerate}
        >
          {loading ? (
            <LoadingIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={22} color={Colors.white} />
              <Text style={styles.generateButtonText}>Generar imagen</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity disabled={loading} style={styles.changeButton} onPress={onChangePhotos}>
          <Ionicons name="images-outline" size={18} color={Colors.primary} />
          <Text style={styles.changeButtonText}>Cambiar fotos</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 31, 46, 0.24)',
    flex: 1,
  },
  sheet: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  handle: {
    backgroundColor: Colors.neutralMid,
    borderRadius: 999,
    height: 6,
    marginBottom: Spacing.xxxl,
    opacity: 0.25,
    width: 72,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginBottom: Spacing.xxxl,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderColor: Colors.white,
    borderRadius: 999,
    borderWidth: 6,
    elevation: 4,
    height: 96,
    justifyContent: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: 96,
  },
  avatar: {
    borderRadius: 999,
    height: '100%',
    width: '100%',
  },
  miniBadge: {
    alignItems: 'center',
    borderColor: Colors.white,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 26,
  },
  petBadge: {
    backgroundColor: Colors.secondary,
  },
  userBadge: {
    backgroundColor: Colors.accent,
  },
  plusCircle: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 999,
    borderWidth: 3,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 28,
    elevation: 8,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.xxxl,
    minHeight: 68,
    shadowColor: Colors.accent,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.55,
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  changeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  changeButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
