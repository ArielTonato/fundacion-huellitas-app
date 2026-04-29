import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FotoAnimalSelectorModalProps {
  visible: boolean;
  photos: string[];
  selectedPhoto: string | null;
  onSelect: (photo: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function FotoAnimalSelectorModal({
  visible,
  photos,
  selectedPhoto,
  onSelect,
  onContinue,
  onCancel,
}: FotoAnimalSelectorModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={photos}
          extraData={selectedPhoto}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Selecciona una foto de la mascota</Text>
              <Text style={styles.subtitle}>Elige la mejor imagen para generar tu visualización personalizada.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const selected = item === selectedPhoto;

            return (
              <TouchableOpacity
                style={[styles.photoButton, selected ? styles.photoButtonSelected : null]}
                activeOpacity={0.86}
                onPress={() => onSelect(item)}
              >
                <Image source={{ uri: item }} style={styles.photo} />
                {selected ? (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={15} color={Colors.white} />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.bottomPanel}>
          <TouchableOpacity
            style={[styles.primaryButton, !selectedPhoto ? styles.disabledButton : null]}
            activeOpacity={0.86}
            disabled={!selectedPhoto}
            onPress={onContinue}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={onCancel}>
            <Ionicons name="close" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  content: {
    paddingBottom: 200,
    paddingHorizontal: Spacing.xl,
    paddingTop: 10,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '600',
    lineHeight: 28,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 28,
    marginTop: Spacing.md,
  },
  gridRow: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  photoButton: {
    backgroundColor: Colors.neutralLight,
    borderColor: 'transparent',
    borderWidth: 4,
    borderRadius: 14,
    flex: 1,
    height: 182,
    overflow: 'hidden',
  },
  photoButtonSelected: {
    borderColor: Colors.primary,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
  },
  bottomPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    gap: Spacing.lg,
    left: 0,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    position: 'absolute',
    right: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 8,
    minHeight: 64,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 8,
    minHeight: 64,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
