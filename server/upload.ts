import express, { Request, Response } from "express";
import multer, { Multer } from "multer";
import { storagePut } from "./storage";
import { createVideoFile } from "./db";
import { ENV } from "./_core/env";

const router = express.Router();

// Middleware to parse multipart form data
const upload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

/**
 * POST /api/upload
 * Multipart form upload endpoint for video files
 * Requires: Authorization header with user ID
 * Form data: file (video file)
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Get user ID from authorization context
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { originalname, buffer, size, mimetype } = file;

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `videos/${userId}/${timestamp}-${originalname}`;

    // Upload to S3
    const { url, key } = await storagePut(fileKey, buffer, mimetype);

    // Create database record
    const videoFile = await createVideoFile({
      userId,
      filename: originalname,
      fileKey: key,
      url,
      mimeType: mimetype,
      fileSizeBytes: size,
    });

    return res.json({
      id: videoFile.id,
      filename: videoFile.filename,
      url: videoFile.url,
      fileKey: videoFile.fileKey,
      fileSizeBytes: videoFile.fileSizeBytes,
      createdAt: videoFile.createdAt,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

export default router;
