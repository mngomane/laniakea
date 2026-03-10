# Laniakea

Gamification for Developers

## Overview

Laniakea is a developer gamification platform that tracks coding activities and rewards contributions with XP, streaks, and achievements. It provides team-based competition, leaderboards, and GitHub integration via webhooks.

## Architecture

Monorepo managed with pnpm workspaces, combining a Rust computation engine, a Node.js API server, and a React frontend.

| Package | Path | Tech | Description |
|---------|------|------|-------------|
| `@laniakea/engine` | `packages/engine/` | Rust, napi-rs | Core engine: XP calculation, streaks, achievements, leaderboard |
| `@laniakea/api` | `packages/api/` | Hono, Mongoose, Vitest | REST API + WebSocket server |
| `@laniakea/web` | `packages/web/` | React 19, Vite, Tailwind | Frontend application |

## Prerequisites

- Node.js 22+
- pnpm 10+
- Rust toolchain (stable)
- MongoDB 7+

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
| POST | `/api/auth/logout` | Revoke refresh token |

### Users (`/api/users`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user profile |

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
| `MONGODB_URI` | `mongodb://localhost:27017/laniakea` | MongoDB connection string |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development, production, test) |
| `JWT_SECRET` | — | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | JWT refresh token secret (min 32 chars) |
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
make api-test       # 111 API tests (Vitest)
make verify         # Full verification pipeline
```

## Tech Stack

- **Engine**: Rust, napi-rs (Node.js native addon)
- **API**: Hono, Mongoose, JWT, Zod, Nodemailer
- **Web**: React 19, Vite, Tailwind CSS
- **Database**: MongoDB
- **Runtime**: Node.js 22+, pnpm 10+

## Legacy

The `src/` and `scripts/` directories contain the original Go CLI application (macOS). They are preserved for reference and should not be modified. Use `make legacy-build`, `make legacy-test`, or `make legacy-install` to interact with them.
