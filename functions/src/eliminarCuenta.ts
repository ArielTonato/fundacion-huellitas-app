import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

export const eliminarCuenta = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para eliminar tu cuenta.");
  }

  const uid = request.auth.uid;
  const db = getFirestore();

  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Usuario no encontrado.");
  }

  const userData = userDoc.data()!;

  if (userData.role !== "adoptante") {
    throw new HttpsError("permission-denied", "Solo los adoptantes pueden eliminar su cuenta desde la aplicación.");
  }

  const [solicitudesSnap, generacionesSnap] = await Promise.all([
    db.collection("solicitudes").where("adoptanteId", "==", uid).get(),
    db.collection("generaciones").where("uid", "==", uid).get(),
  ]);

  const batch = db.batch();

  solicitudesSnap.docs.forEach((doc) => batch.delete(doc.ref));
  generacionesSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(userRef);

  if (userData.telefono) {
    const normalizedPhone = String(userData.telefono).replace(/\D/g, "");
    if (normalizedPhone) {
      batch.delete(db.collection("userPhones").doc(normalizedPhone));
    }
  }

  await batch.commit();

  try {
    const bucket = getStorage().bucket();
    await bucket.deleteFiles({ prefix: `perfil/${uid}/` });
  } catch {
    // Storage cleanup is best-effort; Auth deletion still proceeds
  }

  await getAuth().deleteUser(uid);

  return { success: true };
});
