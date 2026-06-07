/**
 * YouTube Data API v3 helpers.
 *
 * Required env vars (set in your deployment secrets):
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REDIRECT_URI  (e.g. https://yourdomain.com/api/youtube/callback)
 *
 * Per-user OAuth tokens are stored in the `users` table extension columns
 * (youtubeAccessToken, youtubeRefreshToken, youtubeTokenExpiry).
 * We add those columns via a new migration.
 *
 * Flow:
 *   1. GET  /api/youtube/auth          → redirect to Google consent screen
 *   2. GET  /api/youtube/callback      → exchange code, store tokens
 *   3. POST /api/youtube/upload/:jobId → upload video using stored tokens
 */

import { ENV } from "./env";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

export function getYouTubeConfig() {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID ?? "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
    redirectUri: process.env.YOUTUBE_REDIRECT_URI ?? "",
  };
}

export function isYouTubeConfigured(): boolean {
  const { clientId, clientSecret, redirectUri } = getYouTubeConfig();
  return !!(clientId && clientSecret && redirectUri);
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getYouTubeConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const { clientId, clientSecret, redirectUri } = getYouTubeConfig();

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Token exchange failed (${resp.status}): ${msg}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const { clientId, clientSecret } = getYouTubeConfig();

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Token refresh failed (${resp.status}): ${msg}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Upload a video buffer to YouTube using resumable upload API.
 * Returns { videoId, videoUrl }
 */
export async function uploadToYouTube(params: {
  accessToken: string;
  videoBuffer: Buffer;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "public" | "unlisted" | "private";
  mimeType?: string;
}): Promise<{ videoId: string; videoUrl: string }> {
  const {
    accessToken,
    videoBuffer,
    title,
    description,
    tags = [],
    privacyStatus = "unlisted",
    mimeType = "video/mp4",
  } = params;

  // 1. Initiate resumable upload
  const metadata = {
    snippet: {
      title,
      description,
      tags,
      categoryId: "22", // People & Blogs
    },
    status: { privacyStatus },
  };

  const initResp = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(videoBuffer.length),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initResp.ok) {
    const msg = await initResp.text().catch(() => initResp.statusText);
    throw new Error(`YouTube upload init failed (${initResp.status}): ${msg}`);
  }

  const uploadUrl = initResp.headers.get("Location");
  if (!uploadUrl) throw new Error("YouTube did not return an upload URL");

  // 2. Upload the actual video bytes
  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(videoBuffer.length),
    },
    body: videoBuffer as unknown as BodyInit,
  });

  if (!uploadResp.ok) {
    const msg = await uploadResp.text().catch(() => uploadResp.statusText);
    throw new Error(`YouTube video upload failed (${uploadResp.status}): ${msg}`);
  }

  const result = await uploadResp.json() as { id: string };
  const videoId = result.id;

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
