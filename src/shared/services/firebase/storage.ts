import storage from '@react-native-firebase/storage';

export async function uploadImage(
  storagePath: string,
  localUri: string
): Promise<string> {
  const ref = storage().ref(storagePath);
  await ref.putFile(localUri);
  const downloadUrl = await ref.getDownloadURL();
  return downloadUrl;
}

export async function deleteImage(storagePath: string): Promise<void> {
  await storage().ref(storagePath).delete();
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
