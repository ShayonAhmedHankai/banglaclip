import * as admin from "firebase-admin";

let _app: admin.app.App | null = null;

function getApp(): admin.app.App {
  if (_app) return _app;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Provide your Firebase service account JSON as a secret."
    );
  }

  const serviceAccount = JSON.parse(json) as admin.ServiceAccount;
  _app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return _app;
}

export async function verifyFirebaseToken(
  token: string
): Promise<admin.auth.DecodedIdToken | null> {
  try {
    return await admin.auth(getApp()).verifyIdToken(token);
  } catch (err) {
    console.warn("[Firebase] Token verification failed:", String(err));
    return null;
  }
}
