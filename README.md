# Laniakea

Gamification for Developers

## Overview

Laniakea is a gamification platform for development teams. Named after the supercluster that contains our galaxy, it turns everyday developer work into a space exploration adventure.

Every action — code push, pull request merged, code review submitted, tests passing in production — earns XP. Developers start on planet **Terra-1** (Earth) aboard their own vessel, with the collective objective of reaching **Ares-Base** (Mars) and beyond. The journey progresses as the team accumulates XP.

### Core mechanics

- **XP & Levels**: Every tracked activity (commits, PRs, reviews, merges, issues) awards XP. Accumulate XP to level up.
- **Streaks**: Consecutive days of activity build streaks, rewarding consistency.
- **Achievements**: Unlock badges for reaching milestones (first PR, streak records, XP thresholds...).
- **Special Missions**: Time-limited challenges — refactoring week, quick win marathon, clean code sprint — that award bonus XP.
- **Marketplace**: Spend earned XP on real goodies (stickers, mugs) or team "gages" — fun forfeits you can assign to colleagues (make coffee for 3 days, do an immediate code review, fix a random legacy bug).
- **Teams & Leaderboards**: Form squads, compete on team leaderboards, and track collective progress.

### The universe

The space theme is rooted in a real-world inside joke: in the original open-space office, each desk cluster was named after a planet — Earth for the frontend developers, Mars for the backend team. Laniakea turns that joke into a full narrative where every developer is a pilot, every team is a crew, and the codebase is the ship.

## Architecture

Monorepo managed with pnpm workspaces, combining a Rust computation engine, a Node.js API server, and a React frontend.

| Package | Path | Tech | Description |
|---------|------|------|-------------|
| `@laniakea/engine` | `packages/engine/` | Rust, napi-rs | Core engine: XP calculation, streaks, achievements, leaderboard |
| `@laniakea/api` | `packages/api/` | Hono, Drizzle ORM, Vitest | REST API + WebSocket server |
| `@laniakea/web` | `packages/web/` | React 19, Vite, Tailwind CSS 4 | Frontend application (space-themed UI) |

## Prerequisites

- Node.js 22+
- pnpm 10+
- Rust toolchain (stable)
- PostgreSQL 15+

## Quick Start

```bash
make install    # Install all dependencies
make build      # Build all packages
make dev        # Start API dev server (port 3000)
make dev-web    # Start Vite dev server
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make build` | Build all packages |
| `make test` | Run all tests |
| `make check` | Typecheck + lint all packages |
| `make lint` | ESLint on packages/ |
| `make dev` | API dev server |
| `make dev-web` | Vite dev server |
| `make engine-test` | Rust unit tests |
| `make engine-clippy` | Rust linter (deny warnings) |
| `make engine-fmt` | Rust format check |
| `make engine-build` | Build native module (napi) |
| `make api-test` | API tests (Vitest) |
| `make api-check` | API typecheck |
| `make web-build` | Web production build |
| `make web-check` | Web typecheck |
| `make db-generate` | Generate Drizzle migrations |
| `make db-migrate` | Run Drizzle migrations |
| `make db-push` | Push schema to database |
| `make db-studio` | Open Drizzle Studio |
| `make verify` | Run all checks (engine + API + web) |
| `make clean` | Remove dist/, target/, node_modules/ |

## API Routes

### Auth (`/api/auth`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email and password |
| GET | `/api/auth/github` | GitHub OAuth redirect |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/exchange` | Exchange OAuth code for tokens |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/github/link` | Link GitHub to existing account |
| GET | `/api/auth/github/link/callback` | GitHub link OAuth callback |

### Users (`/api/users`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Create user (admin) |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile (username, email) |
| POST | `/api/users/me/password` | Change password |
| POST | `/api/users/me/set-password` | Set password (OAuth-only users) |
| POST | `/api/users/me/unlink-github` | Unlink GitHub account |
| POST | `/api/users/me/remove-password` | Remove password auth |

### Activities (`/api/activities`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/activities` | Record activity (triggers XP + streak) |

### Achievements (`/api/achievements`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/achievements/:userId` | Get user achievements |

### Leaderboard (`/api/leaderboard`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leaderboard` | Global leaderboard sorted by XP |

### Teams (`/api/teams`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/teams` | Create team |
| GET | `/api/teams` | List public teams (paginated) |
| GET | `/api/teams/my` | Current user's teams |
| GET | `/api/teams/:slug` | Get team by slug |
| PUT | `/api/teams/:slug` | Update team |
| DELETE | `/api/teams/:slug` | Delete team |
| POST | `/api/teams/:slug/join` | Join team with invite code |
| POST | `/api/teams/:slug/leave` | Leave team |
| DELETE | `/api/teams/:slug/members/:userId` | Kick member |
| PUT | `/api/teams/:slug/members/:userId/role` | Update member role |
| POST | `/api/teams/:slug/regenerate-invite` | Regenerate invite code |
| GET | `/api/teams/:slug/leaderboard` | Team leaderboard |
| GET | `/api/teams/:slug/stats` | Team stats |

### Webhooks (`/api/webhooks`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/webhooks/github` | GitHub webhook handler (signature verified) |

### Notifications (`/api/notifications`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications` | List notifications (paginated) |
| GET | `/api/notifications/unread-count` | Unread count |
| GET | `/api/notifications/preferences` | Get notification preferences |
| PUT | `/api/notifications/preferences` | Update notification preferences |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Admin (`/api/admin`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Global platform stats |
| GET | `/api/admin/users` | List all users (paginated) |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| PATCH | `/api/admin/users/:id/ban` | Ban/unban user |
| GET | `/api/admin/teams` | List all teams (paginated) |
| DELETE | `/api/admin/teams/:id` | Delete team |
| GET | `/api/admin/achievements` | List all achievements |
| POST | `/api/admin/achievements` | Create achievement |
| PUT | `/api/admin/achievements/:id` | Update achievement |
| DELETE | `/api/admin/achievements/:id` | Delete achievement |
| GET | `/api/admin/activities/recent` | Recent activities |

## WebSocket

Endpoint: `/ws?token=<jwt>`

Connect with a JWT access token as query parameter. The server uses heartbeat ping/pong every 30 seconds and automatically disconnects dead connections.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | **(required)** | PostgreSQL connection string |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development, production, test) |
| `JWT_SECRET` | — | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | JWT refresh token secret (min 32 chars) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth app secret |
| `GITHUB_WEBHOOK_SECRET` | — | GitHub webhook signature secret |
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | — | Sender email address |
| `CRON_API_KEY` | — | API key for cron job authentication |

## Testing

```bash
make test           # All tests
make engine-test    # 29 Rust unit tests
make api-test       # 80 API tests (Vitest)
make verify         # Full verification pipeline
```

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Mission Control | Journey map (Earth to Mars), XP stats, pilot profile, activity terminal |
| `/leaderboard` | Navigation | Top 3 podium, pilot registry, fleet density |
| `/achievements` | Telemetry | Achievement badges (unlocked/locked) |
| `/ship-log` | Ship Log | Special missions with objectives and XP rewards |
| `/market` | Engine Room | XP marketplace — goodies, team gages, cosmetics |
| `/teams` | Fleet | Team management, creation, leaderboards |
| `/settings` | Settings | Profile editing, auth method linking, notifications |
| `/admin` | Command | Admin dashboard, user/team/achievement management |

## Tech Stack

- **Engine**: Rust, napi-rs (Node.js native addon)
- **API**: Hono, Drizzle ORM, JWT, Zod, Nodemailer
- **Web**: React 19, Vite, Tailwind CSS 4, Zustand, TanStack React Query, React Router
- **Database**: PostgreSQL (Drizzle ORM)
- **Design**: Material Design 3 dark theme, Space Grotesk + Inter fonts, Material Symbols icons
- **Runtime**: Node.js 22+, pnpm 10+

## Legacy

The `src/` and `scripts/` directories contain the original Go CLI application (macOS). They are preserved for reference and should not be modified. Use `make legacy-build`, `make legacy-test`, or `make legacy-install` to interact with them.
