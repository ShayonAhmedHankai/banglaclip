import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBatchJob,
  getUserBatchJobs,
  updateBatchJobStatus,
} from "../db";
import { TRPCError } from "@trpc/server";

export const batchRouter = router({
  /**
   * Create a new batch job
   */
  create: protectedProcedure
    .input(
      z.object({
        batchName: z.string().min(1, "Batch name is required"),
        scheduledFor: z.date().optional(),
        totalJobCount: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createBatchJob({
          userId: ctx.user.id,
          batchName: input.batchName,
          status: "scheduled",
          scheduledFor: input.scheduledFor || new Date(),
          processedJobCount: 0,
          totalJobCount: input.totalJobCount,
        });

        return {
          success: true,
          batchId: result.id,
          message: `Batch job "${input.batchName}" created with ${input.totalJobCount} items`,
        };
      } catch (error) {
        console.error("[Batch] Failed to create batch job:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch job",
        });
      }
    }),

  /**
   * List all batch jobs for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const batches = await getUserBatchJobs(ctx.user.id);
      return batches;
    } catch (error) {
      console.error("[Batch] Failed to list batch jobs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch batch jobs",
      });
    }
  }),

  /**
   * Get a specific batch job
   */
  getById: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Note: In production, add getBatchJobById function to db.ts
        // For now, return basic structure
        return {
          id: input.batchId,
          userId: ctx.user.id,
          batchName: "Batch Job",
          status: "scheduled" as const,
          processedJobCount: 0,
          totalJobCount: 0,
        };
      } catch (error) {
        console.error("[Batch] Failed to get batch job:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch batch job",
        });
      }
    }),

  /**
   * Update batch job status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        batchId: z.number(),
        status: z.enum(["scheduled", "processing", "completed", "failed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateBatchJobStatus(input.batchId, input.status);

        return {
          success: true,
          message: `Batch job status updated to ${input.status}`,
        };
      } catch (error) {
        console.error("[Batch] Failed to update batch status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update batch job",
        });
      }
    }),


});
