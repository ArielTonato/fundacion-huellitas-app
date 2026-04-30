import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  getMessaging,
  type BatchResponse,
  type MulticastMessage,
} from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

if (getApps().length === 0) {
  initializeApp();
}

interface ReporteNotificationData {
  nombre?: string;
  especie?: string;
  reportadoPor?: string;
}

interface UserToken {
  uid: string;
  token: string;
}

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);
const MAX_MULTICAST_TOKENS = 500;

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
  return docs
    .map((doc) => ({ uid: doc.id, token: doc.data().fcmToken }))
    .filter((user): user is UserToken => (
      user.uid !== reporterUid &&
      typeof user.token === "string" &&
      user.token.trim().length > 0
    ));
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
      body: `${reporte.nombre ?? "Una mascota"} (${reporte.especie ?? "sin especie"}) fue reportada cerca de ti.`,
    },
    data: {
      type: "reporte_creado",
      reporteId,
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

    if (!reporte?.reportadoPor) {
      console.warn("Reporte sin reportadoPor, no se enviaron notificaciones.", {
        reporteId,
      });
      return null;
    }

    const db = getFirestore();
    const usersSnapshot = await db.collection("users").get();
    const users = getValidUserTokens(usersSnapshot.docs, reporte.reportadoPor);

    if (users.length === 0) {
      return null;
    }

    const chunks = chunkUsers(users);
    await Promise.all(chunks.map(async (chunk) => {
      const response = await sendReportNotification(reporteId, reporte, chunk);
      await clearInvalidTokens(chunk, response);
    }));

    return null;
  }
);
