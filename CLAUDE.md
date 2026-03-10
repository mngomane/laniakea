# Laniakea — Gamification for Developers

## Architecture

Monorepo TypeScript + Rust + MongoDB.

### Packages

| Package | Path | Description |
|---------|------|-------------|
| `@laniakea/engine` | `packages/engine/` | Rust core (XP, streaks, achievements, leaderboard) via napi-rs |
| `@laniakea/api` | `packages/api/` | Hono REST API + Mongoose |
| `@laniakea/web` | `packages/web/` | React 19 + Vite + Tailwind |

### Legacy

- `src/` — Go CLI (macOS), do not modify
- `scripts/` — Go install script, do not modify

## Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Lint TypeScript packages

# Engine (Rust)
cd packages/engine
cargo test                # Rust unit tests
cargo clippy --all-targets -- -D warnings
cargo fmt -- --check

# API
pnpm --filter @laniakea/api test        # Vitest
pnpm --filter @laniakea/api exec tsc --noEmit

# Web
pnpm --filter @laniakea/web build
```

## Rules

- TypeScript: strict mode, ESM, no `any`
- Rust: `#![deny(clippy::all, clippy::pedantic)]`, no `.unwrap()` outside tests, no `unsafe`
- Conventional Commits
- Tests before implementation

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user profile |
| POST | `/api/activities` | Record activity → XP + streak |
| GET | `/api/achievements/:userId` | User achievements |
| GET | `/api/leaderboard` | Leaderboard sorted by XP |

## File Map (Phase 1)

### Root
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `Cargo.toml`
- `eslint.config.js`, `.gitignore`, `CLAUDE.md`
- `.claude/rules/laniakea-phase1.md`

### `packages/engine/` (Rust + napi-rs)
- `Cargo.toml`, `package.json`, `build.rs`
- `index.js`, `index.d.ts` (generated/stub)
- `src/lib.rs`, `src/types.rs`, `src/xp.rs`, `src/streak.rs`, `src/achievement.rs`, `src/leaderboard.rs`

### `packages/api/` (Hono + Mongoose)
- `package.json`, `tsconfig.json`, `vitest.config.ts`
- `src/index.ts`, `src/config/env.ts`, `src/config/database.ts`
- `src/models/user.model.ts`, `src/models/activity.model.ts`, `src/models/achievement.model.ts`
- `src/types/index.ts`
- `src/services/gamification.service.ts`, `src/services/user.service.ts`, `src/services/activity.service.ts`
- `src/routes/users.route.ts`, `src/routes/activities.route.ts`, `src/routes/achievements.route.ts`, `src/routes/leaderboard.route.ts`
- `src/middleware/error-handler.ts`
- `test/setup.ts`, `test/services/gamification.service.test.ts`, `test/services/user.service.test.ts`, `test/routes/users.route.test.ts`

### `packages/web/` (React + Vite + Tailwind)
- `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.css`, `index.html`
- `src/main.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `src/vite-env.d.ts`
