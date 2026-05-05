import { Ionicons } from '@expo/vector-icons';
import { useReporte } from '@src/modules/mascotas/hooks/useReporte';
import { marcarComoResuelto } from '@src/modules/mascotas/services/reportesService';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface ReporteDetailProps {
  reporteId: string | undefined;
  showResolveAction: boolean;
  listRoute: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 330;

function getWhatsappUrl(phone: string): string {
  const normalizedPhone = phone.replace(/\D/g, '').replace(/^0/, '');
  return `https://wa.me/593${normalizedPhone}`;
}

export function ReporteDetail({
  reporteId,
  showResolveAction,
  listRoute,
}: ReporteDetailProps): React.JSX.Element {
  const router = useRouter();
  const { authUser } = useAuth();
  const { reporte, loading, error } = useReporte(reporteId);
  const [resolving, setResolving] = useState<boolean>(false);
  const [galleryVisible, setGalleryVisible] = useState<boolean>(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState<number>(0);

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!reporte) {
    return (
      <EmptyState
        title="Reporte no encontrado"
        message={error?.message ?? 'No se pudo cargar la informacion del reporte.'}
      />
    );
  }

  const canResolve = showResolveAction && reporte.reportadoPor === authUser?.uid && reporte.estado === 'activo';

  const contactByWhatsapp = async (): Promise<void> => {
    await Linking.openURL(getWhatsappUrl(reporte.telefonoContacto));
  };

  const openGallery = (index: number): void => {
    setGalleryInitialIndex(index);
    setGalleryVisible(true);
  };

  const resolveReport = (): void => {
    Alert.alert(
      'Mascota encontrada',
      'El reporte pasara a resuelto y dejara de aparecer en la lista publica.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setResolving(true);
              await marcarComoResuelto(reporte.id);
              Alert.alert('Reporte resuelto', 'Gracias por actualizar el estado.');
              router.replace(listRoute as never);
            } catch (resolveError) {
              const message = resolveError instanceof Error ? resolveError.message : 'No se pudo resolver el reporte.';
              Alert.alert('Error', message);
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <Modal visible={galleryVisible} transparent animationType="fade" onRequestClose={() => setGalleryVisible(false)}>
        <View style={styles.galleryBackdrop}>
          <TouchableOpacity style={styles.galleryCloseButton} activeOpacity={0.86} onPress={() => setGalleryVisible(false)}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <FlatList
            key={galleryInitialIndex}
            data={reporte.fotos}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            initialScrollIndex={galleryInitialIndex}
            getItemLayout={(_, index) => ({
              index,
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
            })}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.galleryImageWrap}>
                <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <FlatList
            data={reporte.fotos}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => openGallery(index)}>
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              </Pressable>
            )}
          />
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => router.replace(listRoute as never)}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.name}>{reporte.nombre}</Text>
              <Text style={styles.species}>{reporte.especie}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Extraviada</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripcion</Text>
            <Text style={styles.description}>{reporte.descripcion}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ultima ubicacion</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: reporte.ultimaUbicacion.latitude,
                longitude: reporte.ultimaUbicacion.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: reporte.ultimaUbicacion.latitude,
                  longitude: reporte.ultimaUbicacion.longitude,
                }}
              />
            </MapView>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={Colors.white} />
              <Text style={styles.locationText}>{reporte.ultimaUbicacion.direccion}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.whatsappButton} activeOpacity={0.86} onPress={contactByWhatsapp}>
          <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
          <Text style={styles.bottomButtonText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
        {canResolve ? (
          <TouchableOpacity
            style={[styles.resolveButton, resolving ? styles.disabledButton : null]}
            activeOpacity={0.86}
            disabled={resolving}
            onPress={resolveReport}
          >
            {resolving ? (
              <LoadingIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="paw" size={18} color={Colors.white} />
                <Text style={styles.bottomButtonText}>Mascota encontrada</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
  },
  heroImage: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
  },
  galleryBackdrop: {
    backgroundColor: 'rgba(15, 31, 46, 0.72)',
    flex: 1,
    justifyContent: 'center',
  },
  galleryCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.lg,
    top: 52,
    width: 44,
    zIndex: 2,
  },
  galleryImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
  },
  galleryImage: {
    height: '82%',
    width: SCREEN_WIDTH,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    left: Spacing.lg,
    position: 'absolute',
    top: 52,
    width: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  titleGroup: {
    flex: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  species: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  statusBadge: {
    backgroundColor: Colors.error,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  map: {
    borderRadius: 16,
    height: 170,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    width: '100%',
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  locationText: {
    color: Colors.white,
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.neutralLight,
    borderTopWidth: 1,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  whatsappButton: {
    alignItems: 'center',
    backgroundColor: Colors.whatsapp,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  resolveButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: Spacing.lg,
  },
  bottomButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
