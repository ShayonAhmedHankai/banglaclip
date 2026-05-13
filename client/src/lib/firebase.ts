import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export const isFirebaseConfigured = !!(apiKey && authDomain && projectId);

if (isFirebaseConfigured) {
  _app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  _auth = getAuth(_app);
}

export const app = _app;

// Auth is guaranteed non-null at runtime only when isFirebaseConfigured is true.
// All usages should guard on isFirebaseConfigured first.
export const auth = _auth as Auth;
