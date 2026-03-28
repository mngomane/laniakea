# Stack Knowledge — Multi-Language Reference

Conventions, tools, and best practices for each supported ecosystem.
Forge selects relevant entries automatically based on the detected stack.
When a project combines stacks (e.g., Go backend + React frontend), Forge
merges applicable conventions.

**TypeScript is the PRIMARY stack.** When the stack is ambiguous, when offering
alternatives, or when a migration path is discussed, default to TypeScript idioms.

---

## TypeScript ⭐ PRIMARY

- **Versions**: 5.4+
- **Frameworks**: Node.js (Express, Fastify, NestJS, Hono), Deno, Bun
- **Package manager**: pnpm (preferred), npm, yarn, bun
- **Linter**: ESLint 9+ (flat config), Biome
- **Formatter**: Prettier, Biome
- **Test framework**: Vitest (preferred), Jest, Node.js built-in test runner
- **Build tools**: tsup, esbuild, Vite, tsc, Turbopack

### Conventions
- `strict: true` in tsconfig.json (MANDATORY)
- `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- No `any` — use `unknown` + type guards
- No `!` (non-null assertion) except documented cases
- Prefer `interface` for public contracts, `type` for unions/intersections
- `.js` extensions for ESM native projects
- Barrel exports (`index.ts`) limited to public modules only
- Zod or Valibot for runtime validation of external inputs
- Custom error classes extending `Error`, never `throw "string"`

### Test conventions
- Mirror structure: `src/module/foo.ts` → `src/module/foo.test.ts`
- Naming: `describe('Module')` → `it('should [behavior] when [context]')`
- Coverage: `vitest run --coverage` — minimum 80% branches
- E2E: Playwright (frontend), Supertest (APIs)

### Commands
```
pnpm install / npm install
pnpm run build / pnpm run dev
pnpm run test / vitest run
pnpm run lint / eslint .
tsc --noEmit (type-check without build)
```

---

## React

- **Versions**: 18+ / 19+
- **Frameworks**: Next.js 14+/15+, Remix, Vite + React, React Native
- **Test framework**: Vitest + React Testing Library, Playwright (E2E), Storybook

### Conventions
- Functional components exclusively (no classes)
- Custom hooks: `use[HookName].ts`
- Colocation: component + styles + tests + types in the same folder
- Server Components by default (Next.js App Router) — `'use client'` only if needed
- State: Zustand or Jotai (global), React state/context (local)
- No prop drilling beyond 2 levels — composition or context
- Memoization only after performance measurement
- CSS: Tailwind (preferred), CSS Modules, or styled-components — one system per project
- Accessibility: ARIA roles, keyboard navigation, WCAG AA minimum

### Test conventions
- React Testing Library — test behavior, not implementation
- `screen.getByRole()` preferred over `getByTestId()`
- E2E: Playwright — critical paths only

### Commands
```
pnpm run dev / next dev
pnpm run build / next build
pnpm run test / vitest run
```

---

## Vue.js

- **Versions**: 3.4+
- **Frameworks**: Nuxt 3+, Vue + Vite, Quasar
- **Test framework**: Vitest + Vue Test Utils, Playwright (E2E), Cypress

### Conventions
- Composition API exclusively (`<script setup lang="ts">`) — no Options API
- TypeScript mandatory: `defineProps<T>()`, `defineEmits<T>()`
- Composables: `use[ComposableName].ts`
- Colocation: `MyComponent.vue` + `MyComponent.test.ts` in same folder
- Auto-imports (Nuxt): `composables/`, `utils/`, `components/`
- State: Pinia (one store per domain)
- SFC order: `<script>` → `<template>` → `<style scoped>`

### Commands
```
pnpm run dev / nuxt dev
pnpm run build / nuxt build
pnpm run test / vitest run
```

---

## Rust

- **Versions**: Edition 2021 / 2024, stable toolchain
- **Frameworks**: Actix-web, Axum, Rocket, Tokio, Tauri
- **Package manager**: Cargo
- **Linter**: Clippy (`cargo clippy -- -D warnings`)
- **Formatter**: rustfmt (`cargo fmt`)
- **Test framework**: Built-in (`cargo test`), criterion (benchmarks), proptest

### Conventions
- `#![deny(clippy::all, clippy::pedantic)]` at top of `lib.rs` / `main.rs`
- Prefer references over clones — every `.clone()` must be justified
- `thiserror` for library errors, `anyhow` for applications — NEVER `.unwrap()` in production
- No `unsafe` except with documented `// SAFETY: ...` comment
- Async: Tokio runtime by default
- Traits for polymorphism — prefer trait bounds over trait objects (`dyn`)
- Serde for all (de)serialization
- Workspace Cargo for multi-crate projects

### Commands
```
cargo build / cargo build --release
cargo test / cargo test -- --nocapture
cargo clippy -- -D warnings
cargo fmt -- --check
cargo bench
```

---

## Go

- **Versions**: 1.22+
- **Frameworks**: Standard library (net/http), Chi, Gin, Echo, Fiber, gRPC
- **Package manager**: Go Modules
- **Linter**: golangci-lint (`.golangci.yml`)
- **Formatter**: gofmt / goimports (non-negotiable)
- **Test framework**: Built-in (`go test`), testify, gomock

### Conventions
- `gofmt` is NON-NEGOTIABLE
- Package naming: short, lowercase, one word — no `utils`, `helpers`, `common`
- Interfaces in consumer package ("accept interfaces, return structs")
- Error handling: `if err != nil { return fmt.Errorf("context: %w", err) }`
- No `panic` in production except irreversible initialization
- Concurrency: channels for communication, `sync.Mutex` for shared state, `errgroup`
- `context.Context` as first parameter of every I/O function
- Table-driven tests mandatory for multi-input functions
- `internal/` for unexportable code

### Commands
```
go build ./...
go test -v -race -count=1 ./...
go vet ./...
golangci-lint run
go mod tidy
```

---

## Python

- **Versions**: 3.11+
- **Frameworks**: FastAPI, Django 5+, Flask, Typer (CLI), Pydantic, SQLAlchemy 2+
- **Package manager**: uv (preferred), pip, Poetry, PDM
- **Linter**: Ruff
- **Formatter**: Ruff format
- **Type checker**: mypy (strict) or Pyright
- **Test framework**: pytest, pytest-asyncio, hypothesis

### Conventions
- Type hints everywhere — `mypy --strict` must pass
- Pydantic v2 for data validation
- Async native with `asyncio` + `httpx`
- Dataclasses or Pydantic models — no raw dicts for business data
- `pyproject.toml` as single source of truth

### Commands
```
uv sync / pip install -e ".[dev]"
pytest / pytest -v --cov=src
ruff check . / ruff format .
mypy src/
```

---

## Node.js

- **Versions**: 20 LTS+ / 22+
- **Note**: TypeScript conventions apply fully. Node.js runtime specifics only.

### Conventions
- ESM by default (`"type": "module"`) — CJS only for legacy
- Built-ins with `node:` prefix
- Graceful shutdown with `SIGTERM`/`SIGINT` handlers
- Streams for large files — no `readFileSync` in production
- Logging: pino (structured JSON) — no `console.log` in production

---

## PHP

- **Versions**: 8.2+
- **Frameworks**: Symfony 6.4+, Laravel 11+, API Platform
- **Package manager**: Composer
- **Linter**: PHP-CS-Fixer (PER-CS2.0), PHPStan (level 8+), Psalm
- **Test framework**: PHPUnit 10+, Pest

### Conventions
- `declare(strict_types=1);` at the top of every file
- PSR-12 / PER-CS2.0, PSR-4 autoloading
- Native PHP 8.2+ types everywhere
- Hexagonal architecture for complex Symfony projects
- Stateless services, constructor dependency injection

### Commands
```
composer install
php bin/phpunit
php vendor/bin/php-cs-fixer fix --dry-run --diff
php vendor/bin/phpstan analyse -l 8
```

---

## C

- **Versions**: C17, C23 if supported
- **Linter**: clang-tidy, cppcheck
- **Formatter**: clang-format
- **Test framework**: Unity, CTest + CMake, cmocka

### Conventions
- `-Wall -Wextra -Werror -pedantic` — zero warnings
- Sanitizers in dev: `-fsanitize=address,undefined`
- No `malloc` without corresponding `free`
- Check EVERY return value
- `const` everywhere applicable, no VLAs

### Commands
```
cmake -B build -DCMAKE_BUILD_TYPE=Debug / cmake --build build
ctest --test-dir build --output-on-failure
valgrind --leak-check=full ./build/tests/test_module
```

---

## C++

- **Versions**: C++20 / C++23
- **Linter**: clang-tidy, cppcheck
- **Formatter**: clang-format
- **Test framework**: Google Test + Google Mock, Catch2 v3, doctest

### Conventions
- RAII systematic — no raw `new`/`delete`
- `std::optional`, `std::expected` (C++23), `std::variant`
- Ranges (C++20), Concepts (C++20) — no more SFINAE
- Move semantics: Rule of 5 or Rule of 0
- No `using namespace std;` in headers

### Commands
```
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build -j$(nproc)
ctest --test-dir build --output-on-failure
valgrind --leak-check=full ./build/tests/test_suite
```

---

## JavaScript (Vanilla / Legacy)

- **Versions**: ES2022+
- **Note**: TypeScript is the default recommendation. Use this for non-TS projects only.
- JSDoc + `// @ts-check` for gradual TS checking
- ESM preferred, no `var`

---

## Auto-Detection Matrix

| Signal | Detected Stack |
|--------|---------------|
| `tsconfig.json` | TypeScript ⭐ |
| `package.json` (no tsconfig) | JavaScript |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pyproject.toml` / `requirements.txt` | Python |
| `composer.json` | PHP |
| `CMakeLists.txt` | C OR C++ |
| `*.vue` / `nuxt.config.ts` | Vue.js |
| `next.config.*` / `app/layout.tsx` | React |

---

## Pattern Strategies by Stack

### Pattern A — Correction / Stabilization
- **C/C++**: Valgrind/ASan verification post-fix
- **Rust**: verify `cargo clippy` passes without warnings
- **All**: Architect identifies last stable commit via `git log`, partial rollback strategy

### Pattern B — New Feature
- **Go**: define interface contracts before implementation
- **Rust**: define traits and error types before coding
- **TypeScript**: define interfaces/types before implementation (types-first approach)
- **Frontend** (React/Vue): islands architecture if modern in legacy

### Pattern C — Refactoring / Migration
- Feature flags mandatory, incremental migration, never big-bang
- **JS→TS**: progressive migration file by file with `allowJs: true`
- **PHP→TS**: identify PHP services → map to TS interfaces → implement with Zod validation
- **C→Rust or C++→Rust**: encapsulate via FFI, migrate module by module

### Pattern D — Optimization / Performance
- **TypeScript/Node.js**: `--prof` + clinic.js, bundle size analysis
- **Rust**: `cargo bench` with criterion
- **Go**: `go test -bench`
- **C/C++**: perf/cachegrind
- **Python**: cProfile + py-spy
