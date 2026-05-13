import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyFirebaseToken } from "./firebase";
import { upsertUser, getUserByFirebaseUid } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const authHeader = opts.req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const decoded = await verifyFirebaseToken(token);
    if (decoded) {
      await upsertUser({
        firebaseUid: decoded.uid,
        name: (decoded.name as string | undefined) ?? null,
        email: decoded.email ?? null,
        loginMethod: decoded.firebase?.sign_in_provider ?? null,
      });
      user = (await getUserByFirebaseUid(decoded.uid)) ?? null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
