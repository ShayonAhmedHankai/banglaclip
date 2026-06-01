---
name: Notification system
description: How the in-app notification bell works — client-side only, no DB table.
---

## Implementation
- `client/src/contexts/NotificationContext.tsx` — React context, localStorage-backed, max 50 items.
- `NotificationProvider` wraps the app in `App.tsx` (inside ThemeProvider).
- Dashboard (`Dashboard.tsx`) detects job status transitions via polling and calls `addNotification`.
- Bell icon lives in `DashboardLayout.tsx` top-right corner.

**Why:** No DB notifications table exists. localStorage is sufficient for per-browser notification state. Adding a DB table would require a migration.

**How to apply:** To add notifications from other places, call `useNotifications().addNotification(...)` with `type: "success"|"error"|"info"`.
