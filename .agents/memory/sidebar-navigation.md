---
name: Sidebar navigation
description: The 5 sidebar items and their correct routes.
---

## Routes
| Label     | Path        | Page file              |
|-----------|-------------|------------------------|
| Dashboard | /dashboard  | pages/Dashboard.tsx    |
| Jobs      | /jobs       | pages/Dashboard.tsx (aliased via App.tsx Route) |
| Batch     | /batch      | pages/Batch.tsx        |
| YouTube   | /youtube    | pages/YouTube.tsx      |
| Settings  | /settings   | pages/Settings.tsx     |

**Why:** Originally all 5 items pointed to `/dashboard`. Fixed in v1.2.0 overhaul.

**How to apply:** If adding new sidebar items, add both the menuItem entry in DashboardLayout.tsx AND a Route in App.tsx.
