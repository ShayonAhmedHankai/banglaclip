# BanglaClip

A full-stack video processing application built with React + Vite (frontend) and Express + tRPC (backend), using MySQL via Drizzle ORM and Firebase Authentication.

## Architecture

- **Frontend**: React 19, Vite 7, TailwindCSS 4, tRPC client, wouter for routing
- **Backend**: Express, tRPC, Drizzle ORM with MySQL2
- **Auth**: Firebase Authentication (Google sign-in + email/password), verified server-side with Firebase Admin SDK
- **Storage**: AWS S3 (via Forge presigned URLs)

The backend serves the frontend in development via Vite middleware. Everything runs on a single port (5000).

## Development

```bash
pnpm dev
```

This starts the Express server with Vite middleware on port 5000.

## Required Environment Variables

### Server-side secrets
- `DATABASE_URL` — MySQL connection string
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Full Firebase service account JSON (from Firebase Console → Project Settings → Service Accounts → Generate new private key)
- `OWNER_FIREBASE_UID` — Firebase UID of the app owner (gets admin role). Find this in Firebase Console → Authentication → Users.
- `BUILT_IN_FORGE_API_URL` — Forge API base URL
- `BUILT_IN_FORGE_API_KEY` — Forge API key

### Client-side (VITE_ prefix, public)
- `VITE_FIREBASE_API_KEY` — Firebase web API key
- `VITE_FIREBASE_AUTH_DOMAIN` — e.g. `your-project.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` — e.g. `your-project.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` — Firebase web app ID

All `VITE_*` values are found in Firebase Console → Project Settings → Your apps → Web app → SDK setup.

## Auth Flow

1. Frontend initializes Firebase with `VITE_FIREBASE_*` config
2. User signs in via Google popup or email/password
3. Firebase issues an ID token; the frontend sends it as `Authorization: Bearer <token>` on every tRPC request
4. Backend verifies the token using Firebase Admin SDK (`FIREBASE_SERVICE_ACCOUNT_JSON`)
5. User is upserted into the MySQL `users` table using their Firebase `uid`

## Database

Uses MySQL via Drizzle ORM. Run migrations after schema changes:

```bash
pnpm db:push
```

The `users` table uses `firebaseUid` (Firebase UID) as the unique identifier instead of an OAuth openId.

## Build & Deploy

```bash
pnpm build   # Builds frontend to dist/public and bundles server to dist/
node dist/index.js  # Runs production server
```

## User Preferences

- Use pnpm as the package manager
- Port 5000 for the dev server
