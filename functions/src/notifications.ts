import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  getMessaging,
  type BatchResponse,
  type MulticastMessage,
} from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

interface ReporteNotificationData {
  nombre?: string;
  especie?: string;
  sexo?: string;
  reportadoPor?: string;
}

interface UserToken {
  uid: string;
  token: string;
}

interface TestNotificationResponse {
  success: boolean;
  messageId: string;
}

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);
const ANDROID_NOTIFICATION_CHANNEL_ID = "default";
const MAX_MULTICAST_TOKENS = 500;

async function getActiveSuperadminData(uid: string): Promise<FirebaseFirestore.DocumentData> {
  const userDoc = await getFirestore().collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "No tienes permisos para enviar notificaciones de prueba.");
  }

  const userData = userDoc.data();
  if (userData?.role !== "superadmin" || userData.activo === false) {
    throw new HttpsError("permission-denied", "Solo un superadmin activo puede enviar notificaciones de prueba.");
  }

  return userData;
}

function chunkUsers(users: UserToken[]): UserToken[][] {
  return users.reduce<UserToken[][]>((chunks, user, index) => {
    const chunkIndex = Math.floor(index / MAX_MULTICAST_TOKENS);
    return chunks.map((chunk, currentIndex) => (
      currentIndex === chunkIndex ? [...chunk, user] : chunk
    )).concat(chunkIndex === chunks.length ? [[user]] : []);
  }, []);
}

function getValidUserTokens(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  reporterUid: string
): UserToken[] {
  return docs.reduce<UserToken[]>((users, doc) => {
    const token = doc.data().fcmToken;
    if (
      doc.id === reporterUid ||
      typeof token !== "string" ||
      token.trim().length === 0 ||
      users.some((user) => user.token === token)
    ) {
      return users;
    }

    return [...users, {uid: doc.id, token}];
  }, []);
}

function getReportNotificationBody(reporte: ReporteNotificationData): string {
  const nombre = reporte.nombre ?? "Una mascota";
  const especie = reporte.especie ?? "sin especie";

  if (reporte.sexo === "macho") {
    return `${nombre} (${especie}) fue reportado desaparecido.`;
  }

  return `${nombre} (${especie}) fue reportada desaparecida.`;
}

async function sendReportNotification(
  reporteId: string,
  reporte: ReporteNotificationData,
  users: UserToken[]
): Promise<BatchResponse> {
  const message: MulticastMessage = {
    tokens: users.map((user) => user.token),
    notification: {
      title: "Mascota extraviada",
      body: getReportNotificationBody(reporte),
    },
    data: {
      type: "reporte_creado",
      reporteId,
    },
    android: {
      notification: {
        channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
      },
    },
  };

  return getMessaging().sendEachForMulticast(message);
}

async function clearInvalidTokens(
  users: UserToken[],
  response: BatchResponse
): Promise<void> {
  const db = getFirestore();
  const batch = db.batch();
  let hasInvalidTokens = false;

  response.responses.forEach((sendResponse, index) => {
    const code = sendResponse.error?.code;
    if (code && INVALID_TOKEN_CODES.has(code)) {
      hasInvalidTokens = true;
      batch.update(db.collection("users").doc(users[index].uid), {
        fcmToken: null,
      });
    }
  });

  if (hasInvalidTokens) {
    await batch.commit();
  }
}

export const notificarReporte = onDocumentCreated(
  "reportes/{reporteId}",
  async (event) => {
    const reporte = event.data?.data() as ReporteNotificationData | undefined;
    const reporteId = event.params.reporteId;

    logger.info("Reporte creado, evaluando notificaciones.", {
      reporteId,
      reportadoPor: reporte?.reportadoPor,
    });

    if (!reporte?.reportadoPor) {
      logger.warn("Reporte sin reportadoPor, no se enviaron notificaciones.", {
        reporteId,
      });
      return null;
    }

    const db = getFirestore();
    const usersSnapshot = await db.collection("users").get();
    const users = getValidUserTokens(usersSnapshot.docs, reporte.reportadoPor);

    logger.info("Usuarios evaluados para notificacion de reporte.", {
      reporteId,
      totalUsers: usersSnapshot.size,
      validTokens: users.length,
    });

    if (users.length === 0) {
      logger.info("No hay tokens FCM validos para notificar.", {reporteId});
      return null;
    }

    const chunks = chunkUsers(users);
    await Promise.all(chunks.map(async (chunk) => {
      const response = await sendReportNotification(reporteId, reporte, chunk);
      logger.info("Resultado de envio FCM para reporte.", {
        reporteId,
        attemptedTokens: chunk.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errorCodes: response.responses
          .map((sendResponse) => sendResponse.error?.code)
          .filter((code): code is string => Boolean(code)),
      });
      await clearInvalidTokens(chunk, response);
    }));

    return null;
  }
);

export const enviarNotificacionPrueba = onCall(
  async (request): Promise<TestNotificationResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesion para enviar una notificacion de prueba.");
    }

    const uid = request.auth.uid;
    const userData = await getActiveSuperadminData(uid);
    const fcmToken = userData.fcmToken;

    if (typeof fcmToken !== "string" || fcmToken.trim().length === 0) {
      throw new HttpsError("failed-precondition", "Tu usuario no tiene un token FCM registrado.");
    }

    try {
      const messageId = await getMessaging().send({
        token: fcmToken,
        notification: {
          title: "Notificacion de prueba",
          body: "Si ves esto, FCM esta funcionando correctamente.",
        },
        data: {
          type: "notificacion_prueba",
        },
        android: {
          notification: {
            channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
          },
        },
      });

      logger.info("Notificacion de prueba enviada.", {
        uid,
        messageId,
      });

      return {success: true, messageId};
    } catch (error) {
      logger.error("No se pudo enviar la notificacion de prueba.", {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "UnknownError",
        uid,
      });
      throw new HttpsError("internal", "No se pudo enviar la notificacion de prueba.");
    }
  }
);
