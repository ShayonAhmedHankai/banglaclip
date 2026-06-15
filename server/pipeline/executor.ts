import {
  getPipelineJobById,
  updatePipelineJobStatus,
  getJobStages,
  updatePipelineStageStatus,
} from "../db";
import { broadcastJobUpdate } from "../sse";
import { runSilenceRemoval } from "./silenceRemoval";
import { runCaptionGeneration } from "./captionGeneration";
import { runExport } from "./exportStage";
import { runBrollOverlay } from "./brollOverlay";
import type { PipelineJob } from "../../drizzle/schema";

export type PipelineStage = "silence_removal" | "caption_generation" | "broll_overlay" | "export" | "youtube_upload";

/**
 * Execute a complete pipeline job
 * Processes video through all stages sequentially
 */
export async function executePipelineJob(jobId: number): Promise<void> {
  try {
    const job = await getPipelineJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    await updatePipelineJobStatus(jobId, "processing", { startedAt: new Date() });

    const stages = await getJobStages(jobId);
    const stageOrder: PipelineStage[] = [
      "silence_removal",
      "caption_generation",
      "broll_overlay",
      "export",
      "youtube_upload",
    ];

    for (const stageName of stageOrder) {
      const stage = stages.find(s => s.stageName === stageName);
      if (!stage) continue;

      try {
        await updatePipelineStageStatus(stage.id, "processing", { startedAt: new Date() });
        await updatePipelineJobStatus(jobId, "processing", { currentStage: stageName });
        broadcastJobUpdate(jobId, { type: "stage", data: { stageName, status: "processing", progressPercent: 0 } });

        // Re-fetch job so each stage sees up-to-date config/outputFileId
        const freshJob = await getPipelineJobById(jobId);
        if (!freshJob) throw new Error(`Job ${jobId} disappeared during execution`);

        await executeStage(jobId, stageName, stage.id, freshJob);

        await updatePipelineStageStatus(stage.id, "completed", {
          completedAt: new Date(),
          progressPercent: 100,
        });
        broadcastJobUpdate(jobId, { type: "stage", data: { stageName, status: "completed", progressPercent: 100 } });
      } catch (error) {
        console.error(`[Pipeline] Stage ${stageName} failed:`, error);

        await updatePipelineStageStatus(stage.id, "failed", {
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        await updatePipelineJobStatus(jobId, "failed", {
          errorMessage: error instanceof Error ? error.message : "Pipeline execution failed",
          errorStage: stageName,
          completedAt: new Date(),
        });

        broadcastJobUpdate(jobId, { type: "done", data: { status: "failed", errorStage: stageName } });
        throw error;
      }
    }

    await updatePipelineJobStatus(jobId, "done", { completedAt: new Date() });
    broadcastJobUpdate(jobId, { type: "done", data: { status: "done" } });
    console.log(`[Pipeline] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Pipeline] Job ${jobId} execution failed:`, error);
    throw error;
  }
}

/**
 * Dispatch a stage to its real implementation (or simulate for unimplemented stages)
 */
async function executeStage(
  jobId: number,
  stageName: PipelineStage,
  stageId: number,
  job: PipelineJob,
): Promise<void> {
  switch (stageName) {
    case "silence_removal":
      return runSilenceRemoval(jobId, stageId, job);

    case "caption_generation":
      return runCaptionGeneration(jobId, stageId, job);

    case "export":
      return runExport(jobId, stageId, job);

    case "broll_overlay":
      return runBrollOverlay(jobId, stageId, job);

    case "youtube_upload":
      // Auto-upload handled via explicit user action on YouTube page
      await simulateStage(jobId, stageName, stageId);
      break;

    default:
      console.warn(`[Pipeline] Unknown stage: ${stageName}`);
  }
}

/**
 * Simulate a stage with timed progress updates (placeholder for unimplemented stages)
 */
async function simulateStage(
  jobId: number,
  stageName: PipelineStage,
  stageId: number,
): Promise<void> {
  for (const progress of [25, 50, 75]) {
    await new Promise(resolve => setTimeout(resolve, 300));
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: progress });
  }
  console.log(`[Pipeline] Stage ${stageName} for job ${jobId} simulated`);
}

/**
 * Queue a job for processing.
 * In production this would push to a message queue; for now runs inline.
 */
export async function queueJobForProcessing(jobId: number): Promise<void> {
  const job = await getPipelineJobById(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status !== "queued") throw new Error(`Job ${jobId} is not in queued status`);

  // Fire-and-forget so the tRPC mutation returns immediately
  executePipelineJob(jobId).catch(err =>
    console.error(`[Pipeline] Background execution failed for job ${jobId}:`, err),
  );
}
