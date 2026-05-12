import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationsRouter } from "./notifications";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock the database and notification modules
vi.mock("../db", () => ({
  getPipelineJobById: vi.fn(async (id, userId) => ({
    id,
    userId,
    jobName: "Test Job",
    status: "done",
    currentStage: "export",
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
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
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

describe("notificationsRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("sends job completion notification", async () => {
    const caller = notificationsRouter.createCaller(ctx);
    const result = await caller.notifyJobCompletion({ jobId: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe("Notification sent");
  });

  it("sends batch status notification", async () => {
    const caller = notificationsRouter.createCaller(ctx);
    const result = await caller.notifyBatchStatus({
      batchName: "Test Batch",
      totalJobs: 10,
      completedJobs: 5,
      failedJobs: 0,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe("Notification sent");
  });

  it("sends YouTube upload notification", async () => {
    const caller = notificationsRouter.createCaller(ctx);
    const result = await caller.notifyYouTubeUpload({
      jobName: "Test Job",
      videoUrl: "https://youtube.com/watch?v=test",
      success: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe("Notification sent");
  });

  it("sends YouTube upload error notification", async () => {
    const caller = notificationsRouter.createCaller(ctx);
    const result = await caller.notifyYouTubeUpload({
      jobName: "Test Job",
      videoUrl: "",
      success: false,
      error: "Authentication failed",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
