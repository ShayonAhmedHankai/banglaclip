# BanglaClip

A full-stack video processing application built with React + Vite (frontend) and Express + tRPC (backend), using MySQL via Drizzle ORM.

## Architecture

- **Frontend**: React 19, Vite 7, TailwindCSS 4, tRPC client, wouter for routing
- **Backend**: Express, tRPC, Drizzle ORM with MySQL2
- **Auth**: OAuth-based authentication with JWT session cookies
- **Storage**: AWS S3 (via presigned URLs)

The backend serves the frontend in development via Vite middleware. Everything runs on a single port (5000).

## Development

```bash
pnpm dev
```

This starts the Express server with Vite middleware on port 5000.

## Required Environment Variables

### Server-side
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — Secret for signing session tokens
- `OAUTH_SERVER_URL` — OAuth server base URL
- `VITE_APP_ID` — App/client ID for OAuth
- `OWNER_OPEN_ID` — OpenID of the app owner (gets admin role)
- `BUILT_IN_FORGE_API_URL` — Forge API base URL
- `BUILT_IN_FORGE_API_KEY` — Forge API key

### Client-side (VITE_ prefix)
- `VITE_APP_ID` — App/client ID for OAuth
- `VITE_OAUTH_PORTAL_URL` — OAuth portal URL for login redirects
- `VITE_FRONTEND_FORGE_API_URL` — Frontend Forge API URL
- `VITE_FRONTEND_FORGE_API_KEY` — Frontend Forge API key

## Database

Uses MySQL via Drizzle ORM. Run migrations:

```bash
pnpm db:push
```

## Build & Deploy

```bash
pnpm build   # Builds frontend to dist/public and bundles server to dist/
node dist/index.js  # Runs production server
```

## User Preferences

- Use pnpm as the package manager
- Port 5000 for the dev server
