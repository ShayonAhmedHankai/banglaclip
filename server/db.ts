import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Video file queries
 */
export async function createVideoFile(data: InsertVideoFile): Promise<VideoFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoFiles).values(data);
  const files = await db.select().from(videoFiles).where(eq(videoFiles.id, result[0].insertId as number)).limit(1);
  return files[0]!;
}

export async function getUserVideoFiles(userId: number): Promise<VideoFile[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(videoFiles).where(eq(videoFiles.userId, userId));
}

export async function getVideoFileById(id: number, userId?: number): Promise<VideoFile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const query = db.select().from(videoFiles).where(eq(videoFiles.id, id));
  const results = await query.limit(1);
  
  if (results.length === 0) return undefined;
  if (userId && results[0].userId !== userId) return undefined;
  
  return results[0];
}

/**
 * Pipeline job queries
 */
export async function createPipelineJob(data: InsertPipelineJob): Promise<PipelineJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pipelineJobs).values(data);
  const jobs = await db.select().from(pipelineJobs).where(eq(pipelineJobs.id, result[0].insertId as number)).limit(1);
  return jobs[0]!;
}

export async function getPipelineJobById(id: number, userId?: number): Promise<PipelineJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const query = db.select().from(pipelineJobs).where(eq(pipelineJobs.id, id));
  const results = await query.limit(1);
  
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
    .set({
      status,
      updatedAt: new Date(),
      ...updates,
    })
    .where(eq(pipelineJobs.id, jobId));
}

/**
 * Pipeline stage queries
 */
export async function createPipelineStage(data: InsertPipelineStage): Promise<PipelineStage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pipelineStages).values(data);
  const stages = await db.select().from(pipelineStages).where(eq(pipelineStages.id, result[0].insertId as number)).limit(1);
  return stages[0]!;
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
    .set({
      status,
      updatedAt: new Date(),
      ...updates,
    })
    .where(eq(pipelineStages.id, stageId));
}

/**
 * Batch job queries
 */
export async function createBatchJob(data: InsertBatchJob): Promise<BatchJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(batchJobs).values(data);
  const jobs = await db.select().from(batchJobs).where(eq(batchJobs.id, result[0].insertId as number)).limit(1);
  return jobs[0]!;
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
    .set({
      status,
      updatedAt: new Date(),
      ...updates,
    })
    .where(eq(batchJobs.id, batchJobId));
}
