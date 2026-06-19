# Changelog

All notable changes to BanglaClip are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [SemVer](https://semver.org/).

---

## [v1.3.0] — 2026-06-19

### Added
- Real download button — generates signed S3 URL, triggers browser download
- Job retry — properly resets all pipeline stages back to `pending` (not just job status)
- SSE real-time progress — `/api/jobs/:jobId/progress` endpoint replaces 3s polling
- YouTube OAuth — full Google OAuth flow, real YouTube Data API v3 resumable upload
- B-Roll overlay — Pexels API integration with LLM keyword extraction from Bengali transcript
- Transcript editor — view and edit Whisper SRT captions in JobDetail before export
- Auto-thumbnail — FFmpeg frame extraction from output video, displayed in JobDetail
- `CONTRIBUTING.md` — branch rules, commit conventions, release process
- `.env.example` — full environment variable reference

### Changed
- Export stage now uses b-roll output when available, falls back to silence_removal
- YouTube page shows real Connect/Disconnect OAuth UI with account status
- Polling interval on job/stage queries bumped to 10s (SSE handles live updates)
- README updated with honest pipeline status and Forge API documentation

### Fixed
- Retry mutation no longer leaves stale stage data from previous run
- Download button no longer shows a toast error placeholder

---

## [v1.2.0] — 2026-06-01

### Added
- Batch processing UI and backend
- YouTube upload page (stubbed flow)
- Notification system (client-side, localStorage-backed)
- Dashboard live polling for active jobs
- Job detail page with pipeline stage stepper

### Fixed
- Sidebar navigation — all 5 routes now distinct
- Worker double-set bug — executor owns all status transitions
- Job status values standardized (`done` for jobs, `completed` for stages)

---

## [v1.0.0] — 2026-05-31

### Added
- Full pipeline: silence removal → Bengali captions → B-roll (stubbed) → 9:16 export
- Firebase Authentication (Google sign-in + email/password)
- AWS S3 storage via Forge presigned URLs
- PostgreSQL + Drizzle ORM schema
- tRPC API layer
- React + Vite frontend with dark UI

---

## [v0.2.0] — 2026-05-31

### Added
- Firebase Auth integration replacing legacy OAuth
- PostgreSQL migration from MySQL
- Bengali caption generation via Whisper API
- Silence removal with configurable threshold/padding
- FFmpeg export pipeline (9:16 crop, subtitle burn)

---

## [v0.1.0] — Initial

- Project scaffolded on Replit
- Basic Express + React setup
- Initial DB schema
