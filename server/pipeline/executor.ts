import {
  getPipelineJobById,
  updatePipelineJobStatus,
  getJobStages,
  updatePipelineStageStatus,
  getUserVideoFiles,
} from "../db";
import { TRPCError } from "@trpc/server";

export type PipelineStage = "silence_removal" | "caption_generation" | "broll_overlay" | "export" | "youtube_upload";

/**
 * Execute a complete pipeline job
 * Processes video through all stages sequentially
 */
export async function executePipelineJob(jobId: number): Promise<void> {
  try {
    const job = await getPipelineJobById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update job status to processing
    await updatePipelineJobStatus(jobId, "processing", {
      startedAt: new Date(),
    });

    // Get all stages for this job
    const stages = await getJobStages(jobId);
    const stageOrder: PipelineStage[] = [
      "silence_removal",
      "caption_generation",
      "broll_overlay",
      "export",
      "youtube_upload",
    ];

    // Execute each stage in order
    for (const stageName of stageOrder) {
      const stage = stages.find(s => s.stageName === stageName);
      if (!stage) continue; // Skip if stage not created for this job

      try {
        // Update stage status to processing
        await updatePipelineStageStatus(stage.id, "processing", {
          startedAt: new Date(),
        });

        // Update job current stage
        await updatePipelineJobStatus(jobId, "processing", {
          currentStage: stageName,
        });

        // Execute the stage
        await executeStage(jobId, stageName, job);

        // Mark stage as completed
        await updatePipelineStageStatus(stage.id, "completed", {
          completedAt: new Date(),
          progressPercent: 100,
        });
      } catch (error) {
        console.error(`[Pipeline] Stage ${stageName} failed:`, error);

        // Mark stage as failed
        await updatePipelineStageStatus(stage.id, "failed", {
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        // Mark job as failed
        await updatePipelineJobStatus(jobId, "failed", {
          errorMessage: error instanceof Error ? error.message : "Pipeline execution failed",
          errorStage: stageName,
          completedAt: new Date(),
        });

        throw error;
      }
    }

    // Mark job as completed
    await updatePipelineJobStatus(jobId, "done", {
      completedAt: new Date(),
    });

    console.log(`[Pipeline] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Pipeline] Job execution failed:`, error);
    throw error;
  }
}

/**
 * Execute a specific pipeline stage
 * This is a placeholder - actual implementation would call Python scripts or external services
 */
async function executeStage(
  jobId: number,
  stageName: PipelineStage,
  job: any
): Promise<void> {
  // Simulate stage execution with progress updates
  const progressSteps = [25, 50, 75, 100];

  for (const progress of progressSteps) {
    // In a real implementation, this would:
    // 1. Call the corresponding Python script (cut.py, caption.py, broll.py, export.py)
    // 2. Monitor progress and update database
    // 3. Handle errors and retry logic

    // For now, simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const stages = await getJobStages(jobId);
    const stage = stages.find(s => s.stageName === stageName);
    if (stage) {
      await updatePipelineStageStatus(stage.id, "processing", {
        progressPercent: progress,
      });
    }
  }

  console.log(`[Pipeline] Stage ${stageName} for job ${jobId} completed`);
}

/**
 * Queue a job for processing
 * In production, this would be called by a cron job or message queue
 */
export async function queueJobForProcessing(jobId: number): Promise<void> {
  const job = await getPipelineJobById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "queued") {
    throw new Error(`Job ${jobId} is not in queued status`);
  }

  // In production, this would push the job to a queue (Redis, RabbitMQ, etc.)
  // For now, execute immediately
  await executePipelineJob(jobId);
}
