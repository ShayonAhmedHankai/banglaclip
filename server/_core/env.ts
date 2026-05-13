export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerFirebaseUid: process.env.OWNER_FIREBASE_UID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
};
