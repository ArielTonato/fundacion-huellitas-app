import firebaseFirestore, {
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

type DocumentData = FirebaseFirestoreTypes.DocumentData;
type Query = FirebaseFirestoreTypes.Query<DocumentData>;

export const firestore = () => firebaseFirestore();
export const getFirestore = firestore;

export async function getDocument<T>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const docRef = firebaseFirestore().collection(collectionPath).doc(docId);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  data: T
): Promise<string> {
  const colRef = firebaseFirestore().collection(collectionPath);
  const docRef = await colRef.add(data);
  return docRef.id;
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  docId: string,
  data: T,
  options?: { merge: boolean }
): Promise<void> {
  const docRef = firebaseFirestore().collection(collectionPath).doc(docId);
  await docRef.set(data, options ?? { merge: false });
}

export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const docRef = firebaseFirestore().collection(collectionPath).doc(docId);
  await docRef.update(data);
}

export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const docRef = firebaseFirestore().collection(collectionPath).doc(docId);
  await docRef.delete();
}

export async function queryDocuments<T>(
  collectionPath: string,
  buildQuery?: (ref: Query) => Query
): Promise<T[]> {
  let q: Query = firebaseFirestore().collection(collectionPath);
  
  if (buildQuery) {
    q = buildQuery(q);
  }
  
  const querySnapshot = await q.get();
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

export function onSnapshotQuery<T>(
  collectionPath: string,
  buildQuery: ((ref: Query) => Query) | undefined,
  onData: (data: T[]) => void,
  onError: (error: Error) => void
): () => void {
  let q: Query = firebaseFirestore().collection(collectionPath);
  
  if (buildQuery) {
    q = buildQuery(q);
  }
  
  return q.onSnapshot(
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      onData(data);
    },
    (error) => onError(error)
  );
}
