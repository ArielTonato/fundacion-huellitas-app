import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Query,
} from '@react-native-firebase/firestore';

export const firestore = getFirestore;
export { getFirestore };

export async function getDocument<T>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const db = getFirestore();
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  data: T
): Promise<string> {
  const db = getFirestore();
  const colRef = collection(db, collectionPath);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionPath: string,
  docId: string,
  data: T,
  options?: { merge: boolean }
): Promise<void> {
  const db = getFirestore();
  const docRef = doc(db, collectionPath, docId);
  await setDoc(docRef, data, options ?? { merge: false });
}

export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getFirestore();
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, data);
}

export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const db = getFirestore();
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

export async function queryDocuments<T>(
  collectionPath: string,
  buildQuery?: (ref: Query) => Query
): Promise<T[]> {
  const db = getFirestore();
  let q: Query = collection(db, collectionPath);
  
  if (buildQuery) {
    q = buildQuery(q);
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

export function onSnapshotQuery<T>(
  collectionPath: string,
  buildQuery: ((ref: Query) => Query) | undefined,
  onData: (data: T[]) => void,
  onError: (error: Error) => void
): () => void {
  const db = getFirestore();
  let q: Query = collection(db, collectionPath);
  
  if (buildQuery) {
    q = buildQuery(q);
  }
  
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      onData(data);
    },
    (error) => onError(error)
  );
}
