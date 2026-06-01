import { getDb } from "./db";
import { executePipelineJob } from "./pipeline/executor";
import { eq } from "drizzle-orm";
import { pipelineJobs } from "../drizzle/schema";

const POLL_INTERVAL_MS = 10000; // 10 seconds
let isRunning = false;

/**
 * Poll the database for queued jobs and process them one at a time.
 */
async function pollAndProcessJobs() {
  if (isRunning) return;
  isRunning = true;

  try {
    const db = await getDb();
    if (!db) {
      console.log("[Worker] DB not available, skipping poll");
      return;
    }

    // Find the oldest queued job
    const pendingJobs = await db
      .select()
      .from(pipelineJobs)
      .where(eq(pipelineJobs.status, "queued"))
      .limit(1);

    if (pendingJobs.length === 0) {
      return;
    }

    const job = pendingJobs[0];
    console.log(`[Worker] Picked up queued job ${job.id}: "${job.jobName}"`);

    // Fire-and-forget — executePipelineJob owns all status transitions
    executePipelineJob(job.id).catch((err: Error) => {
      console.error(`[Worker] Job ${job.id} failed:`, err?.message ?? err);
    });
  } catch (error) {
    console.error("[Worker] Poll error:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the background job worker.
 * Logs confirmation so server startup can be verified.
 */
export function startWorker() {
  console.log("[Worker] Job worker started — polling every", POLL_INTERVAL_MS / 1000, "seconds");
  pollAndProcessJobs(); // Check immediately on boot
  setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
}

/**
 * Graceful shutdown hook (no-op for now).
 */
export function stopWorker() {
  console.log("[Worker] Stopping...");
}
