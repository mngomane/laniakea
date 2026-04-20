# Laniakea — Gamification for Developers

## Persistent Memory — MANDATORY

Project knowledge lives in **Obsidian Brain** (MCP `obsidian-hetzner` at `http://127.0.0.1:22361/mcp`).
Each Claude Code session starts without context. Obsidian is the single source of truth for
architecture decisions, known bugs, migration history, and multi-user collaboration learnings
(openclaw ↔ soltri).

### Boot sequence

On the first message of a work session, **BEFORE** any action on code:

1. `/recall laniakea architecture stack` — project context, architecture decisions, divergences
2. `/recall laniakea migration postgres drizzle` — state of the Mongo → Postgres + PGlite migration
3. Read the full results before proceeding.

Do not rationalize that you "already know" this project — you do not. Recall first, act second.

> **MCP dependency**: the Obsidian server runs on the same Hetzner machine (under `soltri`).
> If `/recall` fails (service `obsidian-mcp` down, loopback unreachable), switch to
> local-inspection mode (direct code reading, git log, tests) and flag the issue to the human.
> Never fabricate context from nothing.

### Saving knowledge

Run `/memorize` after:
- Discovering or fixing a non-trivial bug (engine Rust, Hono API, or React web side)
- An architecture decision (ORM, new package, stack change, major refactor)
- A significant debug session ending
- Documenting a divergence between this CLAUDE.md and the actual code state
  (e.g., `File Map` still says "Mongoose" while the Drizzle migration is complete —
  this kind of drift must be caught and memorized for correction)

### Maintenance

- `/sync` at the end of a significant session (snapshot to `Brain/sync/claude-code-openclaw.md`)
- `/dream` monthly to consolidate and deduplicate
- `/index` after a dream to rebuild the VAULT_MAP


### CLAUDE.local.md — Deprecated for durable knowledge

Historically, `CLAUDE.local.md` was a scratch file for "heavy/ephemeral" learnings
(Rosetta dual-file pattern). With Memory OS active, **that role is absorbed by Obsidian**
via `/memorize`. `CLAUDE.local.md` is now strictly reserved for volatile data
(ephemeral tokens, session scratch).

**Rule**: any information that must survive the session MUST go through `/memorize`,
not `CLAUDE.local.md`. The latter was emptied on 2026-04-20 (913 → 32 lines) — do
not re-accumulate history, diff audits, or session snapshots.

### User-level skills shared with soltri

The skills `memorize`, `recall`, `sync`, `dream`, `index`, `forget`, `learn` are shared via the
symlink `~/.claude/skills → /home/soltri/.claude/skills` (Unix group `claude-skills` + ACL,
single source of truth = working tree of the `memory-os-skills` repo under soltri). Updates on
soltri's side are visible immediately — no local `git pull` required. **Read-only** on the
openclaw side: any skill modification must go through soltri or via a PR on
`github.com/mngomane/memory-os-skills`.

---

## Architecture

Monorepo TypeScript + Rust + PostgreSQL.

### Packages

| Package | Path | Description |
|---------|------|-------------|
| `@laniakea/engine` | `packages/engine/` | Rust core (XP, streaks, achievements, leaderboard) via napi-rs |
| `@laniakea/api` | `packages/api/` | Hono REST API + Drizzle ORM (PostgreSQL) + Vitest, Node 22+ |
| `@laniakea/web` | `packages/web/` | React 19 + Vite + Tailwind 4 |

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
- Network defense-in-depth: Vite and Hono servers bind to `127.0.0.1` (loopback). Access from other devices goes through `tailscale serve --https=5173/3000` on the Tailnet. Never change the bind to `0.0.0.0` without updating the hardening plan.

## API Routes

Phase 1 core:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Create user (auth-protected) |
| GET | `/api/users/:id` | Get user profile (wrapped `{ user: ... }`) |
| POST | `/api/activities` | Record activity → XP + streak |
| GET | `/api/achievements/:userId` | User achievements |
| GET | `/api/leaderboard` | Leaderboard sorted by XP |

Extensions (auth, teams, notifications, admin, webhooks, WS):

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/login` | Password login (JWT access + refresh) |
| POST | `/api/auth/logout` | Revoke refresh token |
| POST | `/api/auth/exchange` | OAuth authorization code exchange |
| GET | `/api/auth/github/callback` | GitHub OAuth callback → redirect |
| GET | `/api/auth/github/link/callback` | GitHub account linking (crypto token via `oauth-store`) |
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update profile (username/email/password change) |
| POST | `/api/users/me/password` | Change password |
| POST | `/api/users/me/github/link` | Link GitHub account |
| POST | `/api/users/me/github/unlink` | Unlink GitHub account (requires password) |
| CRUD | `/api/teams/*` | Team CRUD + invites + roles + team leaderboard |
| POST | `/api/webhooks/github` | GitHub webhook (HMAC signature verified) |
| CRUD | `/api/notifications/*` | Notifications + per-user preferences |
| GET | `/api/admin/*` | Admin stats, users, teams, achievements |
| WS | `/ws?token=<jwt>` | WebSocket with heartbeat 30s |

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

---

## Migration MongoDB → PostgreSQL

**Status**: substantially complete. Services, routes, middlewares, and tests migrated to Drizzle. `tsc --noEmit` = 0. 109 tests passing (29 Rust + 80 Vitest). Mongoose files renamed to `.bak`, awaiting final removal (see order below).

### PGlite Spike (2026-03-14) — ALL PASS

| Feature | Result | Version |
|---------|--------|---------|
| `CREATE TYPE ... AS ENUM` | PASS | `@electric-sql/pglite@0.3.16` |
| JSONB + `->>'key'` operator | PASS | `@electric-sql/pglite@0.3.16` |
| Partial unique index (`WHERE ...`) | PASS | `@electric-sql/pglite@0.3.16` |

PGlite is validated as the in-process test backend for the migration.

### Transactional pattern — `DbClient`

Unified type in `src/db/types.ts`:

```ts
type DbClient = PostgresJsDatabase<typeof schema>;
```

Every service function accepts an optional `client: DbClient = getDb()` parameter to propagate transactions:

```ts
async function createUser(data: NewUser, client: DbClient = getDb()) {
  return client.insert(users).values(data).returning();
}
```

### Ordering constraint — Mongoose model removal

The `src/models/*.ts` files must only be deleted after:

1. **All** services, routes, middlewares, and tests migrated to Drizzle
2. `tsc --noEmit` = 0 errors
3. `grep -r "from.*models/<model>"` = empty for each model

**Removal order** (reverse dependency, from most isolated to most referenced):

1. `refresh-token.model.ts`
2. `notification.model.ts`
3. `achievement.model.ts`
4. `activity.model.ts`
5. `team.model.ts`
6. `user.model.ts` (last — dependency of all others)
