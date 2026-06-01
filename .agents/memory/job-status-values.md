---
name: Job status values
description: Status string differences between pipeline jobs and pipeline stages — common source of badge/icon bugs.
---

## Rule
`pipelineJobs.status` uses: `"queued"` | `"processing"` | `"done"` | `"failed"`
`pipelineStages.status` uses: `"pending"` | `"processing"` | `"completed"` | `"failed"`

**Why:** The DB schema uses different enum values for the two tables. UI code that handles both (e.g. a shared `getStatusBadge()`) must handle both `"done"` and `"completed"` as the success state.

**How to apply:** In any component rendering job OR stage status, always switch on both `"done"` and `"completed"` for the green/success branch. A job with status `"done"` rendered through a function only checking `"completed"` will show gray instead of green.
