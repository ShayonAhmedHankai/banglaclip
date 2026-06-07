import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser,
  users,
  videoFiles,
  VideoFile,
  InsertVideoFile,
  pipelineJobs,
  PipelineJob,
  InsertPipelineJob,
  pipelineStages,
  PipelineStage,
  InsertPipelineStage,
  batchJobs,
  BatchJob,
  InsertBatchJob,
  batchJobItems,
  BatchJobItem,
  InsertBatchJobItem,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.firebaseUid) {
    throw new Error("User firebaseUid is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { firebaseUid: user.firebaseUid };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (ENV.ownerFirebaseUid && user.firebaseUid === ENV.ownerFirebaseUid) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({ target: users.firebaseUid, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByFirebaseUid(firebaseUid: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVideoFile(data: InsertVideoFile): Promise<VideoFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videoFiles).values(data).returning();
  return result[0];
}

export async function getUserVideoFiles(userId: number): Promise<VideoFile[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videoFiles).where(eq(videoFiles.userId, userId));
}

export async function getVideoFileById(id: number, userId?: number): Promise<VideoFile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(videoFiles).where(eq(videoFiles.id, id)).limit(1);
  if (results.length === 0) return undefined;
  if (userId && results[0].userId !== userId) return undefined;
  return results[0];
}

export async function createPipelineJob(data: InsertPipelineJob): Promise<PipelineJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pipelineJobs).values(data).returning();
  return result[0];
}

export async function getPipelineJobById(id: number, userId?: number): Promise<PipelineJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(pipelineJobs).where(eq(pipelineJobs.id, id)).limit(1);
  if (results.length === 0) return undefined;
  if (userId && results[0].userId !== userId) return undefined;
  return results[0];
}

export async function getUserPipelineJobs(userId: number): Promise<PipelineJob[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pipelineJobs).where(eq(pipelineJobs.userId, userId));
}

export async function updatePipelineJobStatus(
  jobId: number,
  status: PipelineJob["status"],
  updates?: Partial<PipelineJob>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pipelineJobs)
    .set({ status, updatedAt: new Date(), ...updates })
    .where(eq(pipelineJobs.id, jobId));
}

export async function createPipelineStage(data: InsertPipelineStage): Promise<PipelineStage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pipelineStages).values(data).returning();
  return result[0];
}

export async function getJobStages(jobId: number): Promise<PipelineStage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pipelineStages).where(eq(pipelineStages.jobId, jobId));
}

export async function updatePipelineStageStatus(
  stageId: number,
  status: PipelineStage["status"],
  updates?: Partial<PipelineStage>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pipelineStages)
    .set({ status, updatedAt: new Date(), ...updates })
    .where(eq(pipelineStages.id, stageId));
}

export async function createBatchJob(data: InsertBatchJob): Promise<BatchJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(batchJobs).values(data).returning();
  return result[0];
}

export async function getUserBatchJobs(userId: number): Promise<BatchJob[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(batchJobs).where(eq(batchJobs.userId, userId));
}

export async function updateBatchJobStatus(
  batchJobId: number,
  status: BatchJob["status"],
  updates?: Partial<BatchJob>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(batchJobs)
    .set({ status, updatedAt: new Date(), ...updates })
    .where(eq(batchJobs.id, batchJobId));
}

export async function addBatchJobItem(data: InsertBatchJobItem): Promise<BatchJobItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(batchJobItems).values(data).returning();
  return result[0];
}

export async function getBatchJobItems(batchJobId: number): Promise<BatchJobItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(batchJobItems).where(eq(batchJobItems.batchJobId, batchJobId));
}

export async function updateUserYouTubeTokens(
  userId: number,
  tokens: { accessToken: string; refreshToken: string; expiresAt: Date; channelId?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({
      youtubeAccessToken: tokens.accessToken,
      youtubeRefreshToken: tokens.refreshToken,
      youtubeTokenExpiry: tokens.expiresAt,
      ...(tokens.channelId ? { youtubeChannelId: tokens.channelId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getUserYouTubeTokens(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    youtubeAccessToken: users.youtubeAccessToken,
    youtubeRefreshToken: users.youtubeRefreshToken,
    youtubeTokenExpiry: users.youtubeTokenExpiry,
    youtubeChannelId: users.youtubeChannelId,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!result[0]?.youtubeRefreshToken) return null;
  return result[0];
}

export async function resetJobStages(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pipelineStages)
    .set({
      status: "pending",
      progressPercent: 0,
      outputFileId: null,
      metadata: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(pipelineStages.jobId, jobId));
}

export async function getBatchJobById(batchJobId: number, userId: number): Promise<BatchJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(batchJobs)
    .where(eq(batchJobs.id, batchJobId))
    .limit(1);

  if (!result[0] || result[0].userId !== userId) return undefined;
  return result[0];
}
