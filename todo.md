# BanglaClip Project TODO

## Phase 1: Database Schema & Core Infrastructure
- [x] Design and implement database schema (jobs, pipeline_stages, files, users)
- [x] Create Drizzle schema with relationships and enums
- [x] Generate and apply database migrations via webdev_execute_sql
- [x] Set up database query helpers in server/db.ts

## Phase 2: Video Upload & File Storage
- [x] Implement video upload UI component with drag-and-drop
- [x] Integrate S3 file storage via storagePut helper
- [x] Create tRPC procedure for file upload with validation
- [x] Store file metadata in database (url, key, size, user_id)
- [ ] Add file deletion and cleanup logic

## Phase 3: Pipeline Job Management
- [x] Create job creation tRPC procedure
- [x] Implement job status tracking (queued, processing, done, failed)
- [x] Build per-stage progress tracking system
- [x] Create job retrieval procedures (user-scoped)
- [x] Add job configuration storage (dB threshold, padding, caption style, etc.)

## Phase 4: Dashboard UI - Core Layout
- [x] Design elegant dashboard layout with sidebar navigation
- [x] Create job list view with status indicators
- [ ] Implement real-time status updates via polling or WebSocket
- [x] Add per-stage progress visualization
- [ ] Create download links for intermediate and final outputs

## Phase 5: Pipeline Execution Backend
- [x] Create job orchestrator that runs stages sequentially
- [x] Implement job status transitions and progress tracking
- [x] Add error handling and retry logic for failed jobs
- [x] Create tRPC procedures for job control (start, retry, status)
- [ ] Integrate actual video processing scripts (cut.py, caption.py, broll.py, export.py)
- [ ] Implement Silence Removal stage (FFmpeg silencedetect integration)
- [ ] Implement Bengali Caption Generation stage (Whisper + SRT export)
- [ ] Implement B-Roll Overlay stage (LLM keyword extraction + Pexels API)
- [ ] Implement Export stage (subtitle burn + 9:16 crop + encoding)

## Phase 6: Job Configuration Panel
- [x] Design configuration UI for silence removal settings (dB threshold, padding)
- [x] Add caption style configuration (font, color, alignment)
- [x] Implement B-roll settings (max clips per minute, score threshold)
- [x] Create export settings (aspect ratio, crop mode, quality)
- [x] Create job configuration dialog with all settings
- [x] Store and retrieve job configurations from database

## Phase 7: Batch Processing & Scheduling
- [x] Create batch processing UI component
- [x] Design batch job scheduler interface
- [x] Implement batch job queue system in database (tRPC router)
- [x] Create batch job persistence with status tracking
- [x] Add batch job creation and listing procedures
- [ ] Create cron job scheduler for sequential processing
- [ ] Implement sequential job processing (not parallel)

## Phase 8: YouTube Integration
- [x] Create YouTube upload router with metadata generation
- [x] Implement LLM-based title/description generation
- [x] Create YouTube upload procedure
- [x] Store video ID and public URL in job record
- [ ] Set up YouTube Data API v3 authentication (requires user OAuth)
- [ ] Implement actual YouTube upload with credentials
- [ ] Add YouTube upload toggle and status in dashboard

## Phase 9: Owner Notifications
- [x] Implement job completion notifications via notifyOwner
- [x] Add job failure notifications with error details
- [x] Create notifications router with multiple notification types
- [x] Test notification delivery (4 tests passing)
- [ ] Create notification UI in dashboard
- [ ] Add real-time notification display

## Phase 10: UI Polish & Refinement
- [x] Refine color scheme and typography with gradient design
- [ ] Add smooth animations and transitions
- [ ] Implement loading states and skeletons
- [x] Add empty states for new users
- [x] Polish form interactions and validation feedback
- [x] Ensure responsive design across devices
- [ ] Add micro-interactions and visual feedback

## Phase 11: Testing & Quality Assurance
- [x] Write vitest tests for tRPC procedures (files, jobs, pipeline, notifications routers)
- [x] Test file upload and storage integration
- [x] Test pipeline job creation and status tracking
- [x] Test notifications router (4 tests passing)
- [ ] Test dashboard data fetching and real-time updates
- [ ] Test YouTube integration flow
- [ ] Test batch processing and cron scheduling
- [ ] Manual end-to-end testing

## Phase 12: Documentation & Deployment
- [ ] Update README with setup instructions
- [ ] Document configuration options
- [ ] Document API endpoints and procedures
- [ ] Create user guide for dashboard
- [ ] Prepare for production deployment
