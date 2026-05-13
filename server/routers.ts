import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { filesRouter } from "./routers/files";
import { jobsRouter } from "./routers/jobs";
import { pipelineRouter } from "./routers/pipeline";
import { youtubeRouter } from "./routers/youtube";
import { notificationsRouter } from "./routers/notifications";
import { batchRouter } from "./routers/batch";

export const appRouter = router({
  system: systemRouter,
  files: filesRouter,
  jobs: jobsRouter,
  pipeline: pipelineRouter,
  youtube: youtubeRouter,
  notifications: notificationsRouter,
  batch: batchRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
});

export type AppRouter = typeof appRouter;
