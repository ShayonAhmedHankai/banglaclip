import { getDb, getPipelineJobById, updatePipelineJobStatus, createPipelineStage } from "./db";
import { executePipelineJob } from "./pipeline/executor";
import { eq } from "drizzle-orm";
import { pipelineJobs } from "../drizzle/schema";

const POLL_INTERVAL_MS = 10000; // 10 seconds
let isRunning = false;

/**
 * Poll the database for pending/queued jobs and process them.
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

    // Find queued jobs
    const pendingJobs = await db
      .select()
      .from(pipelineJobs)
      .where(eq(pipelineJobs.status, "queued"))
      .limit(1);

    if (pendingJobs.length === 0) {
      return;
    }

    const job = pendingJobs[0];
    console.log(`[Worker] Found queued job ${job.id}: ${job.jobName}`);

    // Ensure stages exist
    const existingStages = await db
      .select()
      .from(pipelineJobs)
      .where(eq(pipelineJobs.id, job.id));

    // Run the pipeline
    await updatePipelineJobStatus(job.id, "processing", { startedAt: new Date() });
    console.log(`[Worker] Starting job ${job.id}`);

    executePipelineJob(job.id).catch(err => {
      console.error(`[Worker] Job ${job.id} failed:`, err);
    });

  } catch (error) {
    console.error("[Worker] Poll error:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the background worker.
 */
export function startWorker() {
  console.log("[Worker] Starting background job worker...");
  pollAndProcessJobs(); // Initial check
  setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
  console.log(`[Worker] Polling every ${POLL_INTERVAL_MS}ms`);
}

/**
 * Stop the background worker.
 */
export function stopWorker() {
  console.log("[Worker] Stopping...");
}
