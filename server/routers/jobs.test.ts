import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobsRouter } from "./jobs";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock the database module
vi.mock("../db", () => ({
  createPipelineJob: vi.fn(async (data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getPipelineJobById: vi.fn(async (id, userId) => ({
    id,
    userId,
    jobName: "Test Job",
    status: "queued",
    currentStage: "silence_removal",
    inputFileId: 1,
    outputFileId: null,
    youtubeVideoId: null,
    youtubeVideoUrl: null,
    errorMessage: null,
    errorStage: null,
    silenceThresholdDb: "-35",
    silenceMinDurationSec: "0.4",
    silencePaddingSec: "0.1",
    captionFontName: "Arial",
    captionFontSize: 18,
    captionFontColor: "#FFFFFF",
    captionOutlineColor: "#000000",
    captionAlignment: "bottom",
    brollMaxPerMinute: 3,
    brollMinScore: "0.6",
    exportAspectRatio: "9:16",
    exportCropMode: "center",
    exportQuality: "high",
    youtubeUploadEnabled: false,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getUserPipelineJobs: vi.fn(async () => []),
  updatePipelineJobStatus: vi.fn(async () => {}),
  getVideoFileById: vi.fn(async (id, userId) => ({
    id,
    userId,
    filename: "test-video.mp4",
    fileKey: "test-key",
    url: "/storage/test-key",
    mimeType: "video/mp4",
    fileSizeBytes: 1000000,
    durationSeconds: "60",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  createPipelineStage: vi.fn(async (data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getJobStages: vi.fn(async () => []),
}));

function createTestContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("jobsRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("creates a new pipeline job", async () => {
    const caller = jobsRouter.createCaller(ctx);
    const result = await caller.create({
      inputFileId: 1,
      jobName: "Test Job",
      config: {
        silenceThresholdDb: -35,
        silenceMinDurationSec: 0.4,
        silencePaddingSec: 0.1,
        captionFontName: "Arial",
        captionFontSize: 18,
        captionFontColor: "#FFFFFF",
        captionOutlineColor: "#000000",
        captionAlignment: "bottom",
        brollMaxPerMinute: 3,
        brollMinScore: 0.6,
        exportAspectRatio: "9:16",
        exportCropMode: "center",
        exportQuality: "high",
        youtubeUploadEnabled: false,
      },
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.jobName).toBe("Test Job");
    expect(result.status).toBe("queued");
  });

  it("lists all jobs for user", async () => {
    const caller = jobsRouter.createCaller(ctx);
    const result = await caller.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets a specific job by ID", async () => {
    const caller = jobsRouter.createCaller(ctx);
    const result = await caller.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.jobName).toBe("Test Job");
  });

  it("gets stages for a job", async () => {
    const caller = jobsRouter.createCaller(ctx);
    const result = await caller.getStages({ jobId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("cancels a queued job", async () => {
    const caller = jobsRouter.createCaller(ctx);
    const result = await caller.cancel({ id: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
