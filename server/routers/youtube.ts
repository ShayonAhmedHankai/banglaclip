import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getPipelineJobById,
  updatePipelineJobStatus,
  getVideoFileById,
  updateUserYouTubeTokens,
  getUserYouTubeTokens,
} from "../db";
import { storageGetSignedUrl } from "../storage";
import { TRPCError } from "@trpc/server";
import {
  isYouTubeConfigured,
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  uploadToYouTube,
} from "../_core/youtube";
import { invokeLLM } from "../_core/llm";

// ─── OAuth helpers ────────────────────────────────────────────────────────────

/**
 * Get a valid access token for the user, refreshing if needed.
 */
async function getValidAccessToken(userId: number): Promise<string> {
  const tokens = await getUserYouTubeTokens(userId);
  if (!tokens?.youtubeRefreshToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "YouTube not connected. Please connect your YouTube account first.",
    });
  }

  const now = new Date();
  const expiry = tokens.youtubeTokenExpiry ? new Date(tokens.youtubeTokenExpiry) : new Date(0);

  // Refresh if expired or within 5 minutes of expiry
  if (!tokens.youtubeAccessToken || expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const { accessToken, expiresAt } = await refreshAccessToken(tokens.youtubeRefreshToken);
    await updateUserYouTubeTokens(userId, {
      accessToken,
      refreshToken: tokens.youtubeRefreshToken,
      expiresAt,
    });
    return accessToken;
  }

  return tokens.youtubeAccessToken;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const youtubeRouter = router({
  /**
   * Check whether YouTube OAuth is configured server-side and whether the
   * current user has connected their account.
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const configured = isYouTubeConfigured();
    const tokens = configured ? await getUserYouTubeTokens(ctx.user.id) : null;
    return {
      configured,
      connected: !!tokens?.youtubeRefreshToken,
      channelId: tokens?.youtubeChannelId ?? null,
    };
  }),

  /**
   * Returns the Google OAuth URL the frontend should redirect/open to.
   */
  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    if (!isYouTubeConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "YouTube OAuth is not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI.",
      });
    }
    // Encode user id in state so the callback knows who to store tokens for
    const state = Buffer.from(JSON.stringify({ userId: ctx.user.id })).toString("base64url");
    return { url: buildAuthUrl(state) };
  }),

  /**
   * Handle OAuth callback — exchange code for tokens and store them.
   * Call this from the callback page with { code, state }.
   */
  handleCallback: protectedProcedure
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tokens = await exchangeCodeForTokens(input.code);

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

      await updateUserYouTubeTokens(ctx.user.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        channelId,
      });

      return { success: true, channelId };
    }),

  /**
   * Disconnect YouTube account.
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await updateUserYouTubeTokens(ctx.user.id, {
      accessToken: "",
      refreshToken: "",
      expiresAt: new Date(0),
    });
    return { success: true };
  }),

  /**
   * Generate YouTube title and description from job transcript using LLM.
   */
  generateMetadata: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a YouTube content expert specializing in Bengali content. Generate engaging titles and descriptions for Bengali videos.",
            },
            {
              role: "user",
              content: `Generate a YouTube title and description for a Bengali video named "${job.jobName}". 
              The video has been processed with silence removal and Bengali captions.
              Return JSON with "title" (max 60 chars) and "description" (max 500 chars) fields.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "youtube_metadata",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No content from LLM");
        const metadata = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
        return { title: metadata.title as string, description: metadata.description as string };
      } catch (error) {
        console.error("[YouTube] Metadata generation failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate metadata" });
      }
    }),

  /**
   * Upload a completed job's output video to YouTube.
   */
  uploadVideo: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        title: z.string(),
        description: z.string(),
        tags: z.array(z.string()).optional(),
        privacyStatus: z.enum(["public", "unlisted", "private"]).default("unlisted"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      if (job.status !== "done") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job must be completed before uploading to YouTube" });
      }
      if (!job.outputFileId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No output file found for this job" });
      }

      // Get a valid access token (auto-refreshes if needed)
      const accessToken = await getValidAccessToken(ctx.user.id);

      // Download the output video from S3
      const outputFile = await getVideoFileById(job.outputFileId);
      if (!outputFile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Output video file not found" });
      }

      console.log(`[YouTube] Downloading output file for job ${input.jobId}`);
      const signedUrl = await storageGetSignedUrl(outputFile.fileKey);
      const videoResp = await fetch(signedUrl);
      if (!videoResp.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to download output video" });
      }
      const videoBuffer = Buffer.from(await videoResp.arrayBuffer());

      console.log(`[YouTube] Uploading to YouTube — ${videoBuffer.length} bytes`);
      const { videoId, videoUrl } = await uploadToYouTube({
        accessToken,
        videoBuffer,
        title: input.title,
        description: input.description,
        tags: input.tags ?? [],
        privacyStatus: input.privacyStatus,
      });

      // Store YouTube metadata on the job
      await updatePipelineJobStatus(input.jobId, "done", {
        youtubeVideoId: videoId,
        youtubeVideoUrl: videoUrl,
      });

      console.log(`[YouTube] Upload successful — videoId=${videoId}`);
      return { success: true, videoId, videoUrl };
    }),

  /**
   * Get YouTube upload status for a job.
   */
  getStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      return {
        youtubeUploadEnabled: job.youtubeUploadEnabled,
        videoId: job.youtubeVideoId,
        videoUrl: job.youtubeVideoUrl,
        status: job.youtubeVideoId ? "uploaded" : "pending",
      };
    }),
});
