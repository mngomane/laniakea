# Agent Roles — Detailed Responsibilities

> **Environment**: Council of Singulars — Hetzner server, Claude Code with tmux agent teams.
> **Constraint**: ALL agents are READ-ONLY on source files. Git write operations FORBIDDEN.

---

## Agent 1 — Architect & Lead (READ-ONLY, delegate mode)

### Absolute Phase 0 (BEFORE any other action):
1. Read `CLAUDE.md` in its entirety — project conventions, commands, specific rules.
2. Read all files in `.claude/rules/` if present — gotchas and critical patterns.
3. Run the diff inventory (`--stat`, `--name-only`, `log --oneline`).
4. Run `scripts/detect-stack.sh` for stack detection.
5. Run `scripts/scan-patterns.sh` for the automated dangerous pattern scan.

### Responsibilities:
- Categorize modified files by domain, adapting to the detected stack:
  - **TypeScript/JS**: handlers, services, models, middleware, frontend components
  - **Rust**: modules, lib.rs entry points, FFI boundaries, unsafe blocks
  - **Go**: packages, handlers, middleware, proto definitions
  - **Python**: views/routes, services, models, CLI commands
  - **PHP**: controllers, services, documents/entities, templates
  - **C/C++**: modules, headers, system interfaces, memory management
  - **IaC**: Terraform resources, K8s manifests, Dockerfiles
- Create the audit plan in CLAUDE.local.md with domain assignments.
- Identify **maximum risk zones** to analyze first:
  - Code handling user input (HTTP handlers, CLI parsers, message consumers)
  - Database/storage access (queries, migrations, schema changes)
  - Authentication and authorization logic
  - Infrastructure changes (firewall rules, IAM, network policies)
  - Unsafe/FFI code (Rust unsafe, C memory management, Go cgo, ASM)
- Coordinate agents, merge partial reports.
- Write §1 (Executive Summary) and §7 (Prioritized Recommendations).
- **Knowledge promotion**: after the report is finalized, promote durable project-wide learnings to `CLAUDE.md` (section `## Audit Learnings`). Only promote recurring patterns, new conventions, critical gotchas, missing safeguards.

### Absolute rules:
- Read-only on **all source files**. No source modifications.
- `require plan approval` is MANDATORY before dispatching agents.
- Exception: Agent 1 MAY **append** to `CLAUDE.md` (audit learnings) and **write** to `CLAUDE.local.md` (report).

---

## Agent 2 — Security Auditor (READ-ONLY)

### Mission:
Exhaustively analyze the diff from a security perspective. Consult `references/security-checklist.md` for detailed stack-adapted checklists.

### Priority analysis vectors by stack:

#### Universal (all stacks):
1. **Input validation**: user data reaching DB, filesystem, OS commands, or external services without sanitization.
2. **Authentication/Authorization**: new endpoints or functions missing access control.
3. **Secrets exposure**: credentials, API keys, tokens in code, config, or logs.
4. **Dependency vulnerabilities**: `npm audit` / `cargo audit` / `pip-audit` / `composer audit` results.

#### TypeScript / JavaScript:
- XSS via `innerHTML`, `v-html`, `dangerouslySetInnerHTML`
- Prototype pollution via deep merge on user objects
- SSRF via user-controlled URLs in `fetch()` / `axios`
- NoSQL injection if MongoDB driver used

#### Rust:
- Every `unsafe` block: is the safety invariant documented and correct?
- `.unwrap()` on paths reachable by user input
- `transmute`: is the type coercion sound?
- Integer overflow in allocation sizes

#### Rust↔Node FFI (napi-rs):
- Data crossing the boundary: validated on both sides? Types match `.d.ts` declarations?
- Rust functions exposed via `#[napi]`: do they validate inputs before processing?
- `Buffer`/`TypedArray` returned to JS: no dangling Rust references?
- Error handling: Rust errors properly surfaced to JS (no silent swallow)?
- Unbounded allocation at FFI boundary: can a large JS input cause OOM in Rust?
- Concurrency: are `#[napi]` functions thread-safe? (Node calls from main thread, but `napi::tokio_runtime` may introduce async)

#### Go:
- SQL injection via `fmt.Sprintf` in queries
- Goroutine leaks (unclosed channels, missing context cancellation)
- Race conditions (`go test -race` results)
- TOCTOU in file operations
- HTTP request smuggling (custom parsers)

#### Python:
- `eval()`, `exec()`, `os.system()`, `subprocess.call(shell=True)`
- `pickle.loads()` on untrusted data
- Django `mark_safe()` / Flask `Markup()` without sanitization
- SSTI (Server-Side Template Injection) via `render_template_string()`

#### PHP:
- Injection via `$_GET`/`$_POST`/`$_REQUEST` passed to DB queries
- `|raw` in Twig without sanitization
- CSRF tokens missing on forms
- MongoDB operator injection (`$where`, `$regex`)

#### C / C++:
- Buffer overflows (unchecked `strcpy`, `sprintf`, array indices)
- Use-after-free, double-free
- Format string vulnerabilities (`printf(user_string)`)
- Integer overflow before allocation
- Null pointer dereference after failed allocation

#### ASM (x86/x64):
- Direct syscalls: document purpose, verify no privilege escalation
- Stack buffer manipulation without bounds checking
- Hardcoded addresses bypassing ASLR

#### Terraform / Kubernetes:
- Permissive firewall rules (0.0.0.0/0)
- Privileged containers, host namespace sharing
- Missing resource limits, missing network policies
- IAM over-privileging

### Output: Report section §3.

---

## Agent 3 — Regression & Breaking Change Analyst (READ-ONLY)

### Mission:
Identify functional regressions and breaking changes across all stacks.

### Analysis domains:

1. **API / Public Interface Changes**:
   - TypeScript: exported function signatures, type definitions
   - Rust: public function signatures, trait implementations, `pub` items
   - Go: exported function signatures, interface changes
   - Python: public function signatures, class interfaces
   - PHP: public method signatures, service contracts
   - C/C++: header file changes, ABI compatibility
   - gRPC/Protobuf: field numbers, message types, service definitions

2. **Database / Schema / Migrations**:
   - SQL: deleted/renamed columns, type changes, index modifications
   - ORM migrations present and idempotent?
   - New required fields without default → crash on existing data
   - Terraform: resource renames/deletions that break state

3. **Configuration & Infrastructure**:
   - Removed environment variables or config keys still referenced
   - Docker: base image version bumps, removed ports, changed entrypoint
   - K8s: changed service ports, removed ConfigMaps/Secrets, CRD changes
   - Terraform: removed resources, changed outputs

4. **Dependencies**:
   - Lock file changes (`package-lock.json`, `Cargo.lock`, `go.sum`, `composer.lock`)
   - Major version bumps in critical dependencies
   - Removed dependencies still imported in code

5. **Behavioral Changes**:
   - Modified error handling (different error types, changed status codes)
   - Changed default values
   - Modified event names/payloads
   - Changed serialization format

### Output: Report sections §2 and §4.

---

## Agent 4 — Code Quality & Test Coverage Auditor (READ-ONLY)

### Mission:
Evaluate the quality of introduced code and test coverage.

### Quality analysis:
Apply the 10 rules from `references/clean-code-rules.md` on each modified file with high change density. Adapt to the language's idioms:
- Rust: also check for non-idiomatic patterns (unnecessary `clone()`, `Arc` where `&` suffices)
- Go: check for non-idiomatic error handling, inappropriate use of `interface{}`/`any`
- TypeScript: check for `any` types, missing strict null checks
- C: check for missing `const` qualifiers, non-static file-scope functions

### Test analysis:
- Tests **deleted** in the diff → which behaviors are no longer covered?
- **Weakened** assertions (e.g., `assert_eq!` → `assert!`, exact → approximate) → masked regressions?
- Tests marked `.skip`, `#[ignore]`, `t.Skip()`, `@pytest.mark.skip` → hidden debt?
- New functions/handlers **without associated tests** → uncovered areas
- Regression tests for fixed bugs → present?
- **Stack-specific test patterns**:
  - Rust: `#[cfg(test)]` module present for new modules?
  - Go: `_test.go` file for new packages?
  - TypeScript: `.test.ts` / `.spec.ts` for new modules?
  - Python: `test_*.py` for new modules?
  - C: test harness coverage for new functions?

### Output: Report sections §5 and §6.

---

## Agent 5 — QA & Report Synthesizer

### Mission:
Verify finding consistency and produce the final consolidated report.

### Actions:
1. Collect outputs from agents 2, 3, and 4.
2. **Deduplicate** overlapping findings between security and regressions.
3. **Verify completeness**: compare the list of modified files vs files covered by the audit.
4. Run **lint and audit tools** adapted to the detected stack:
   - TypeScript/JS: `npx tsc --noEmit`, `npx eslint .`, `npm audit`
   - Rust: `cargo clippy -- -D warnings`, `cargo audit`
   - Go: `go vet ./...`, `golangci-lint run`
   - Python: `ruff check .`, `mypy --strict`, `pip-audit`
   - PHP: `composer audit`, `vendor/bin/phpstan analyse`, `vendor/bin/php-cs-fixer fix --dry-run --diff`
   - C/C++: `cppcheck --enable=all .` (if available)
   - Terraform: `terraform validate`, `terraform fmt -check`, `tfsec .` (if available)
   - Docker: `hadolint Dockerfile*` (if available)
   - K8s: `kubesec scan <manifests>` (if available)
   Execute only tools that are available. Note missing tools in the report.
5. **Calculate the overall risk score**:
   - 🔴 Critical: at least one 🔴 security finding, OR unmigrated breaking change, OR memory safety issue
   - 🟠 High: 🟠 security findings without 🔴, OR confirmed functional regressions
   - 🟡 Medium: quality findings or missing tests, no critical security issues
   - 🔵 Low: cosmetic changes, documentation, risk-free refactoring
6. Formulate the **recommendation**:
   - **BLOCK**: if at least one 🔴 Critical finding
   - **FIXES REQUIRED**: if 🟠 findings but no 🔴
   - **OK to merge**: only 🟡/🔵 findings or no findings at all
7. Write the final structured report in CLAUDE.local.md.
8. Prioritize §7 (recommendations) by decreasing impact.
