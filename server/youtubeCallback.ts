/**
 * YouTube OAuth callback route.
 * Google redirects here with ?code=...&state=... after user grants access.
 * Exchanges the code for tokens, stores them, then redirects back to the
 * YouTube page in the app.
 */

import { Router, Request, Response } from "express";
import { exchangeCodeForTokens } from "./_core/youtube";
import { updateUserYouTubeTokens, getUserByFirebaseUid } from "./db";
import { getAuth } from "firebase-admin/auth";

const youtubeCallbackRouter = Router();

youtubeCallbackRouter.get("/youtube/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    console.error("[YouTube] OAuth error:", error);
    res.redirect(`/youtube?error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code || !state) {
    res.redirect("/youtube?error=missing_params");
    return;
  }

  try {
    // Decode user id from state
    const { userId } = JSON.parse(Buffer.from(state, "base64url").toString()) as { userId: number };

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch channel info
    let channelId: string | undefined;
    try {
      const resp = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      if (resp.ok) {
        const data = await resp.json() as { items?: { id: string }[] };
        channelId = data.items?.[0]?.id;
      }
    } catch {
      // non-fatal
    }

    await updateUserYouTubeTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      channelId,
    });

    res.redirect("/youtube?connected=1");
  } catch (err) {
    console.error("[YouTube] Callback error:", err);
    res.redirect("/youtube?error=callback_failed");
  }
});

export default youtubeCallbackRouter;
