import type { Animal } from '@src/shared/types/models';
import { useAuth } from '@src/shared/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useGeneracionesRestantes } from '../hooks/useGeneracionesRestantes';
import {
  downloadGeneratedImageToGallery,
  generarImagenAdopcion,
  imageUriToBase64Payload,
  shareGeneratedImage,
} from '../services/generarImagenService';
import { FotoAnimalSelectorModal } from './FotoAnimalSelectorModal';
import { FotoUsuarioPickerSheet } from './FotoUsuarioPickerSheet';
import { PreviewGeneracionSheet } from './PreviewGeneracionSheet';
import { ResultadoImagenModal } from './ResultadoImagenModal';

type FlowStep = 'selectAnimal' | 'pickUser' | 'preview' | 'result';
type ActionLoading = 'download' | 'share' | null;

interface GeneratedImageResult {
  imageBase64: string;
  mimeType: string;
}

interface GenerativeAIFlowProps {
  visible: boolean;
  animal: Animal;
  onClose: () => void;
}

export function GenerativeAIFlow({ visible, animal, onClose }: GenerativeAIFlowProps): React.JSX.Element {
  const { authUser } = useAuth();
  const { remaining, error: counterError } = useGeneracionesRestantes(authUser?.uid);
  const [step, setStep] = useState<FlowStep>('selectAnimal');
  const [selectedAnimalPhoto, setSelectedAnimalPhoto] = useState<string | null>(animal.fotos[0] ?? null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageResult | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);

  useEffect(() => {
    if (visible) {
      setStep('selectAnimal');
      setSelectedAnimalPhoto(animal.fotos[0] ?? null);
      setUserPhoto(null);
      setGeneratedImage(null);
      setGenerating(false);
      setErrorMessage(null);
      setActionLoading(null);
    }
  }, [animal.fotos, visible]);

  useEffect(() => {
    if (counterError) {
      setErrorMessage(counterError.message);
    }
  }, [counterError]);

  const closeFlow = (): void => {
    if (generating || actionLoading) {
      return;
    }

    onClose();
  };

  const pickUserImage = async (source: 'camera' | 'gallery'): Promise<void> => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a tus fotos para continuar.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
      })
      : await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
      });

    if (!result.canceled && result.assets[0]?.uri) {
      setUserPhoto(result.assets[0].uri);
      setStep('preview');
      setErrorMessage(null);
    }
  };

  const generateImage = async (): Promise<void> => {
    setErrorMessage(null);

    if (!authUser) {
      setErrorMessage('Debes iniciar sesión para generar una imagen.');
      return;
    }

    if (!selectedAnimalPhoto || !userPhoto) {
      setErrorMessage('Selecciona la foto de la mascota y tu foto para continuar.');
      return;
    }

    if (remaining <= 0) {
      setErrorMessage('Ya usaste tus 3 generaciones de hoy. Vuelve mañana.');
      return;
    }

    setGenerating(true);
    try {
      const [animalPayload, userPayload] = await Promise.all([
        imageUriToBase64Payload(selectedAnimalPhoto),
        imageUriToBase64Payload(userPhoto),
      ]);
      const result = await generarImagenAdopcion({
        animalImageBase64: animalPayload.base64,
        animalMimeType: animalPayload.mimeType,
        userImageBase64: userPayload.base64,
        userMimeType: userPayload.mimeType,
        animalName: animal.nombre,
      });

      setGeneratedImage({
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
      });
      setStep('result');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar la imagen.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async (): Promise<void> => {
    if (!generatedImage) {
      return;
    }

    setActionLoading('download');
    try {
      await downloadGeneratedImageToGallery(generatedImage.imageBase64, generatedImage.mimeType);
      Alert.alert('Imagen guardada', 'La imagen generada se guardó en tu galería.');
    } catch (error) {
      Alert.alert('No se pudo descargar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const shareImage = async (): Promise<void> => {
    if (!generatedImage) {
      return;
    }

    setActionLoading('share');
    try {
      await shareGeneratedImage(generatedImage.imageBase64, generatedImage.mimeType);
    } catch (error) {
      Alert.alert('No se pudo compartir', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <FotoAnimalSelectorModal
        visible={visible && step === 'selectAnimal'}
        photos={animal.fotos}
        selectedPhoto={selectedAnimalPhoto}
        onSelect={setSelectedAnimalPhoto}
        onContinue={() => setStep('pickUser')}
        onCancel={closeFlow}
      />
      <FotoUsuarioPickerSheet
        visible={visible && step === 'pickUser'}
        onCamera={() => void pickUserImage('camera')}
        onGallery={() => void pickUserImage('gallery')}
        onCancel={() => setStep('selectAnimal')}
      />
      <PreviewGeneracionSheet
        visible={visible && step === 'preview'}
        animalPhoto={selectedAnimalPhoto}
        userPhoto={userPhoto}
        remaining={remaining}
        loading={generating}
        errorMessage={errorMessage}
        onGenerate={() => void generateImage()}
        onChangePhotos={() => {
          setUserPhoto(null);
          setStep('selectAnimal');
        }}
        onCancel={closeFlow}
      />
      <ResultadoImagenModal
        visible={visible && step === 'result'}
        imageBase64={generatedImage?.imageBase64 ?? null}
        mimeType={generatedImage?.mimeType ?? 'image/png'}
        animalName={animal.nombre}
        actionLoading={actionLoading}
        onClose={closeFlow}
        onDownload={() => void downloadImage()}
        onShare={() => void shareImage()}
      />
    </>
  );
}
