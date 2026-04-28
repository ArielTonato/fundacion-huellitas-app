import storage from '@react-native-firebase/storage';

export async function uploadImage(
  storagePath: string,
  localUri: string
): Promise<string> {
  const reference = storage().ref(storagePath);
  
  // En React Native Firebase se usa putFile para rutas locales
  await reference.putFile(localUri);
  
  const downloadUrl = await reference.getDownloadURL();
  return downloadUrl;
}

export async function deleteImage(storagePath: string): Promise<void> {
  const reference = storage().ref(storagePath);
  await reference.delete();
}

export async function uploadMultipleImages(
  basePath: string,
  localUris: string[]
): Promise<string[]> {
  const uploadPromises = localUris.map((uri, index) => {
    const fileName = `${Date.now()}_${index}`;
    return uploadImage(`${basePath}/${fileName}`, uri);
  });
  return Promise.all(uploadPromises);
}
