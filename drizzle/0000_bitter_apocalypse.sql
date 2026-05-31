CREATE TYPE "public"."batch_status_enum" AS ENUM('scheduled', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."caption_alignment_enum" AS ENUM('top', 'center', 'bottom');--> statement-breakpoint
CREATE TYPE "public"."crop_mode_enum" AS ENUM('center', 'top', 'bottom');--> statement-breakpoint
CREATE TYPE "public"."export_quality_enum" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."job_status_enum" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."stage_enum" AS ENUM('silence_removal', 'caption_generation', 'broll_overlay', 'export', 'youtube_upload');--> statement-breakpoint
CREATE TYPE "public"."stage_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "batch_job_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_job_id" integer NOT NULL,
	"pipeline_job_id" integer NOT NULL,
	"sequence_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"batch_name" varchar(255) NOT NULL,
	"status" "batch_status_enum" DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"processed_job_count" integer DEFAULT 0,
	"total_job_count" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"input_file_id" integer NOT NULL,
	"job_name" varchar(255) NOT NULL,
	"status" "job_status_enum" DEFAULT 'queued' NOT NULL,
	"current_stage" "stage_enum" DEFAULT 'silence_removal',
	"silence_threshold_db" numeric(5, 2) DEFAULT '-35',
	"silence_min_duration_sec" numeric(5, 2) DEFAULT '0.4',
	"silence_padding_sec" numeric(5, 2) DEFAULT '0.1',
	"caption_font_name" varchar(64) DEFAULT 'Arial',
	"caption_font_size" integer DEFAULT 18,
	"caption_font_color" varchar(7) DEFAULT '#FFFFFF',
	"caption_outline_color" varchar(7) DEFAULT '#000000',
	"caption_alignment" "caption_alignment_enum" DEFAULT 'bottom',
	"broll_max_per_minute" integer DEFAULT 3,
	"broll_min_score" numeric(3, 2) DEFAULT '0.6',
	"export_aspect_ratio" varchar(10) DEFAULT '9:16',
	"export_crop_mode" "crop_mode_enum" DEFAULT 'center',
	"export_quality" "export_quality_enum" DEFAULT 'high',
	"youtube_upload_enabled" boolean DEFAULT false,
	"youtube_video_id" varchar(255),
	"youtube_video_url" text,
	"output_file_id" integer,
	"error_message" text,
	"error_stage" varchar(64),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"stage_name" "stage_enum" NOT NULL,
	"status" "stage_status_enum" DEFAULT 'pending' NOT NULL,
	"progress_percent" integer DEFAULT 0,
	"output_file_id" integer,
	"metadata" json,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"firebaseUid" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role_enum" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebaseUid_unique" UNIQUE("firebaseUid")
);
--> statement-breakpoint
CREATE TABLE "video_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_key" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(64) DEFAULT 'video/mp4',
	"file_size_bytes" integer,
	"duration_seconds" numeric(10, 2),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
