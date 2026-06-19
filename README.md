# BanglaClip 🎬

> Automated Bengali video processing pipeline — silence removal, AI captions, b-roll overlay, 9:16 export, and YouTube upload.

---

## What it does

Upload a raw Bengali video. BanglaClip automatically:

1. **Removes silence** — detects and cuts dead air with configurable thresholds
2. **Generates Bengali captions** — Whisper AI transcribes audio to SRT subtitles
3. **Overlays B-Roll** — fetches relevant stock footage from Pexels and overlays it at timed positions
4. **Exports to 9:16** — crops and renders for YouTube Shorts / Instagram Reels / TikTok
5. **Uploads to YouTube** — real OAuth integration, uploads directly to your channel

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, TailwindCSS 4, tRPC client |
| Backend | Express, tRPC, Drizzle ORM |
| Database | PostgreSQL |
| Auth | Firebase Authentication (Google + email/password) |
| Storage | AWS S3 (via Forge presigned URLs) |
| AI | Whisper (Bengali transcription), LLM (keyword extraction, metadata) |
| Video | FFmpeg |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database
- Firebase project
- Forge API account (for storage + Whisper)

### Install

```bash
pnpm install
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/banglaclip

# Firebase (server)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
OWNER_FIREBASE_UID=your_firebase_uid

# Firebase (client — public)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Forge (storage + AI)
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=

# YouTube OAuth (optional)
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=https://yourdomain.com/api/youtube/callback

# B-Roll (optional — get free key at pexels.com/api)
PEXELS_API_KEY=
```

### Run (development)

```bash
pnpm dev
```

App starts at `http://localhost:5000`

### Database migration

```bash
pnpm db:push
```

### Build (production)

```bash
pnpm build
node dist/index.js
```

---

## Project Structure

```
banglaclip/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # Custom hooks (SSE, etc.)
│       ├── pages/          # Route pages
│       └── lib/            # Firebase, tRPC client
├── server/                 # Express backend
│   ├── _core/              # Server bootstrap, env, firebase, youtube
│   ├── pipeline/           # Video processing stages
│   │   ├── silenceRemoval.ts
│   │   ├── captionGeneration.ts
│   │   ├── brollOverlay.ts
│   │   └── exportStage.ts
│   └── routers/            # tRPC routers
├── drizzle/                # DB schema + migrations
└── shared/                 # Shared types
```

---

## Pipeline Status

| Stage | Description | Status | Notes |
|---|---|---|---|
| `silence_removal` | FFmpeg silencedetect → cut and stitch | ✅ Live | Stable, tested |
| `caption_generation` | Whisper AI → Bengali SRT | ✅ Live | Requires Forge API |
| `broll_overlay` | Pexels API + LLM keywords → overlay clips | ⚠️ Partial | Falls back if rate-limited or key missing |
| `export` | 9:16 crop + subtitle burn + quality encode | ✅ Live | FFmpeg-based |
| `youtube_upload` | OAuth + YouTube Data API v3 | 🔧 WIP | OAuth flow implemented but untested in prod |

### Status Legend
- ✅ **Live**: Production ready, fully tested.
- ⚠️ **Partial**: Functional but has known limitations or fallbacks.
- 🔧 **WIP**: In active development, not recommended for production use.
- ⏳ **Planned**: Designed but implementation hasn't started.

---

## Known Limitations & Requirements

### Forge API (Required)
BanglaClip uses a unified **Forge API** for core infrastructure:
- **Storage**: S3-compatible file storage via presigned URLs.
- **Transcription**: Whisper AI for high-accuracy Bengali voice-to-text.
- **Metadata**: LLM-powered keyword extraction and YouTube metadata generation.

*Note: You must have a valid `BUILT_IN_FORGE_API_KEY` for the application to function.*

### B-Roll Overlay
The B-Roll feature depends on the **Pexels API**.
- **Rate Limits**: The free tier is limited to 200 requests/hour.
- **Fallback**: If the API is unavailable, rate-limited, or the key is missing, the pipeline will skip this stage and export the video without B-roll overlays to avoid job failure.

### YouTube Upload
The YouTube integration requires a Google Cloud Project with the **YouTube Data API v3** enabled. Currently in "Work in Progress" status as we refine the OAuth consent flow and quota management.

---

## Branch Strategy

See [CONTRIBUTING.md](CONTRIBUTING.md) for full branch rules.

| Branch | Purpose |
|---|---|
| `main` | Stable, released versions only |
| `dev` | Integration branch — all work merges here first |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT
