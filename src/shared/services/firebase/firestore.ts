import firestoreModule, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

type DocumentData = FirebaseFirestoreTypes.DocumentData;
type Query = FirebaseFirestoreTypes.Query<DocumentData>;

export function getFirestore(): FirebaseFirestoreTypes.Module {
  return firestoreModule();
}

export async function getDocument<T>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const doc = await firestoreModule().collection(collectionPath).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() } as T;
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  data: T
): Promise<string> {
  const ref = await firestoreModule().collection(collectionPath).add(data);
  return ref.id;
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  docId: string,
  data: T,
  options?: { merge: boolean }
): Promise<void> {
  await firestoreModule()
    .collection(collectionPath)
    .doc(docId)
    .set(data, options ?? {});
}

export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  await firestoreModule().collection(collectionPath).doc(docId).update(data);
}

export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  await firestoreModule().collection(collectionPath).doc(docId).delete();
}

export async function queryDocuments<T>(
  collectionPath: string,
  buildQuery?: (ref: Query) => Query
): Promise<T[]> {
  let ref: Query = firestoreModule().collection(collectionPath);
  if (buildQuery) {
    ref = buildQuery(ref);
  }
  const snapshot = await ref.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

export function onSnapshotQuery<T>(
  collectionPath: string,
  buildQuery: ((ref: Query) => Query) | undefined,
  onData: (data: T[]) => void,
  onError: (error: Error) => void
): () => void {
  let ref: Query = firestoreModule().collection(collectionPath);
  if (buildQuery) {
    ref = buildQuery(ref);
  }
  return ref.onSnapshot(
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      onData(data);
    },
    (error) => onError(error)
  );
}

export { firestoreModule as firestore };
