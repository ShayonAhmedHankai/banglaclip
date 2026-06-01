---
name: Worker status double-set
description: Why worker.ts must NOT manually set job status before calling executePipelineJob.
---

## Rule
`server/worker.ts` must call `executePipelineJob(job.id)` directly without first calling `updatePipelineJobStatus(..., "processing")`.

**Why:** `executePipelineJob` in `server/pipeline/executor.ts` owns all status transitions — it sets status to `"processing"` with `startedAt`, handles stage updates, and sets final `"done"` or `"failed"`. If the worker pre-sets `"processing"`, a crash between the worker's set and the executor's set leaves the job stuck (no `startedAt`, no `completedAt`). Additionally, `queueJobForProcessing` checks `job.status !== "queued"` and would throw if called after the worker already changed status.

**How to apply:** Keep the worker's job only to: find queued jobs → call `executePipelineJob(id).catch(...)`. No status mutations in the worker itself.
