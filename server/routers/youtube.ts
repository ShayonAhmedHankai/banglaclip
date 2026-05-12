import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getPipelineJobById, updatePipelineJobStatus } from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const youtubeRouter = router({
  /**
   * Generate YouTube title and description from job transcript
   */
  generateMetadata: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      // In production, this would fetch the actual transcript from the job
      // For now, generate a sample title and description
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a YouTube content expert. Generate engaging titles and descriptions for videos.",
            },
            {
              role: "user",
              content: `Generate a YouTube title and description for a video job named "${job.jobName}". 
              Return a JSON object with "title" and "description" fields.
              Title should be 60 characters max, description should be 500 characters max.`,
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
                  title: { type: "string", description: "YouTube video title" },
                  description: { type: "string", description: "YouTube video description" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No content in LLM response");
        }

        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        const metadata = JSON.parse(contentStr);
        return {
          title: metadata.title,
          description: metadata.description,
        };
      } catch (error) {
        console.error("[YouTube] Metadata generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate YouTube metadata",
        });
      }
    }),

  /**
   * Upload video to YouTube
   * In production, this would:
   * 1. Use OAuth to get user's YouTube credentials
   * 2. Call YouTube Data API v3 to upload the video
   * 3. Store video ID and URL in job record
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.status !== "done") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job must be completed before uploading to YouTube",
        });
      }

      if (!job.youtubeUploadEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "YouTube upload is not enabled for this job",
        });
      }

      try {
        // In production, this would:
        // 1. Get the output video file from job.outputFileId
        // 2. Download it from S3
        // 3. Use YouTube API to upload
        // 4. Get the video ID and public URL

        // For now, simulate a successful upload
        const videoId = `yt_${Date.now()}`;
        const videoUrl = `https://youtube.com/watch?v=${videoId}`;

        // Update job with YouTube metadata
        await updatePipelineJobStatus(input.jobId, "done", {
          youtubeVideoId: videoId,
          youtubeVideoUrl: videoUrl,
        });

        return {
          success: true,
          videoId,
          videoUrl,
        };
      } catch (error) {
        console.error("[YouTube] Upload failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload to YouTube",
        });
      }
    }),

  /**
   * Get YouTube upload status for a job
   */
  getStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      return {
        youtubeUploadEnabled: job.youtubeUploadEnabled,
        videoId: job.youtubeVideoId,
        videoUrl: job.youtubeVideoUrl,
        status: job.youtubeVideoId ? "uploaded" : "pending",
      };
    }),
});
