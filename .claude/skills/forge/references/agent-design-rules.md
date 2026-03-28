# Agent Design Rules

## Core agents

### Architect (always present)

STEP 0 ABSOLUTE (BEFORE any other action):
1. Read CLAUDE.md in full if it exists — it contains conventions, build/lint/test commands, and project-specific rules.
2. List and read all files in `.claude/rules/` if they exist.
3. Integrate these rules into the plan. Conflict between prompt rules and CLAUDE.md → CLAUDE.md wins.

Then:
- READ-ONLY mode first. Map files, dependencies, pipeline.
- `require plan approval` MANDATORY.
- Write in CLAUDE.md: plan, commands, anti-regression rules, verification workflow.
- CLAUDE.md MUST be written in English with header: "⚠️ All additions and modifications to this file MUST be written in English."
- Create `.claude/rules/[task-name].md` if relevant.
- If TDD active: define coverage matrix in CLAUDE.md.
- ALWAYS: identify quality hotspots and security surfaces.

STACK-SPECIFIC INITIAL VERIFICATION:
- **TypeScript/React/Vue**: verify `tsconfig.json`, `package.json` scripts, node version
- **Rust**: verify `Cargo.toml`, edition, features, workspace structure
- **Go**: verify `go.mod`, Go version, package structure, `go vet`
- **Python**: verify `pyproject.toml`, Python version, virtual environment
- **PHP**: verify `composer.json`, PHP version, required extensions
- **C/C++**: verify `CMakeLists.txt`, compiler, flags, system dependencies

### Specialized Agents (as needed)

Clear naming reflecting the stack:
- **TypeScript**: "Backend Engineer — Node.js API", "Backend — NestJS Modules"
- **React**: "Frontend Engineer — React Components", "Frontend — Next.js Pages"
- **Vue**: "Frontend Engineer — Vue Components", "Frontend — Nuxt Pages"
- **Rust**: "Systems Engineer — Core Library", "Systems — Async Runtime"
- **Go**: "Backend Engineer — API Handlers", "Backend — Go Services"
- **Python**: "Backend Engineer — FastAPI Routes", "ML Engineer — Data Pipeline"
- **PHP**: "Backend Engineer — Symfony Services", "Backend — Doctrine Entities"
- **C/C++**: "Systems Engineer — Core Module", "Systems — Memory Management"

Rules:
- EXPLICIT dependencies between agents (who waits for whom)
- Each agent has a concrete task list and a verification method
- BEFORE writing code: read CLAUDE.md + relevant `.claude/rules/`

### QA Agent (if complexity ≥ medium)

- Runs IN PARALLEL
- Verifies after each modification completed by another agent
- Has BLOCKING RIGHTS
- ALWAYS verifies code quality (see quality-rules.md clean_code_rules)
- ALWAYS verifies code security (see quality-rules.md security_rules)

Stack-specific QA checklists:
- **TypeScript**: `tsc --noEmit`, tests green, ESLint clean
- **React/Vue**: component tests green, build without errors, no console warnings
- **Rust**: `cargo clippy -- -D warnings`, `cargo test`, no undocumented `unsafe`
- **Go**: `go vet`, `golangci-lint run`, `go test -race ./...`
- **Python**: `mypy --strict`, `pytest` green, `ruff check` clean
- **PHP**: PHPStan passes, PHPUnit green, PHP-CS-Fixer ok
- **C**: zero warnings (`-Werror`), Valgrind clean
- **C++**: build without warnings, tests green, Valgrind/ASan clean

Finding format: `File:line | Severity (🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low) | Description | Proposed fix | Justification`

### TDD Agents (if TDD active)

Read `references/tdd-workflow.md` for complete agent specifications.

Summary:
- **Test Writer (TDD-1)**: writes tests BEFORE implementation (Red phase)
- **Implementer (TDD-2)**: writes MINIMAL code to pass tests (Green phase)
- **Refactorer (TDD-3)**: refactors AFTER all tests pass (if complexity ≥ medium)

### VRT Agent (if VRT active)

Read `references/vrt-workflow.md` for complete agent specification.

Summary:
- Operates IN PARALLEL with implementation agents
- Has BLOCKING RIGHTS on critical regressions (🔴)
- Captures CSS baseline BEFORE modifications, re-scans after each phase

## Coordination rules

- Architect creates tasks with dependencies in the task list
- Agents communicate via inter-agent mailbox
- Lead updates CLAUDE.md at each milestone
- When an agent finishes → next task auto-claim
- If TDD: Architect records current cycle (🔴/🟢/🔄) and coverage after each cycle

## Dimensioning

| Complexity | Agents | QA | TDD agents | VRT |
|-----------|--------|-----|-----------|-----|
| Simple | 1–2 | Optional | 2 (Test Writer + Implementer) | Mini-scan by Frontend/QA |
| Medium | 2–3 | Recommended | 3 (+ Refactorer) | Dedicated VRT agent |
| High | 4–6 | Mandatory | 3–4 (+ QA parallel) | Dedicated VRT + blocking rights |
