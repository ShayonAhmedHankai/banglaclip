import { serial, pgTable, text, timestamp, varchar, json, boolean, decimal, pgEnum, integer, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role_enum", ["user", "admin"]);
export const jobStatusEnum = pgEnum("job_status_enum", ["queued", "processing", "done", "failed"]);
export const stageEnum = pgEnum("stage_enum", ["silence_removal", "caption_generation", "broll_overlay", "export", "youtube_upload"]);
export const captionAlignmentEnum = pgEnum("caption_alignment_enum", ["top", "center", "bottom"]);
export const cropModeEnum = pgEnum("crop_mode_enum", ["center", "top", "bottom"]);
export const exportQualityEnum = pgEnum("export_quality_enum", ["low", "medium", "high"]);
export const stageStatusEnum = pgEnum("stage_status_enum", ["pending", "processing", "completed", "failed"]);
export const batchStatusEnum = pgEnum("batch_status_enum", ["scheduled", "processing", "completed", "failed"]);

/**
 * Core user table backing Firebase auth.
 * firebaseUid is the uid from Firebase Authentication.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: varchar("firebaseUid", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
  // YouTube OAuth tokens (stored per-user after OAuth flow)
  youtubeAccessToken: text("youtubeAccessToken"),
  youtubeRefreshToken: text("youtubeRefreshToken"),
  youtubeTokenExpiry: timestamp("youtubeTokenExpiry", { withTimezone: true }),
  youtubeChannelId: varchar("youtubeChannelId", { length: 64 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Video files uploaded by users.
 */
export const videoFiles = pgTable("video_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).default("video/mp4"),
  fileSizeBytes: integer("file_size_bytes"),
  durationSeconds: decimal("duration_seconds", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type VideoFile = typeof videoFiles.$inferSelect;
export type InsertVideoFile = typeof videoFiles.$inferInsert;

/**
 * Pipeline job configurations and status tracking.
 */
export const pipelineJobs = pgTable("pipeline_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  inputFileId: integer("input_file_id").notNull(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  status: jobStatusEnum("status").default("queued").notNull(),
  currentStage: stageEnum("current_stage").default("silence_removal"),

  silenceThresholdDb: decimal("silence_threshold_db", { precision: 5, scale: 2 }).default("-35"),
  silenceMinDurationSec: decimal("silence_min_duration_sec", { precision: 5, scale: 2 }).default("0.4"),
  silencePaddingSec: decimal("silence_padding_sec", { precision: 5, scale: 2 }).default("0.1"),

  captionFontName: varchar("caption_font_name", { length: 64 }).default("Arial"),
  captionFontSize: integer("caption_font_size").default(18),
  captionFontColor: varchar("caption_font_color", { length: 7 }).default("#FFFFFF"),
  captionOutlineColor: varchar("caption_outline_color", { length: 7 }).default("#000000"),
  captionAlignment: captionAlignmentEnum("caption_alignment").default("bottom"),

  brollMaxPerMinute: integer("broll_max_per_minute").default(3),
  brollMinScore: decimal("broll_min_score", { precision: 3, scale: 2 }).default("0.6"),

  exportAspectRatio: varchar("export_aspect_ratio", { length: 10 }).default("9:16"),
  exportCropMode: cropModeEnum("export_crop_mode").default("center"),
  exportQuality: exportQualityEnum("export_quality").default("high"),

  youtubeUploadEnabled: boolean("youtube_upload_enabled").default(false),
  youtubeVideoId: varchar("youtube_video_id", { length: 255 }),
  youtubeVideoUrl: text("youtube_video_url"),

  outputFileId: integer("output_file_id"),

  errorMessage: text("error_message"),
  errorStage: varchar("error_stage", { length: 64 }),

  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PipelineJob = typeof pipelineJobs.$inferSelect;
export type InsertPipelineJob = typeof pipelineJobs.$inferInsert;

/**
 * Individual pipeline stage execution records.
 */
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  stageName: stageEnum("stage_name").notNull(),
  status: stageStatusEnum("status").default("pending").notNull(),
  progressPercent: integer("progress_percent").default(0),

  outputFileId: integer("output_file_id"),

  metadata: json("metadata"),
  errorMessage: text("error_message"),

  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

/**
 * Batch processing jobs.
 */
export const batchJobs = pgTable("batch_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  batchName: varchar("batch_name", { length: 255 }).notNull(),
  status: batchStatusEnum("status").default("scheduled").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  processedJobCount: integer("processed_job_count").default(0),
  totalJobCount: integer("total_job_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * Batch job items.
 */
export const batchJobItems = pgTable("batch_job_items", {
  id: serial("id").primaryKey(),
  batchJobId: integer("batch_job_id").notNull(),
  pipelineJobId: integer("pipeline_job_id").notNull(),
  sequenceOrder: integer("sequence_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BatchJobItem = typeof batchJobItems.$inferSelect;
export type InsertBatchJobItem = typeof batchJobItems.$inferInsert;

export const userRelations = relations(users, ({ many }) => ({
  videoFiles: many(videoFiles),
  pipelineJobs: many(pipelineJobs),
  batchJobs: many(batchJobs),
}));

export const videoFileRelations = relations(videoFiles, ({ one, many }) => ({
  user: one(users, { fields: [videoFiles.userId], references: [users.id] }),
  pipelineJobs: many(pipelineJobs),
}));

export const pipelineJobRelations = relations(pipelineJobs, ({ one, many }) => ({
  user: one(users, { fields: [pipelineJobs.userId], references: [users.id] }),
  inputFile: one(videoFiles, { fields: [pipelineJobs.inputFileId], references: [videoFiles.id] }),
  outputFile: one(videoFiles, { fields: [pipelineJobs.outputFileId], references: [videoFiles.id] }),
  stages: many(pipelineStages),
}));

export const pipelineStageRelations = relations(pipelineStages, ({ one }) => ({
  job: one(pipelineJobs, { fields: [pipelineStages.jobId], references: [pipelineJobs.id] }),
  outputFile: one(videoFiles, { fields: [pipelineStages.outputFileId], references: [videoFiles.id] }),
}));

export const batchJobRelations = relations(batchJobs, ({ one, many }) => ({
  user: one(users, { fields: [batchJobs.userId], references: [users.id] }),
  items: many(batchJobItems),
}));

export const batchJobItemRelations = relations(batchJobItems, ({ one }) => ({
  batchJob: one(batchJobs, { fields: [batchJobItems.batchJobId], references: [batchJobs.id] }),
  pipelineJob: one(pipelineJobs, { fields: [batchJobItems.pipelineJobId], references: [pipelineJobs.id] }),
}));
