import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

interface CrearPersonalRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

interface EditarPersonalRequest {
  uid: string;
  nombre: string;
  email: string;
  telefono?: string;
  fotoPerfilUrl?: string;
}

interface PersonalStatusRequest {
  uid: string;
}

interface UserPhoneIndex {
  uid: string;
  telefono: string;
  creadoEn: FirebaseFirestore.FieldValue;
}

const PHONE_PATTERN = /^[0-9]{10}$/;

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

function assertString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", message);
  }

  return value.trim();
}

function assertCreatePersonalData(data: unknown): CrearPersonalRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Los datos del personal son requeridos.");
  }

  const requestData = data as Partial<CrearPersonalRequest>;
  const nombre = assertString(requestData.nombre, "El nombre del personal es requerido.");
  const email = assertString(requestData.email, "El correo del personal es requerido.").toLowerCase();
  const password = assertString(requestData.password, "La contraseÃ±a temporal es requerida.");
  const telefono = typeof requestData.telefono === "string" && requestData.telefono.trim().length > 0 ?
    normalizePhoneNumber(requestData.telefono) :
    undefined;

  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "La contraseÃ±a debe tener al menos 6 caracteres.");
  }

  if (telefono && !PHONE_PATTERN.test(telefono)) {
    throw new HttpsError("invalid-argument", "Ingrese un telefono valido de 10 digitos.");
  }

  return {
    nombre,
    email,
    password,
    ...(telefono ? { telefono } : {}),
  };
}

function assertStatusData(data: unknown): PersonalStatusRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "El usuario del personal es requerido.");
  }

  return {
    uid: assertString((data as Partial<PersonalStatusRequest>).uid, "El usuario del personal es requerido."),
  };
}

function assertEditPersonalData(data: unknown): EditarPersonalRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Los datos del personal son requeridos.");
  }

  const requestData = data as Partial<EditarPersonalRequest>;
  const telefono = typeof requestData.telefono === "string" && requestData.telefono.trim().length > 0 ?
    normalizePhoneNumber(requestData.telefono) :
    undefined;

  if (telefono && !PHONE_PATTERN.test(telefono)) {
    throw new HttpsError("invalid-argument", "Ingrese un telefono valido de 10 digitos.");
  }

  const fotoPerfilUrl = typeof requestData.fotoPerfilUrl === "string" && requestData.fotoPerfilUrl.trim().length > 0 ?
    requestData.fotoPerfilUrl.trim() :
    undefined;

  return {
    uid: assertString(requestData.uid, "El usuario del personal es requerido."),
    nombre: assertString(requestData.nombre, "El nombre del personal es requerido."),
    email: assertString(requestData.email, "El correo del personal es requerido.").toLowerCase(),
    ...(telefono ? { telefono } : {}),
    ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
  };
}

function buildUserPhoneIndex(phone: string, uid: string): UserPhoneIndex {
  return {
    uid,
    telefono: phone,
    creadoEn: FieldValue.serverTimestamp(),
  };
}

function isAlreadyExistsError(error: unknown): boolean {
  const code = (error as { code?: string | number }).code;
  return code === 6 || code === "already-exists";
}

function getCreateAuthError(error: unknown): HttpsError {
  const code = (error as { code?: string }).code;

  if (code === "auth/email-already-exists") {
    return new HttpsError("already-exists", "Ya existe una cuenta con ese correo electronico.");
  }

  if (code === "auth/invalid-email") {
    return new HttpsError("invalid-argument", "Ingrese un correo electronico valido.");
  }

  if (code === "auth/invalid-password") {
    return new HttpsError("invalid-argument", "La contraseÃ±a debe tener al menos 6 caracteres.");
  }

  return new HttpsError("internal", "No se pudo crear la cuenta del personal.");
}

function getEditAuthError(error: unknown): HttpsError {
  const code = (error as { code?: string }).code;

  if (code === "auth/email-already-exists") {
    return new HttpsError("already-exists", "Ya existe una cuenta con ese correo electronico.");
  }

  if (code === "auth/invalid-email") {
    return new HttpsError("invalid-argument", "Ingrese un correo electronico valido.");
  }

  if (code === "auth/user-not-found") {
    return new HttpsError("not-found", "Usuario de personal no encontrado en Auth.");
  }

  return new HttpsError("internal", "No se pudo editar la cuenta del personal.");
}

async function assertSuperadmin(uid: string): Promise<void> {
  const db = getFirestore();
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "No tienes permisos para gestionar personal.");
  }

  const userData = userDoc.data();
  if (userData?.role !== "superadmin" || userData.activo === false) {
    throw new HttpsError("permission-denied", "Solo un superadmin activo puede gestionar personal.");
  }
}

async function assertPersonalUser(uid: string): Promise<FirebaseFirestore.DocumentReference> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Usuario de personal no encontrado.");
  }

  if (userDoc.data()?.role !== "personal") {
    throw new HttpsError("failed-precondition", "Solo se pueden gestionar cuentas del personal.");
  }

  return userRef;
}

async function assertPhoneAvailable(phone: string | undefined, uid: string): Promise<void> {
  if (!phone) return;

  const phoneDoc = await getFirestore().collection("userPhones").doc(phone).get();
  if (phoneDoc.exists && phoneDoc.data()?.uid !== uid) {
    throw new HttpsError("already-exists", "Este numero de telefono ya esta en uso.");
  }
}

export const crearPersonal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesiÃ³n para crear personal.");
  }

  await assertSuperadmin(request.auth.uid);

  const data = assertCreatePersonalData(request.data);
  const auth = getAuth();
  const db = getFirestore();

  try {
    const userRecord = await auth.createUser({
      disabled: false,
      displayName: data.nombre,
      email: data.email,
      password: data.password,
    });
    const userRef = db.collection("users").doc(userRecord.uid);
    const batch = db.batch();

    batch.set(userRef, {
      uid: userRecord.uid,
      email: data.email,
      nombre: data.nombre,
      role: "personal",
      activo: true,
      creadoEn: FieldValue.serverTimestamp(),
      creadoPor: request.auth.uid,
      ...(data.telefono ? { telefono: data.telefono } : {}),
    });

    if (data.telefono) {
      batch.create(db.collection("userPhones").doc(data.telefono), buildUserPhoneIndex(data.telefono, userRecord.uid));
    }

    try {
      await batch.commit();
    } catch (error) {
      await auth.deleteUser(userRecord.uid);

      if (isAlreadyExistsError(error)) {
        throw new HttpsError("already-exists", "Este numero de telefono ya esta en uso.");
      }

      throw error;
    }

    return { uid: userRecord.uid };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const mappedError = getCreateAuthError(error);
    if (mappedError.code === "internal") {
      logger.error("Staff account creation failed", {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorStack: error instanceof Error ? error.stack : undefined,
        actorUid: request.auth.uid,
      });
    }
    throw mappedError;
  }
});

export const editarPersonal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesiÃƒÂ³n para editar personal.");
  }

  await assertSuperadmin(request.auth.uid);

  const data = assertEditPersonalData(request.data);
  const userRef = await assertPersonalUser(data.uid);
  const db = getFirestore();
  const auth = getAuth();
  const userDoc = await userRef.get();
  const currentPhone = typeof userDoc.data()?.telefono === "string" ?
    normalizePhoneNumber(userDoc.data()?.telefono) :
    undefined;

  await assertPhoneAvailable(data.telefono, data.uid);

  try {
    await auth.updateUser(data.uid, {
      displayName: data.nombre,
      email: data.email,
    });

    const batch = db.batch();
    const updateData: Record<string, unknown> = {
      nombre: data.nombre,
      email: data.email,
      actualizadoEn: FieldValue.serverTimestamp(),
      actualizadoPor: request.auth.uid,
    };

    if (data.telefono) {
      updateData.telefono = data.telefono;
    } else {
      updateData.telefono = FieldValue.delete();
    }

    if (data.fotoPerfilUrl) {
      updateData.fotoPerfilUrl = data.fotoPerfilUrl;
    }

    batch.set(userRef, updateData, { merge: true });

    if (currentPhone && currentPhone !== data.telefono) {
      batch.delete(db.collection("userPhones").doc(currentPhone));
    }

    if (data.telefono && currentPhone !== data.telefono) {
      batch.set(db.collection("userPhones").doc(data.telefono), buildUserPhoneIndex(data.telefono, data.uid));
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const mappedError = getEditAuthError(error);
    if (mappedError.code === "internal") {
      logger.error("Staff account edit failed", {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorStack: error instanceof Error ? error.stack : undefined,
        actorUid: request.auth.uid,
        editedUid: data.uid,
      });
    }
    throw mappedError;
  }
});

export const desactivarPersonal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesiÃ³n para desactivar personal.");
  }

  await assertSuperadmin(request.auth.uid);
  const data = assertStatusData(request.data);
  const userRef = await assertPersonalUser(data.uid);

  await getAuth().updateUser(data.uid, { disabled: true });
  await userRef.set({
    activo: false,
    desactivadoEn: FieldValue.serverTimestamp(),
    desactivadoPor: request.auth.uid,
  }, { merge: true });

  return { success: true };
});

export const reactivarPersonal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesiÃ³n para reactivar personal.");
  }

  await assertSuperadmin(request.auth.uid);
  const data = assertStatusData(request.data);
  const userRef = await assertPersonalUser(data.uid);

  await getAuth().updateUser(data.uid, { disabled: false });
  await userRef.set({
    activo: true,
    reactivadoEn: FieldValue.serverTimestamp(),
    reactivadoPor: request.auth.uid,
  }, { merge: true });

  return { success: true };
});
