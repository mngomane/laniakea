# Verification Promise Conditions

All conditions for the S6 completion promise block, organized by category.
Each generated prompt selects the relevant conditions based on active features.

## Base conditions (ALWAYS included)

```
- CLAUDE.md updated with plan, commands, decisions, rules
- Modified files list recorded in CLAUDE.md for human review
- No git add / git rm / git commit / git branch executed
- All CLAUDE.md conventions respected in produced code
- Lint/format executed on each modified file — 0 errors
- Assets rebuilt if JS/CSS/SCSS files modified
```

## Quality conditions

### Standard (always):
```
- Project lint commands pass without new errors
```

### Reinforced (if quality ≥ reinforced):
```
- Added code respects existing project style (verified by comparison with unmodified files)
```

### Audit (if quality = audit):
```
- Full quality report in CLAUDE.md: each file audited, findings by severity, proposed fixes
```

## Security conditions

### Reinforced (if security ≥ reinforced):
```
- Forms/mutations use the framework's CSRF protection
- API responses have correct Content-Type headers, no sensitive data exposed
```

### Deep audit (if security = deep-audit):
```
- Full security report in CLAUDE.md: findings with severity + exploitation scenario + fix
- [dependency_audit_command] executed — 0 unaddressed critical vulnerability
- Framework configuration audited: no debug mode, correct service visibility
- ORM/ODM queries use official API (no raw queries bypassing filters)
```

## Per-Stack conditions

### TypeScript (also applies to React, Vue, Node.js with TS)
```
- `tsc --noEmit` without errors
- `vitest run` (or `jest`) green
- `eslint .` (or `biome check`) clean
- Build succeeds without errors
```

### Rust
```
- `cargo build` succeeds
- `cargo test` green
- `cargo clippy -- -D warnings` clean
- `cargo fmt -- --check` clean
```

### Go
```
- `go build ./...` succeeds
- `go test -race ./...` green
- `golangci-lint run` clean
- `go vet ./...` clean
```

### Python
```
- `pytest` green
- `mypy --strict src/` passes
- `ruff check .` clean
```

### PHP
```
- `php vendor/bin/phpstan analyse` passes
- `php vendor/bin/phpunit` green
- `php vendor/bin/php-cs-fixer fix --dry-run` clean
```

### C
```
- `cmake --build build` without warnings (`-Werror`)
- `ctest` green
- Valgrind clean (zero leaks)
```

### C++
```
- Build without warnings (`-Werror`)
- Tests green
- Valgrind/ASan clean
```

## TDD conditions (if TDD active)

```
- ALL tests pass ([test_command] returns 0 errors)
- NO existing test was modified without explicit human agreement
- Each new public function/method has at least one associated test
- TDD journal in CLAUDE.md complete: each Red→Green→Refactor cycle logged with 🔴/🟢/🔄
- Test coverage has not decreased compared to initial state
- No test is marked `.skip`, `.only`, or commented out to bypass a failure
```

## VRT conditions (if VRT active)

```
- Baseline scan S0 (reference) logged in CLAUDE.md BEFORE any CSS modification
- Final scan S[N] logged in CLAUDE.md with complete per-page matrix
- No 🔴 (critical) regression in final scan of priority pages
- Global CSS coverage documented: [X]% ([covered]/[ref_total] classes)
- Every missing CSS class listed with category and impacted pages
```

## Browser Testing conditions (ALWAYS included)

### If Chrome MCP available:
```
- Browser test executed via Chrome MCP on each impacted page
- Zero critical JavaScript errors on tested pages
- Zero 5xx network errors on modified endpoints
- Browser test report logged in CLAUDE.md
```

### If Chrome MCP unavailable:
```
- Manual browser test instructions generated with URLs and scenarios
- Impacted pages documented in CLAUDE.md with "🔵 AWAITING HUMAN VALIDATION"
- Message displayed: "⚠️ Manual browser test required — see CLAUDE.md"
```

## Assembly rule

Select conditions and assemble in this order:
1. Base conditions
2. Quality conditions (level)
3. Security conditions (level)
4. Per-stack conditions
5. TDD conditions (if active)
6. VRT conditions (if active)
7. Browser Testing conditions (always — last before COMPLETE)

Total: minimum 8, maximum 15. If combining too many features exceeds 15,
merge related conditions or keep the most critical ones.
