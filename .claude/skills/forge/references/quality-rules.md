# Quality & Security Rules

These rules are ALWAYS active. Every agent that writes or modifies code MUST apply them.

## Clean Code Rules (all agents)

1. **KISS**: write the simplest solution that works.
2. **YAGNI**: do NOT add functionality "just in case". Code for the current need.
3. **DRY**: if logic duplicated 3+ times → extract. BUT: don't force abstraction on 2 occurrences.
4. **Explicit naming**: ban `data`, `tmp`, `result`, `handleClick` without qualifier.
5. **Short functions**: one function = one role. Target ~30 lines max.
6. **No dead code**: remove commented code, unused imports, unused variables.
7. **No magic values**: hardcoded numbers/strings → named constants (except 0, 1, true, false, "").
8. **Consistency with existing code**: respect project conventions even if agent's style differs.
9. **Alphabetical key ordering**: in object literals, maps, configs — keys added/modified must be sorted.
10. **Minimal naming**: variable names minimum 2 characters. Ban single-letter variables.

## Security Rules (all agents)

1. **No injection**: NEVER build queries by concatenation with user data. Use bound parameters / query builder.
2. **No hardcoded secrets**: use environment variables or secret manager.
3. **Systematic escaping**: all data in views must be escaped by the framework's native mechanism. `dangerouslySetInnerHTML`, `|raw`, `.innerHTML` → mandatory justification + upstream sanitization.
4. **No dangerous functions**: NEVER `eval()`, `exec()`, `Function()`, `subprocess.call(shell=True)` with user data.
5. **Access control**: every endpoint verifies authentication AND authorization. No IDOR.
6. **Tenant isolation** (if multi-tenant): every query filters by current tenant.

## Security Escalation Policy

### Finding format
`File:line | Severity (🔴/🟠/🟡/🔵) | Description | Fix | Justification`

### Reinforced checklist (additional to base rules)

**XSS advanced:**
- No JS-side HTML construction with unescaped data
- User inputs in HTML attributes correctly encoded
- Content-Security-Policy headers coherent (if applicable)

**CSRF:**
- Forms use the framework's CSRF token
- Sensitive actions via POST/PUT/DELETE with CSRF verification

**Access control:**
- Every route checks authentication (middleware, decorators, guards)
- No IDOR: resource ownership verified for current user

**HTTP headers:**
- JSON responses with correct Content-Type, no sensitive data exposed
- Security headers (X-Content-Type-Options, X-Frame-Options…)

### Deep audit checklist (additional to reinforced)

**Dependencies:**
- `[audit_command]` (npm audit, pip-audit, composer audit, cargo audit…) — 0 critical vulnerabilities

**Framework configuration:**
- No debug mode, no sensitive data dumps in logs
- Services visibility correct, no dev routes exposed

**ORM/ODM specific:**
- Queries via official API (no raw queries bypassing filters)
- Tenant/soft-delete filters active and respected

## Stack-specific security adaptation

| Stack | Audit command | Key concerns |
|-------|-------------|--------------|
| TypeScript/Node | `npm audit` / `pnpm audit` | dangerouslySetInnerHTML, helmet headers, rate-limit |
| Python | `pip-audit`, `bandit` | ORM queryset (no raw SQL f-strings), CSRF middleware |
| Rust | `cargo audit` | unsafe blocks, memory safety, FFI boundaries |
| Go | `govulncheck` | SQL injection in raw queries, goroutine leaks |
| PHP | `composer audit` | CSRF tokens, Voter/IsGranted, ODM injection |
| C/C++ | static analysis (scan-build) | buffer overflows, format strings, use-after-free |

## Base Rules (all stacks)

- NEVER modify more than one file at a time without verifying the result
- PRESERVE existing functional code — do NOT refactor outside scope
- If a component breaks → `git checkout -- <file>` or `git restore <file>` IMMEDIATELY
- When in doubt → subagent Explore BEFORE modifying
- If context saturates → summarize state in CLAUDE.md, `/clear`, resume from plan
- After each verified modification, record the file in CLAUDE.md ("Modified files" section)

## Memory Safety Rules (C, C++, Rust)

- **C/C++**: ALWAYS `-fsanitize=address,undefined` in dev. Valgrind MANDATORY before done.
- **Rust**: ZERO undocumented `unsafe`. Prefer `&str` over `String` for read params. No `.unwrap()` in production.

## Concurrency Rules (Go, Rust, C++)

- **Go**: `go test -race ./...` MANDATORY. Channels for comms, `context.Context` everywhere.
- **Rust**: borrow checker is your ally. Prefer `tokio::sync::mpsc` over mutexes.
- **C++**: `std::jthread` (C++20), `std::scoped_lock` for multiple mutexes.

## Type Safety Rules (TypeScript, Python, PHP)

- **TypeScript**: `strict: true` MANDATORY. Zero `any`, zero unjustified `as`. Zod for runtime validation.
- **Python**: `mypy --strict` MUST pass. Pydantic v2 for external data.
- **PHP**: PHPStan level 8+. `declare(strict_types=1)` on every file.

## Anti-Hallucination

- For any technical recommendation you're unsure about → web_search.
- Unverifiable info → "⚠️ À vérifier: [information]".
- Never invent CLI commands or flags.
- C/C++/Rust: verify feature availability against standard/edition.
