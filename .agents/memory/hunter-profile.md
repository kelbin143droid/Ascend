---
name: Hunter Profile & 6-stat system
description: How INT and DIS stats work and how the Hunter Profile page is wired.
---

## The 6 stats
- STR/AGI/VIT/SEN → stored in `players.stats` jsonb (real data)
- INT (intelligence) → no learning-activity tracking yet; starts at 0; future: add to statXP/stats when learning habits exist
- DIS (discipline) → computed server-side from `player.streak * 2 + stability.consecutiveActiveDays * 0.5`, capped at 50; **no schema change needed**

## Why DIS is derived, not stored
DIS represents consistency, which is already captured by streak + consecutive active days. Adding a separate DB column would create a sync problem (two sources of truth for the same behavior).

**How to apply:** When adding a DIS storage column in future, deprecate the derived formula in `GET /api/player/:id/hunter-profile` and read from the DB column instead.

## Hunter Profile page
- Route: `/hunter-profile`, lazy-loaded page at `client/src/pages/HunterProfilePage.tsx`
- Endpoint: `GET /api/player/:id/hunter-profile` in `server/routes.ts`
- Entry point: "Hunter Profile" card on `/profile` page (ProfilePage.tsx)
- CSS scoped under `.hp-root` to avoid Tailwind collisions
- Class picker and stat allocation are local-only (server wiring is TODO — flagged in code comments)
- `_meta.placeholders` array in API response documents every field that isn't real data yet
