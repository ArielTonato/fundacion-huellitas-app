import { GoogleGenAI } from "@google/genai";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const DAILY_LIMIT = 3;
const MAX_BASE64_LENGTH = 8_000_000;
const GEMINI_MODEL = "gemini-2.5-flash-image";
const ECUADOR_TIME_ZONE = "America/Guayaquil";
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

interface GenerarImagenRequest {
  animalImageBase64: string;
  animalMimeType: string;
  userImageBase64: string;
  userMimeType: string;
  animalName?: string;
}

interface GeneratedImagePart {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
}

function getTodayKey(): string {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: ECUADOR_TIME_ZONE,
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function assertImageInput(base64: unknown, mimeType: unknown, fieldName: string): void {
  if (typeof base64 !== "string" || base64.trim().length === 0) {
    throw new HttpsError("invalid-argument", `La imagen ${fieldName} es requerida.`);
  }

  if (base64.length > MAX_BASE64_LENGTH) {
    throw new HttpsError("invalid-argument", `La imagen ${fieldName} es demasiado pesada.`);
  }

  if (typeof mimeType !== "string" || !SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new HttpsError("invalid-argument", `El formato de la imagen ${fieldName} no es compatible.`);
  }
}

function assertRequestData(data: unknown): GenerarImagenRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Los datos de generación son requeridos.");
  }

  const requestData = data as Partial<GenerarImagenRequest>;
  assertImageInput(requestData.animalImageBase64, requestData.animalMimeType, "de la mascota");
  assertImageInput(requestData.userImageBase64, requestData.userMimeType, "del adoptante");

  return {
    animalImageBase64: requestData.animalImageBase64 as string,
    animalMimeType: requestData.animalMimeType as string,
    userImageBase64: requestData.userImageBase64 as string,
    userMimeType: requestData.userMimeType as string,
    animalName: requestData.animalName,
  };
}

async function assertDailyLimit(uid: string, dateKey: string): Promise<void> {
  const db = getFirestore();
  const generationDoc = await db.doc(`generaciones/${uid}_${dateKey}`).get();
  const cantidad = generationDoc.exists ? Number(generationDoc.data()?.cantidad ?? 0) : 0;

  if (cantidad >= DAILY_LIMIT) {
    throw new HttpsError("resource-exhausted", "Ya usaste tus 3 generaciones de hoy. Vuelve mañana.");
  }
}

async function registerSuccessfulGeneration(uid: string, dateKey: string): Promise<number> {
  const db = getFirestore();
  const generationRef = db.doc(`generaciones/${uid}_${dateKey}`);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(generationRef);
    const currentAmount = snapshot.exists ? Number(snapshot.data()?.cantidad ?? 0) : 0;

    if (currentAmount >= DAILY_LIMIT) {
      throw new HttpsError("resource-exhausted", "Ya usaste tus 3 generaciones de hoy. Vuelve mañana.");
    }

    const nextAmount = currentAmount + 1;
    transaction.set(generationRef, {
      uid,
      fecha: dateKey,
      cantidad: nextAmount,
      actualizadoEn: FieldValue.serverTimestamp(),
      creadoEn: snapshot.exists ? snapshot.data()?.creadoEn ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    }, { merge: true });

    return Math.max(DAILY_LIMIT - nextAmount, 0);
  });
}

function buildPrompt(animalName: string | undefined): string {
  const petName = animalName?.trim() || "la mascota";

  return [
    "Create a warm, realistic vertical portrait for an animal adoption preview.",
    `Use the pet from the first image as ${petName}.`,
    "Use the person from the second image as the adopter.",
    "Compose them together in a cozy home, with natural soft light, emotional but realistic.",
    "Preserve the pet's recognizable traits and avoid adding text, logos, UI elements, or watermarks.",
  ].join(" ");
}

function getGeneratedImage(parts: GeneratedImagePart[] | undefined): { imageBase64: string; mimeType: string } {
  const imagePart = parts?.find((part) => part.inlineData?.data);
  const imageBase64 = imagePart?.inlineData?.data;

  if (!imageBase64) {
    throw new HttpsError("internal", "Gemini no devolvió una imagen generada.");
  }

  return {
    imageBase64,
    mimeType: imagePart?.inlineData?.mimeType ?? "image/png",
  };
}

export const generarImagenAdopcion = onCall(
  { timeoutSeconds: 180, memory: "1GiB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión para generar una imagen.");
    }

    const uid = request.auth.uid;
    const dateKey = getTodayKey();
    const data = assertRequestData(request.data);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error("GEMINI_API_KEY is missing", { uid });
      throw new HttpsError("failed-precondition", "La generación de imagen no está configurada.");
    }

    await assertDailyLimit(uid, dateKey);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          role: "user",
          parts: [
            { text: buildPrompt(data.animalName) },
            { inlineData: { mimeType: data.animalMimeType, data: data.animalImageBase64 } },
            { inlineData: { mimeType: data.userMimeType, data: data.userImageBase64 } },
          ],
        }],
      });
      const generatedImage = getGeneratedImage(response.candidates?.[0]?.content?.parts);
      const remainingToday = await registerSuccessfulGeneration(uid, dateKey);

      return {
        ...generatedImage,
        remainingToday,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Gemini image generation failed", {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorStack: error instanceof Error ? error.stack : undefined,
        uid,
      });
      throw new HttpsError("internal", "No se pudo generar la imagen. Inténtalo nuevamente.");
    }
  },
);
