import {
  getStorage,
  ref,
  uploadFile,
  getDownloadURL,
  deleteObject,
} from '@react-native-firebase/storage';

export async function uploadImage(
  storagePath: string,
  localUri: string
): Promise<string> {
  const storage = getStorage();
  const imageRef = ref(storage, storagePath);
  await uploadFile(imageRef, localUri);
  const downloadUrl = await getDownloadURL(imageRef);
  return downloadUrl;
}

export async function deleteImage(storagePath: string): Promise<void> {
  const storage = getStorage();
  const imageRef = ref(storage, storagePath);
  await deleteObject(imageRef);
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
