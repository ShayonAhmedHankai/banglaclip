import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getPipelineJobById } from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const notificationsRouter = router({
  /**
   * Send job completion notification to owner
   */
  notifyJobCompletion: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      try {
        const status = job.status === "done" ? "✅ Completed" : "❌ Failed";
        const title = `Video Job ${status}`;
        const content = `
Job: ${job.jobName}
Status: ${job.status}
${job.status === "done" ? "Your video has been processed successfully and is ready for download." : `Error: ${job.errorMessage || "Unknown error"}`}
        `.trim();

        const result = await notifyOwner({ title, content });

        return {
          success: result,
          message: result ? "Notification sent" : "Failed to send notification",
        };
      } catch (error) {
        console.error("[Notifications] Failed to send notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  /**
   * Send batch job status notification
   */
  notifyBatchStatus: protectedProcedure
    .input(
      z.object({
        batchName: z.string(),
        totalJobs: z.number(),
        completedJobs: z.number(),
        failedJobs: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const progress = Math.round((input.completedJobs / input.totalJobs) * 100);
        const title = `Batch Processing Update: ${input.batchName}`;
        const content = `
Progress: ${progress}% (${input.completedJobs}/${input.totalJobs} completed)
Failed: ${input.failedJobs}
${progress === 100 ? "Batch processing completed!" : "Processing in progress..."}
        `.trim();

        const result = await notifyOwner({ title, content });

        return {
          success: result,
          message: result ? "Notification sent" : "Failed to send notification",
        };
      } catch (error) {
        console.error("[Notifications] Failed to send batch notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  /**
   * Send YouTube upload notification
   */
  notifyYouTubeUpload: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        videoUrl: z.string(),
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const title = input.success
          ? `🎬 Video Uploaded to YouTube: ${input.jobName}`
          : `❌ YouTube Upload Failed: ${input.jobName}`;

        const content = input.success
          ? `Your video has been successfully uploaded to YouTube.\nWatch it here: ${input.videoUrl}`
          : `Failed to upload video to YouTube.\nError: ${input.error || "Unknown error"}`;

        const result = await notifyOwner({ title, content });

        return {
          success: result,
          message: result ? "Notification sent" : "Failed to send notification",
        };
      } catch (error) {
        console.error("[Notifications] Failed to send YouTube notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),
});
