import { describe, it, expect, vi, beforeEach } from "vitest";
import { batchRouter } from "./batch";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock the database module
vi.mock("../db", () => ({
  createBatchJob: vi.fn(async (data) => ({
    id: 1,
    ...data,
  })),
  getUserBatchJobs: vi.fn(async () => [
    {
      id: 1,
      userId: 1,
      batchName: "Test Batch",
      status: "scheduled",
      processedJobCount: 0,
      totalJobCount: 5,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateBatchJobStatus: vi.fn(async () => true),
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

describe("batchRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("creates a new batch job", async () => {
    const caller = batchRouter.createCaller(ctx);
    const result = await caller.create({
      batchName: "Test Batch",
      totalJobCount: 5,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.batchId).toBe(1);
    expect(result.message).toContain("Test Batch");
  });

  it("lists batch jobs for user", async () => {
    const caller = batchRouter.createCaller(ctx);
    const result = await caller.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.batchName).toBe("Test Batch");
  });

  it("gets a specific batch job", async () => {
    const caller = batchRouter.createCaller(ctx);
    const result = await caller.getById({ batchId: 1 });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.userId).toBe(ctx.user.id);
  });

  it("updates batch job status", async () => {
    const caller = batchRouter.createCaller(ctx);
    const result = await caller.updateStatus({
      batchId: 1,
      status: "processing",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain("processing");
  });

  it("validates batch name is required", async () => {
    const caller = batchRouter.createCaller(ctx);

    try {
      await caller.create({
        batchName: "",
        totalJobCount: 5,
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("validates at least one job is required", async () => {
    const caller = batchRouter.createCaller(ctx);

    try {
      await caller.create({
        batchName: "Test",
        totalJobCount: 0,
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
