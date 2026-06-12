import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getPipelineJobById, updatePipelineJobStatus, resetJobStages } from "../db";
import { queueJobForProcessing } from "../pipeline/executor";
import { TRPCError } from "@trpc/server";

export const pipelineRouter = router({
  /**
   * Start processing a queued job
   */
  startJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.status !== "queued") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Job is already ${job.status}. Only queued jobs can be started.`,
        });
      }

      try {
        // Queue the job for processing
        // In production, this would be handled by a background worker
        await queueJobForProcessing(input.jobId);

        return {
          success: true,
          jobId: input.jobId,
        };
      } catch (error) {
        console.error("[Pipeline] Start job failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start job processing",
        });
      }
    }),

  /**
   * Get job execution status
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
        jobId: job.id,
        status: job.status,
        currentStage: job.currentStage,
        progress: calculateJobProgress(job),
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };
    }),

  /**
   * Retry a failed job
   */
  retryJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed jobs can be retried",
        });
      }

      try {
        // Reset job to queued status and clear all stage state
        await updatePipelineJobStatus(input.jobId, "queued", {
          errorMessage: null,
          errorStage: null,
          outputFileId: null,
          startedAt: null,
          completedAt: null,
          currentStage: "silence_removal",
        });

        // Reset all stages back to pending
        await resetJobStages(input.jobId);

        // Queue for processing
        await queueJobForProcessing(input.jobId);

        return {
          success: true,
          jobId: input.jobId,
        };
      } catch (error) {
        console.error("[Pipeline] Retry job failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retry job",
        });
      }
    }),
});

/**
 * Calculate overall job progress based on current stage
 */
function calculateJobProgress(job: any): number {
  const stageProgress: Record<string, number> = {
    silence_removal: 20,
    caption_generation: 40,
    broll_overlay: 60,
    export: 80,
    youtube_upload: 100,
  };

  if (job.status === "done") return 100;
  if (job.status === "failed") return 0;
  if (job.status === "queued") return 0;

  return stageProgress[job.currentStage] || 0;
}
