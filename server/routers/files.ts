import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createVideoFile, getUserVideoFiles, getVideoFileById } from "../db";
import { TRPCError } from "@trpc/server";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export const filesRouter = router({
  /**
   * Get all video files for the authenticated user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const files = await getUserVideoFiles(ctx.user.id);
    return files.map(f => ({
      id: f.id,
      filename: f.filename,
      url: f.url,
      fileKey: f.fileKey,
      fileSizeBytes: f.fileSizeBytes,
      durationSeconds: f.durationSeconds ? parseFloat(f.durationSeconds.toString()) : null,
      createdAt: f.createdAt,
    }));
  }),

  /**
   * Get a single video file by ID (with ownership check)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const file = await getVideoFileById(input.id, ctx.user.id);
      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      }
      return {
        id: file.id,
        filename: file.filename,
        url: file.url,
        fileKey: file.fileKey,
        fileSizeBytes: file.fileSizeBytes,
        durationSeconds: file.durationSeconds ? parseFloat(file.durationSeconds.toString()) : null,
        createdAt: file.createdAt,
      };
    }),

  /**
   * Upload a video file to S3 and create a database record
   * Returns a presigned URL for the uploaded file
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        fileBuffer: z.instanceof(Buffer),
        fileSizeBytes: z.number().positive().max(MAX_FILE_SIZE),
        durationSeconds: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.fileSizeBytes > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      }

      try {
        // Generate a unique file key for S3
        const timestamp = Date.now();
        const fileKey = `videos/${ctx.user.id}/${timestamp}-${input.filename}`;

        // Upload to S3
        const { url, key } = await storagePut(fileKey, input.fileBuffer, "video/mp4");

        // Create database record
        const videoFile = await createVideoFile({
          userId: ctx.user.id,
          filename: input.filename,
          fileKey: key,
          url,
          mimeType: "video/mp4",
          fileSizeBytes: input.fileSizeBytes,
          durationSeconds: input.durationSeconds ? String(input.durationSeconds) : undefined,
        });

        return {
          id: videoFile.id,
          filename: videoFile.filename,
          url: videoFile.url,
          fileKey: videoFile.fileKey,
          fileSizeBytes: videoFile.fileSizeBytes,
          durationSeconds: videoFile.durationSeconds ? parseFloat(String(videoFile.durationSeconds)) : null,
          createdAt: videoFile.createdAt,
        };
      } catch (error) {
        console.error("[Files] Upload failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file",
        });
      }
    }),
});
