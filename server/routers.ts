import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { filesRouter } from "./routers/files";
import { jobsRouter } from "./routers/jobs";
import { pipelineRouter } from "./routers/pipeline";
import { youtubeRouter } from "./routers/youtube";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  files: filesRouter,
  jobs: jobsRouter,
  pipeline: pipelineRouter,
  youtube: youtubeRouter,
  notifications: notificationsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),


});

export type AppRouter = typeof appRouter;
