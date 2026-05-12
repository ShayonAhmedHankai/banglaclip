import { describe, it, expect, vi, beforeEach } from "vitest";
import { pipelineRouter } from "./pipeline";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock the database and executor modules
vi.mock("../db", () => ({
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
  updatePipelineJobStatus: vi.fn(async () => {}),
}));

vi.mock("../pipeline/executor", () => ({
  queueJobForProcessing: vi.fn(async () => {}),
}));

function createTestContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
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

describe("pipelineRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("starts a queued job", async () => {
    const caller = pipelineRouter.createCaller(ctx);
    const result = await caller.startJob({ jobId: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.jobId).toBe(1);
  });

  it("gets job execution status", async () => {
    const caller = pipelineRouter.createCaller(ctx);
    const result = await caller.getStatus({ jobId: 1 });

    expect(result).toBeDefined();
    expect(result.jobId).toBe(1);
    expect(result.status).toBe("queued");
    expect(result.currentStage).toBe("silence_removal");
  });

  it("retries a failed job", async () => {
    const caller = pipelineRouter.createCaller(ctx);
    
    // Mock a failed job
    vi.mocked((await import("../db")).getPipelineJobById).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      jobName: "Failed Job",
      status: "failed",
      currentStage: "silence_removal",
      inputFileId: 1,
      outputFileId: null,
      youtubeVideoId: null,
      youtubeVideoUrl: null,
      errorMessage: "Test error",
      errorStage: "silence_removal",
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
    } as any);

    const result = await caller.retryJob({ jobId: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.jobId).toBe(1);
  });
});
