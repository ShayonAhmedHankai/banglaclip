import express, { Request, Response } from "express";
import multer, { Multer } from "multer";
import { storagePut } from "./storage";
import { createVideoFile, upsertUser, getUserByFirebaseUid } from "./db";
import { verifyFirebaseToken } from "./_core/firebase";

const router = express.Router();

const upload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

/**
 * POST /api/upload
 * Multipart form upload endpoint for video files.
 * Requires: Authorization: Bearer <firebase-id-token>
 * Form data: file (video file)
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Verify Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.slice(7);
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Upsert user and resolve DB record
    await upsertUser({
      firebaseUid: decoded.uid,
      name: (decoded.name as string | undefined) ?? null,
      email: decoded.email ?? null,
      loginMethod: decoded.firebase?.sign_in_provider ?? null,
    });
    const user = await getUserByFirebaseUid(decoded.uid);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { originalname, buffer, size, mimetype } = file;

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `videos/${user.id}/${timestamp}-${originalname}`;

    // Upload to S3 / Forge storage
    const { url, key } = await storagePut(fileKey, buffer, mimetype);

    // Create database record
    const videoFile = await createVideoFile({
      userId: user.id,
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
