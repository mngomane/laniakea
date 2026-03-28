# Reference Examples — Calibration

Use these examples when analyzing a task to select the appropriate pattern,
agents, strategy levels, and conditional features.

## Task → Full Profile Mapping

| Request | Pattern | Agents | TDD | Quality | Security | VRT |
|---------|---------|--------|-----|---------|----------|-----|
| Dashboard broken after CSS changes | A | Architect, Frontend Structure, Frontend Style, QA | Bug TDD | standard | standard | source-code audit |
| Add REST API to NestJS project | B | Architect, Test Writer, Implementer — API, QA | TDD strict | reinforced | reinforced (exposed API) | — |
| Migrate jQuery to React | C | Architect, Frontend Migration, Frontend Tests, QA | Characterization | audit | reinforced (no XSS regression) | — |
| Slow site, optimize | D | Architect, Profiler, Implementer, QA | Benchmark tests | standard | standard | — |
| Create SaaS from scratch (TypeScript) | B | Architect, Test Writer, Backend, Frontend, QA | TDD strict + BDD | reinforced | deep-audit (user data, payments) | — |
| Add gRPC endpoint to Go microservice | B | Architect, Test Writer, Implementer — Go, QA | TDD strict | reinforced | reinforced (API) | — |
| Fix segfault in C parser | A | Architect, Systems — Core, QA (Valgrind) | Bug TDD | standard | standard | — |
| Migrate C++ crypto to Rust via FFI | C | Architect, Systems — Rust FFI, Systems — C++ Legacy, QA | Characterization | audit | deep-audit (crypto) | — |
| Create CLI in Rust with Clap | B | Architect, Systems — CLI, QA | TDD strict | standard | standard | — |
| Refactor Python monolith to FastAPI | C | Architect, Backend — FastAPI, Backend — Models, QA | Characterization | audit | reinforced | — |
| Full-stack: Go + React | B | Architect, Backend — Go, Frontend — React, Integration, QA | TDD strict | reinforced | reinforced | — |
| Remove legacy CSS, migrate Tailwind | C | Architect, CSS Migration, VRT, QA | CSS characterization | audit | standard | combined (full scan) |
| Payment form crashes on decimals | A | Architect, Test Writer, Implementer | Bug TDD | standard | deep-audit (payment) | — |
| Add dark mode to dashboard | B | Architect, Frontend Engineer, VRT | TDD strict | reinforced | standard | source-code targeted |

## Pattern Selection Logic

- **Correction / bugfix** → Pattern A. Bug TDD. Security auto-escalates if user data path.
- **New feature** → Pattern B. TDD strict. Security escalates if auth/data/API.
- **Refactoring / migration** → Pattern C. Characterization first. Quality = audit.
- **Optimization** → Pattern D. Benchmark before/after. Standard unless cache/data.

## Auto-Escalation Triggers

| Signal in task | Security escalation | Quality escalation |
|---------------|--------------------|--------------------|
| auth, login, session, token | → reinforced minimum | — |
| payment, billing, financial | → deep-audit | → reinforced |
| public API, webhook | → reinforced | — |
| multi-tenant, tenant isolation | → deep-audit | → reinforced |
| user data, GDPR, PII | → deep-audit | — |
| CSS migration, framework swap | — | → audit |
| Refactoring (any) | — | → audit |

## Dimensioning Quick Guide

| Complexity Signal | Level | Max Agents |
|-------------------|-------|-----------|
| Single file, one function | Simple | 2 |
| Multi-file in one domain | Medium | 3 |
| Multi-domain (backend + frontend) | High | 4 |
| Multi-stack (Go + React, C++ + Rust FFI) | High | 5-6 |

## Skill Delegation Examples

| Task description | Delegated sub-task | Skill | Decision |
|------------------|--------------------|-------|----------|
| "Fix bug and create incident ticket" | Create incident ticket | tma-ticket-creator | 📦 DELEGATE |
| "Migrate CSS, check regressions" | CSS coverage baseline | wiz-bdd (scripts) | 🔗 INTEGRATE |
| "Audit the feature branch" | Git diff audit | cos-audit | 📦 DELEGATE |
| "Implement the API endpoint" | — | — | 🔧 FORGE HANDLES |
