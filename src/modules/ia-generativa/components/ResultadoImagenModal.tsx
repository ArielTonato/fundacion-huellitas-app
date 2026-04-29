import { Ionicons } from '@expo/vector-icons';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ResultadoImagenModalProps {
  visible: boolean;
  imageBase64: string | null;
  mimeType: string;
  animalName: string;
  actionLoading: 'download' | 'share' | null;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function ResultadoImagenModal({
  visible,
  imageBase64,
  mimeType,
  animalName,
  actionLoading,
  onClose,
  onDownload,
  onShare,
}: ResultadoImagenModalProps): React.JSX.Element {
  const imageUri = imageBase64 ? `data:${mimeType};base64,${imageBase64}` : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={onClose}>
            <Ionicons name="close" size={30} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Fundación Huellitas AI</Text>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={onShare}>
            <Ionicons name="share-social-outline" size={27} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.imageCard}>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} /> : null}
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>LISTO ✨</Text>
            </View>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>IA PREVIEW</Text>
            </View>
          </View>

          <View style={styles.heartsRow}>
            <Ionicons name="heart" size={32} color={Colors.secondary} />
            <Ionicons name="heart" size={32} color={Colors.secondary} />
            <Ionicons name="heart" size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>¡Imagen Generada!</Text>
          <Text style={styles.subtitle}>Tu futuro hogar con {animalName} se verá así de increíble.</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.86}
              disabled={Boolean(actionLoading)}
              onPress={onDownload}
            >
              {actionLoading === 'download' ? (
                <LoadingIndicator color={Colors.white} size="small" />
              ) : (
                <Ionicons name="download-outline" size={32} color={Colors.white} />
              )}
              <Text style={styles.actionButtonText}>Descargar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.86}
              disabled={Boolean(actionLoading)}
              onPress={onShare}
            >
              {actionLoading === 'share' ? (
                <LoadingIndicator color={Colors.white} size="small" />
              ) : (
                <Ionicons name="share-social-outline" size={32} color={Colors.white} />
              )}
              <Text style={styles.actionButtonText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: Spacing.lg,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  topBarTitle: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  imageCard: {
    backgroundColor: Colors.neutralLight,
    borderColor: Colors.white,
    borderRadius: 34,
    borderWidth: 8,
    elevation: 12,
    height: 520,
    marginTop: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: '100%',
  },
  resultImage: {
    height: '100%',
    width: '100%',
  },
  readyBadge: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.white,
    borderRadius: 10,
    borderWidth: 3,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    right: 24,
    top: 0,
    transform: [{ rotate: '10deg' }],
  },
  readyBadgeText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  previewBadge: {
    backgroundColor: 'rgba(15, 31, 46, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    right: 22,
  },
  previewBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xxxl,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 28,
    marginTop: Spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xxxl,
    width: '100%',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    elevation: 8,
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 108,
    shadowColor: Colors.textPrimary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
