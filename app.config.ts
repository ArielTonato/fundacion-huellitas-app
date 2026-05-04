import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Fundacion Huellitas',
  slug: 'fundacion-huellitas-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/huellitas/logo.png',
  scheme: 'fundacionhuellitasapp',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  android: {
    package: 'com.fundacionhuellitas.app',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#F4E6D2',
      foregroundImage: './assets/huellitas/logo.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/huellitas/logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F4E6D2',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/messaging',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Permitir a Huellitas acceder a tu ubicacion para mostrar reportes cercanos.',
        locationWhenInUsePermission:
          'Permitir a Huellitas acceder a tu ubicacion para mostrar reportes cercanos.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'Permitir a Huellitas acceder a tu camara para tomar fotos.',
        photosPermission:
          'Permitir a Huellitas acceder a tu galeria para seleccionar fotos.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission:
          'Permitir a Huellitas guardar imagenes generadas en tu galeria.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    cloudFunctionsUrl: process.env.CLOUD_FUNCTIONS_URL,
  },
});
