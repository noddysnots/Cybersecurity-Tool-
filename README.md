# Triage Console v2

Client-only Vite + React SPA for a Prisma Access style alert triage workflow.

## Setup

```bash
npm install
npm run dev
```

Demo login: `admin` / `12345` (client-side demo auth only, not real security).

Demo clock: Tue 6 Oct 2026, 12:05 IST (fixed; never reads the system clock).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript project references |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright against `vite preview` |
| `npm run generate` | Seed data generator (Phase 1) |

## Spec

See `PLAN.md`, `CURSOR_PROMPTS.md`, and `.cursor/rules/project.mdc`.
