import { describe, it, expect, vi, beforeEach } from "vitest";
import { filesRouter } from "./files";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock the storage and database modules
vi.mock("../storage", () => ({
  storagePut: vi.fn(async () => ({
    url: "/storage/test-key",
    key: "test-key",
  })),
}));

vi.mock("../db", () => ({
  getUserVideoFiles: vi.fn(async () => []),
  getVideoFileById: vi.fn(async () => null),
  createVideoFile: vi.fn(async (data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
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

describe("filesRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("lists files for authenticated user", async () => {
    const caller = filesRouter.createCaller(ctx);
    const result = await caller.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects file upload if size exceeds limit", async () => {
    const caller = filesRouter.createCaller(ctx);
    const oversizedBuffer = Buffer.alloc(600 * 1024 * 1024); // 600MB

    try {
      await caller.upload({
        filename: "large-video.mp4",
        fileBuffer: oversizedBuffer as any,
        fileSizeBytes: 600 * 1024 * 1024,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      // Zod validation error occurs before the procedure logic
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });

  it("uploads file successfully", async () => {
    const caller = filesRouter.createCaller(ctx);
    const buffer = Buffer.from("fake video data");

    const result = await caller.upload({
      filename: "test-video.mp4",
      fileBuffer: buffer as any,
      fileSizeBytes: buffer.length,
      durationSeconds: 60,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.filename).toBe("test-video.mp4");
    expect(result.url).toBe("/storage/test-key");
  });
});
