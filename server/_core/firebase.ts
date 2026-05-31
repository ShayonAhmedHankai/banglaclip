import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let _app: App | null = null;

function getApp(): App {
  if (_app) return _app;

  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Provide your Firebase service account JSON as a secret."
    );
  }

  const serviceAccount = JSON.parse(json);
  _app = initializeApp({ credential: cert(serviceAccount) });
  return _app;
}

export async function verifyFirebaseToken(
  token: string
): Promise<import("firebase-admin/auth").DecodedIdToken | null> {
  try {
    return await getAuth(getApp()).verifyIdToken(token);
  } catch (err) {
    console.warn("[Firebase] Token verification failed:", String(err));
    return null;
  }
}
