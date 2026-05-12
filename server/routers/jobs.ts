import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createPipelineJob,
  getPipelineJobById,
  getUserPipelineJobs,
  updatePipelineJobStatus,
  getVideoFileById,
  createPipelineStage,
  getJobStages,
} from "../db";
import { TRPCError } from "@trpc/server";

const jobConfigSchema = z.object({
  silenceThresholdDb: z.number().default(-35),
  silenceMinDurationSec: z.number().default(0.4),
  silencePaddingSec: z.number().default(0.1),
  captionFontName: z.string().default("Arial"),
  captionFontSize: z.number().default(18),
  captionFontColor: z.string().default("#FFFFFF"),
  captionOutlineColor: z.string().default("#000000"),
  captionAlignment: z.enum(["top", "center", "bottom"]).default("bottom"),
  brollMaxPerMinute: z.number().default(3),
  brollMinScore: z.number().default(0.6),
  exportAspectRatio: z.string().default("9:16"),
  exportCropMode: z.enum(["center", "top", "bottom"]).default("center"),
  exportQuality: z.enum(["low", "medium", "high"]).default("high"),
  youtubeUploadEnabled: z.boolean().default(false),
});

export const jobsRouter = router({
  /**
   * Create a new pipeline job
   */
  create: protectedProcedure
    .input(
      z.object({
        inputFileId: z.number(),
        jobName: z.string().min(1).max(255),
        config: jobConfigSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the input file exists and belongs to the user
      const inputFile = await getVideoFileById(input.inputFileId, ctx.user.id);
      if (!inputFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Input video file not found",
        });
      }

      try {
        const config = input.config || {} as z.infer<typeof jobConfigSchema>;

        const job = await createPipelineJob({
          userId: ctx.user.id,
          inputFileId: input.inputFileId,
          jobName: input.jobName,
          status: "queued",
          currentStage: "silence_removal",
          silenceThresholdDb: String(config.silenceThresholdDb ?? -35),
          silenceMinDurationSec: String(config.silenceMinDurationSec ?? 0.4),
          silencePaddingSec: String(config.silencePaddingSec ?? 0.1),
          captionFontName: config.captionFontName ?? "Arial",
          captionFontSize: config.captionFontSize ?? 18,
          captionFontColor: config.captionFontColor ?? "#FFFFFF",
          captionOutlineColor: config.captionOutlineColor ?? "#000000",
          captionAlignment: config.captionAlignment ?? "bottom",
          brollMaxPerMinute: config.brollMaxPerMinute ?? 3,
          brollMinScore: String(config.brollMinScore ?? 0.6),
          exportAspectRatio: config.exportAspectRatio ?? "9:16",
          exportCropMode: config.exportCropMode ?? "center",
          exportQuality: config.exportQuality ?? "high",
          youtubeUploadEnabled: (config as any).youtubeUploadEnabled ?? false,
        });

        // Create initial pipeline stages
        const stageNames = [
          "silence_removal",
          "caption_generation",
          "broll_overlay",
          "export",
        ] as const;

        for (const stageName of stageNames) {
          await createPipelineStage({
            jobId: job.id,
            stageName,
            status: "pending",
            progressPercent: 0,
          });
        }

        if ((config as any).youtubeUploadEnabled) {
          await createPipelineStage({
            jobId: job.id,
            stageName: "youtube_upload",
            status: "pending",
            progressPercent: 0,
          });
        }

        return formatJobResponse(job);
      } catch (error) {
        console.error("[Jobs] Create failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create job",
        });
      }
    }),

  /**
   * Get all jobs for the authenticated user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const jobs = await getUserPipelineJobs(ctx.user.id);
    return jobs.map(formatJobResponse);
  }),

  /**
   * Get a specific job by ID (with ownership check)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.id, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      return formatJobResponse(job);
    }),

  /**
   * Get stages for a specific job
   */
  getStages: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const job = await getPipelineJobById(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      const stages = await getJobStages(input.jobId);
      return stages.map(stage => ({
        id: stage.id,
        stageName: stage.stageName,
        status: stage.status,
        progressPercent: stage.progressPercent,
        metadata: stage.metadata ? JSON.parse(String(stage.metadata)) : null,
        errorMessage: stage.errorMessage,
        startedAt: stage.startedAt,
        completedAt: stage.completedAt,
        createdAt: stage.createdAt,
      }));
    }),

  /**
   * Cancel a queued job
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getPipelineJobById(input.id, ctx.user.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "queued") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only cancel queued jobs",
        });
      }

      await updatePipelineJobStatus(input.id, "failed", {
        errorMessage: "Cancelled by user",
      });

      return { success: true };
    }),
});

function formatJobResponse(job: any) {
  return {
    id: job.id,
    jobName: job.jobName,
    status: job.status,
    currentStage: job.currentStage,
    inputFileId: job.inputFileId,
    outputFileId: job.outputFileId,
    youtubeVideoId: job.youtubeVideoId,
    youtubeVideoUrl: job.youtubeVideoUrl,
    errorMessage: job.errorMessage,
    errorStage: job.errorStage,
    config: {
      silenceThresholdDb: parseFloat(String(job.silenceThresholdDb)),
      silenceMinDurationSec: parseFloat(String(job.silenceMinDurationSec)),
      silencePaddingSec: parseFloat(String(job.silencePaddingSec)),
      captionFontName: job.captionFontName,
      captionFontSize: job.captionFontSize,
      captionFontColor: job.captionFontColor,
      captionOutlineColor: job.captionOutlineColor,
      captionAlignment: job.captionAlignment,
      brollMaxPerMinute: job.brollMaxPerMinute,
      brollMinScore: parseFloat(String(job.brollMinScore)),
      exportAspectRatio: job.exportAspectRatio,
      exportCropMode: job.exportCropMode,
      exportQuality: job.exportQuality,
      youtubeUploadEnabled: job.youtubeUploadEnabled,
    },
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
