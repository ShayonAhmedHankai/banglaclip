import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export async function getFirebaseToken(): Promise<string | null> {
  const { auth, isFirebaseConfigured } = await import("./firebase");
  if (!isFirebaseConfigured || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}
