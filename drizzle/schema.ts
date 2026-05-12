import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Video files uploaded by users.
 * Stores metadata and S3 references for raw video uploads.
 */
export const videoFiles = mysqlTable("video_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).default("video/mp4"),
  fileSizeBytes: int("file_size_bytes"),
  durationSeconds: decimal("duration_seconds", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoFile = typeof videoFiles.$inferSelect;
export type InsertVideoFile = typeof videoFiles.$inferInsert;

/**
 * Pipeline job configurations and status tracking.
 * Represents a single video processing run through the full pipeline.
 */
export const pipelineJobs = mysqlTable("pipeline_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  inputFileId: int("input_file_id").notNull(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "done", "failed"]).default("queued").notNull(),
  currentStage: mysqlEnum("current_stage", ["silence_removal", "caption_generation", "broll_overlay", "export", "youtube_upload"]).default("silence_removal"),
  
  // Configuration
  silenceThresholdDb: decimal("silence_threshold_db", { precision: 5, scale: 2 }).default("-35"),
  silenceMinDurationSec: decimal("silence_min_duration_sec", { precision: 5, scale: 2 }).default("0.4"),
  silencePaddingSec: decimal("silence_padding_sec", { precision: 5, scale: 2 }).default("0.1"),
  
  captionFontName: varchar("caption_font_name", { length: 64 }).default("Arial"),
  captionFontSize: int("caption_font_size").default(18),
  captionFontColor: varchar("caption_font_color", { length: 7 }).default("#FFFFFF"),
  captionOutlineColor: varchar("caption_outline_color", { length: 7 }).default("#000000"),
  captionAlignment: mysqlEnum("caption_alignment", ["top", "center", "bottom"]).default("bottom"),
  
  brollMaxPerMinute: int("broll_max_per_minute").default(3),
  brollMinScore: decimal("broll_min_score", { precision: 3, scale: 2 }).default("0.6"),
  
  exportAspectRatio: varchar("export_aspect_ratio", { length: 10 }).default("9:16"),
  exportCropMode: mysqlEnum("export_crop_mode", ["center", "top", "bottom"]).default("center"),
  exportQuality: mysqlEnum("export_quality", ["low", "medium", "high"]).default("high"),
  
  youtubeUploadEnabled: boolean("youtube_upload_enabled").default(false),
  youtubeVideoId: varchar("youtube_video_id", { length: 255 }),
  youtubeVideoUrl: text("youtube_video_url"),
  
  // Output files
  outputFileId: int("output_file_id"),
  
  // Error tracking
  errorMessage: text("error_message"),
  errorStage: varchar("error_stage", { length: 64 }),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PipelineJob = typeof pipelineJobs.$inferSelect;
export type InsertPipelineJob = typeof pipelineJobs.$inferInsert;

/**
 * Individual pipeline stage execution records.
 * Tracks progress and output for each stage within a job.
 */
export const pipelineStages = mysqlTable("pipeline_stages", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull(),
  stageName: mysqlEnum("stage_name", ["silence_removal", "caption_generation", "broll_overlay", "export", "youtube_upload"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progressPercent: int("progress_percent").default(0),
  
  // Output file for this stage
  outputFileId: int("output_file_id"),
  
  // Metadata
  metadata: json("metadata"),
  errorMessage: text("error_message"),
  
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

/**
 * Batch processing jobs for scheduled/overnight runs.
 */
export const batchJobs = mysqlTable("batch_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  batchName: varchar("batch_name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["scheduled", "processing", "completed", "failed"]).default("scheduled").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  processedJobCount: int("processed_job_count").default(0),
  totalJobCount: int("total_job_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * Batch job items - individual pipeline jobs within a batch.
 */
export const batchJobItems = mysqlTable("batch_job_items", {
  id: int("id").autoincrement().primaryKey(),
  batchJobId: int("batch_job_id").notNull(),
  pipelineJobId: int("pipeline_job_id").notNull(),
  sequenceOrder: int("sequence_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BatchJobItem = typeof batchJobItems.$inferSelect;
export type InsertBatchJobItem = typeof batchJobItems.$inferInsert;

/**
 * Relations for type safety and query convenience.
 */
export const userRelations = relations(users, ({ many }) => ({
  videoFiles: many(videoFiles),
  pipelineJobs: many(pipelineJobs),
  batchJobs: many(batchJobs),
}));

export const videoFileRelations = relations(videoFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [videoFiles.userId],
    references: [users.id],
  }),
  pipelineJobs: many(pipelineJobs),
}));

export const pipelineJobRelations = relations(pipelineJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [pipelineJobs.userId],
    references: [users.id],
  }),
  inputFile: one(videoFiles, {
    fields: [pipelineJobs.inputFileId],
    references: [videoFiles.id],
  }),
  outputFile: one(videoFiles, {
    fields: [pipelineJobs.outputFileId],
    references: [videoFiles.id],
  }),
  stages: many(pipelineStages),
}));

export const pipelineStageRelations = relations(pipelineStages, ({ one }) => ({
  job: one(pipelineJobs, {
    fields: [pipelineStages.jobId],
    references: [pipelineJobs.id],
  }),
  outputFile: one(videoFiles, {
    fields: [pipelineStages.outputFileId],
    references: [videoFiles.id],
  }),
}));

export const batchJobRelations = relations(batchJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [batchJobs.userId],
    references: [users.id],
  }),
  items: many(batchJobItems),
}));

export const batchJobItemRelations = relations(batchJobItems, ({ one }) => ({
  batchJob: one(batchJobs, {
    fields: [batchJobItems.batchJobId],
    references: [batchJobs.id],
  }),
  pipelineJob: one(pipelineJobs, {
    fields: [batchJobItems.pipelineJobId],
    references: [pipelineJobs.id],
  }),
}));