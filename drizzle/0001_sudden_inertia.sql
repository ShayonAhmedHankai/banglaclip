CREATE TABLE `batch_job_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_job_id` int NOT NULL,
	`pipeline_job_id` int NOT NULL,
	`sequence_order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_job_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batch_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`batch_name` varchar(255) NOT NULL,
	`status` enum('scheduled','processing','completed','failed') NOT NULL DEFAULT 'scheduled',
	`scheduled_for` timestamp,
	`processed_job_count` int DEFAULT 0,
	`total_job_count` int DEFAULT 0,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`input_file_id` int NOT NULL,
	`job_name` varchar(255) NOT NULL,
	`status` enum('queued','processing','done','failed') NOT NULL DEFAULT 'queued',
	`current_stage` enum('silence_removal','caption_generation','broll_overlay','export','youtube_upload') DEFAULT 'silence_removal',
	`silence_threshold_db` decimal(5,2) DEFAULT '-35',
	`silence_min_duration_sec` decimal(5,2) DEFAULT '0.4',
	`silence_padding_sec` decimal(5,2) DEFAULT '0.1',
	`caption_font_name` varchar(64) DEFAULT 'Arial',
	`caption_font_size` int DEFAULT 18,
	`caption_font_color` varchar(7) DEFAULT '#FFFFFF',
	`caption_outline_color` varchar(7) DEFAULT '#000000',
	`caption_alignment` enum('top','center','bottom') DEFAULT 'bottom',
	`broll_max_per_minute` int DEFAULT 3,
	`broll_min_score` decimal(3,2) DEFAULT '0.6',
	`export_aspect_ratio` varchar(10) DEFAULT '9:16',
	`export_crop_mode` enum('center','top','bottom') DEFAULT 'center',
	`export_quality` enum('low','medium','high') DEFAULT 'high',
	`youtube_upload_enabled` boolean DEFAULT false,
	`youtube_video_id` varchar(255),
	`youtube_video_url` text,
	`output_file_id` int,
	`error_message` text,
	`error_stage` varchar(64),
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipeline_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`stage_name` enum('silence_removal','caption_generation','broll_overlay','export','youtube_upload') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress_percent` int DEFAULT 0,
	`output_file_id` int,
	`metadata` json,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipeline_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`mime_type` varchar(64) DEFAULT 'video/mp4',
	`file_size_bytes` int,
	`duration_seconds` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_files_id` PRIMARY KEY(`id`)
);
