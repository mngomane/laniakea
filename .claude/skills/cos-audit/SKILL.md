---
name: cos-audit
description: >
  Audits a Git diff between the current branch (HEAD) and the production branch before merge.
  Analyzes security, regressions, breaking changes, code quality, and test coverage across
  polyglot codebases (TypeScript, JavaScript, Rust, Go, Python, PHP, C/C++, ASM, Terraform, Kubernetes).
  Use this skill when the user asks to "audit the diff", "analyze changes before merge",
  "check the branch before merge", "pre-merge audit", "review branch diff",
  "compare with master", "compare with main", "what changed vs production",
  "diff audit", "pre-release check", "merge readiness", "code review the branch",
  or mentions "cos audit", "council audit", "security review", "regression check".
  Default: compares HEAD against origin/master (fallback: origin/main).
---

# Diff Audit — Pre-Merge Branch Analysis for Council of Singulars

> **Environment**: Claude Code on Council of Singulars (Hetzner SSH server).
> **Constraint**: READ-ONLY mission. Git write operations are FORBIDDEN — the human commits.
> **Polyglot**: TypeScript, JavaScript, Rust, Go, Python, PHP, C/C++, ASM, Shell, Terraform, Kubernetes, and more.

Exhaustive audit of a Git diff between two branches, producing a structured report in `CLAUDE.local.md` with a merge recommendation.

### File Strategy

| File | Scope | Git | Content |
|---|---|---|---|
| `CLAUDE.md` | Shared (all devs + agents) | Tracked & pushed | Project conventions, recurring patterns, permanent rules |
| `CLAUDE.local.md` | Local (this session) | **Not tracked** (`.gitignore`) | Full audit reports, temporary findings, branch-specific data |

**Principle**: `CLAUDE.md` stays lean — only durable, project-wide knowledge. `CLAUDE.local.md` absorbs all heavy audit data.

---

## Main Workflow

### Step 0 — Initialization (MANDATORY before any analysis)

1. **Read CLAUDE.md** in its entirety — project source of truth (conventions, commands, rules).
2. **Read all files in `.claude/rules/`** if the directory exists — project-specific gotchas and critical patterns.
3. **Determine branches** using the resolution logic below.
4. **Detect the stack**: run `scripts/detect-stack.sh` from the skill folder to adapt checklists.
5. **Fetch latest remote state**:
   ```bash
   git fetch --all --prune
   ```
6. **Diff inventory**:
   ```bash
   git diff <BASE>...<COMPARE> --stat
   git diff <BASE>...<COMPARE> --name-only
   git log <BASE>..<COMPARE> --oneline
   ```
7. **Scan for dangerous patterns**: run `scripts/scan-patterns.sh <BASE> <COMPARE>` and record results.

#### Branch Resolution Logic

If the user specified branches explicitly → use them as-is.

Otherwise, resolve the **base branch** with this fallback chain (first match wins):

```bash
# Try each candidate in order — use the first that exists
for candidate in origin/master origin/main; do
  if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
    BASE="$candidate"
    break
  fi
done
```

| Priority | Candidate | Rationale |
|----------|-----------|-----------|
| 1 | `origin/master` | Primary production branch |
| 2 | `origin/main` | Modern default |

> **Why not `origin/develop`?** The typical workflow is to work on `develop` (or `dev`) and audit the diff against production (`master`/`main`) before merge. Auditing develop against itself would produce an empty diff.

Compare branch defaults to `HEAD` (current branch with new code).

Expected diff direction: `<BASE>...<COMPARE>` — shows what COMPARE adds relative to BASE.

If **no candidate branch exists**, inform the user and ask which branch to use as base.

---

### Step 1 — Audit Plan

Categorize modified files by domain and create the plan in CLAUDE.local.md.

Adapt domains to the detected stack. Reference table (polyglot):

| Domain | Example Paths | Responsible Agent | Priority |
|---|---|---|---|
| Core logic / Business services | `src/`, `lib/`, `internal/`, `pkg/` | Security + Regression | 🔴 High |
| API / Routes / Handlers | `api/`, `routes/`, `handlers/`, `controllers/` | Security + Regression | 🔴 High |
| Data models / Schema / Migrations | `models/`, `schema/`, `migrations/`, `*.sql` | Regression | 🔴 High |
| FFI / Language boundaries | napi-rs bindings, cgo, WASM, `extern "C"` | Security + Regression | 🔴 High |
| Infrastructure / IaC | `terraform/`, `k8s/`, `Dockerfile`, `docker-compose.*` | Security + Regression | 🔴 High |
| Frontend / UI | `frontend/`, `web/`, `assets/`, `templates/` | Security (XSS) + Quality | 🟠 Medium |
| Tests | `tests/`, `test/`, `__tests__/`, `*_test.*`, `*.test.*` | Test Coverage | 🟠 Medium |
| Configuration | `config/`, `.env*`, `*.toml`, `*.yaml` | Regression | 🟡 Medium |
| Scripts / Tooling | `scripts/`, `tools/`, `Makefile` | Quality | 🔵 Low |
| Documentation | `docs/`, `*.md`, `README*` | Quality | 🔵 Low |

#### CLAUDE.md-driven priorities

The project's `CLAUDE.md` may define migration constraints, model deletion orders, or specific patterns to enforce. If such constraints exist, the audit MUST verify compliance. Examples:
- **Active migration** (e.g., ORM switch): verify that new code follows the target pattern and that the documented deletion order is respected.
- **Legacy directories** marked "do not modify": verify the diff does not touch them.
- **Project-specific rules** (e.g., "no `unsafe`", "no `.unwrap()` outside tests"): enforce as 🟠 findings if violated.

---

### Step 2 — Parallel Analysis (Agent Team)

Create an **agent team** with 5 agents in **delegate** mode (Shift+Tab). Split pane tmux.

Read `references/agent-roles.md` for detailed responsibilities of each agent.

**Role summary:**

| Agent | Role | Report Sections |
|---|---|---|
| **Agent 1 — Architect & Lead** | Coordination, plan, report merging | §1 Executive Summary, §7 Recommendations |
| **Agent 2 — Security Auditor** | Exhaustive security audit | §3 Security |
| **Agent 3 — Regression Analyst** | Regressions, breaking changes, schema | §2 Regressions, §4 Breaking Changes |
| **Agent 4 — Quality & Tests** | Clean code, test coverage | §5 Quality, §6 Tests |
| **Agent 5 — QA & Synthesizer** | Deduplication, consistency, final report | All sections (consolidation) |

**CRITICAL**: Every agent is **READ-ONLY on source files**. No source modifications. Git policy is absolute — read `references/git-policy.md`. This aligns with the Council of Singulars invariant: the human commits, agents code and analyze.

---

### Step 3 — Linting & Automated Audits

Agent 5 (QA) runs verification tools adapted to the detected stack. Execute only what applies.

**Important**: Read the project's `CLAUDE.md` for the canonical build/test/lint commands. The commands below are defaults — prefer project-specific commands when they exist.

**TypeScript / JavaScript:**
```bash
# Detect package manager (pnpm > yarn > npm)
if [ -f "pnpm-lock.yaml" ]; then PM="pnpm"; elif [ -f "yarn.lock" ]; then PM="yarn"; else PM="npm"; fi

$PM run lint                        # Project-defined linting (prefer this)
$PM run build                       # Build check (catches type errors in monorepos)
$PM audit                           # Dependency vulnerabilities

# If monorepo with workspace filters (pnpm):
# pnpm --filter <package> exec tsc --noEmit
# pnpm --filter <package> test
```

**Rust:**
```bash
cargo clippy --all-targets -- -D warnings  # Lint (must pass clean)
cargo test --no-run                        # Compile tests
cargo fmt -- --check                       # Format check
cargo audit                                # Dependency vulnerabilities
```

**Go:**
```bash
go vet ./...                        # Vet
golangci-lint run                   # Extended linting
go test -count=1 -run=^$ ./...      # Compile tests only
```

**Python:**
```bash
ruff check .                        # Linting
mypy --strict .                     # Type checking (if configured)
pip-audit                           # Dependency vulnerabilities
```

**PHP / Symfony:**
```bash
composer audit                      # Dependency vulnerabilities
vendor/bin/phpstan analyse          # Static analysis
vendor/bin/php-cs-fixer fix --dry-run --diff  # Coding standards
```

**C / C++:**
```bash
# If Makefile or CMakeLists.txt present:
make -n                             # Dry-run build
cppcheck --enable=all --error-exitcode=1 .   # Static analysis
```

**Terraform:**
```bash
terraform validate                  # Syntax validation
terraform fmt -check -recursive     # Format check
tfsec .                             # Security scanning
```

**Docker / Kubernetes:**
```bash
hadolint Dockerfile*                # Dockerfile linting
# For K8s manifests:
kubectl --dry-run=client -f <manifests>  # Validation
kubesec scan <manifests>            # Security scoring
```

---

### Step 4 — Final Report in CLAUDE.local.md

Write the report in CLAUDE.local.md under section `## Diff Audit <BASE>...<COMPARE> — [DATE]` with exactly 7 sections:

**§1 — Executive Summary**
- Number of modified files, lines added/removed.
- Detected stack(s) and languages.
- Overall risk score: 🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low.
- Recommendation: **BLOCK** merge / **FIXES REQUIRED** / **OK to merge**.

**§2 — Functional Regressions**
```
File:line | Severity | Description | Expected vs actual behavior | Proposed fix
```

**§3 — Security Issues**
```
File:line | Severity (🔴/🟠/🟡/🔵) | Vulnerability type | Exploitation scenario | Fix | Justification
```
A 🔴 finding = **BLOCKING** — merge cannot proceed without a fix.

**§4 — Breaking Changes**
- Modified function/method/struct signatures in public APIs
- DB schema changes (new fields, deletions, renames, indexes, migrations)
- API contracts (routes, payload, response format)
- ABI/FFI breaking changes (C/C++/Rust/Go)
- Terraform state-breaking changes (resource renames, deletions)
- Kubernetes resource changes (removed CRDs, changed service ports)

**§5 — Code Quality**
```
File:line | Rule violated (KISS/DRY/Naming/…) | Description | Proposed fix
```
Apply the 10 rules documented in `references/clean-code-rules.md`.

**§6 — Test Coverage**
- Deleted or weakened tests
- New behaviors without tests
- `.skip`/`.only`/`#[ignore]` tests introduced
- Coverage delta estimate if tooling available

**§7 — Prioritized Recommendations**
List ordered by decreasing impact of actions to take before merge.

---

### Step 5 — Verification Loop

DO NOT finish until ALL these conditions are met:

1. `git diff --stat` executed — complete file inventory
2. Every modified file in core paths analyzed by at least one agent
3. All relevant security vectors checked (read `references/security-checklist.md`)
4. DB schema, routes/handlers, services, config, and infra inspected
5. Test diff analyzed — deletions and weakened assertions identified
6. Clean code rules applied on files with high change density
7. Lint/audit tools executed — results included in the report
8. Complete report written in CLAUDE.local.md with all 7 sections
9. Final recommendation issued with justification
10. List of files covered by the audit recorded (completeness check)
11. **No source file modifications** — mission is 100% READ-ONLY
12. **No git write operations** — strict compliance with Council of Singulars git policy
13. Knowledge promotion to CLAUDE.md evaluated (Step 6)

When all conditions are verified → display:

> 📋 **AUDIT_DIFF_COMPLETE** — Report ready for human review in CLAUDE.local.md section "Diff Audit <BASE>...<COMPARE>"

---

### Step 6 — Knowledge Promotion to CLAUDE.md

After the report is finalized, evaluate whether the audit uncovered **project-level learnings** that benefit all developers and agents (including OpenClaw).

**Promote to CLAUDE.md only if the finding is:**
- A **recurring pattern** that future development should follow or avoid
- A **new convention** established by the diff
- A **critical gotcha** not obvious and would trap other developers or agents
- A **missing safeguard** that should become a team rule

**Do NOT promote:**
- Branch-specific findings (file:line references, per-file quality issues)
- Temporary data (diff stats, commit lists, lint output)
- Findings already covered by existing CLAUDE.md rules
- One-off bugs that don't reveal a systemic pattern

**Format in CLAUDE.md** — append under `## Audit Learnings` (create if absent):

```markdown
## Audit Learnings

- [DATE] <concise rule or convention — one line>
```

Keep entries short and actionable. Deduplicate before writing. Skip silently if nothing qualifies.

---

## Dimensioning Agent Teams

| Complexity | Agents | Examples |
|------------|--------|----------|
| Simple (< 20 files) | 1-2 | Bug fix, single endpoint, config change |
| Moderate (20-80 files) | 2-3 | New feature, partial refactor |
| Large (80-200 files) | 4-5 | Migration, new architecture, cross-cutting feature |
| Massive (> 200 files) | 5 (prioritized) | Major release — audit by risk priority, quick scan for rest |

---

## Edge Cases

- **Diff too large (>200 files)**: prioritize by risk (API handlers > Core logic > Services > rest). Audit high-risk files in detail, others in quick scan mode. Document coverage gaps.
- **Context saturated**: summarize current state in CLAUDE.local.md, `/clear`, resume from the plan.
- **Stack not detected**: ask the user to specify, or audit in generic mode (git diff + pattern grep).
- **No tests in the project**: document absence as a quality finding, do not block the audit.
- **Branches not found**: follow the fallback chain. If none exist, inform user and ask.
- **Mixed-language diff**: assign files to the appropriate stack checklist. A single diff can span multiple stacks.
- **Submodule changes**: note submodule pointer changes, flag if they point to unreviewed commits.
- **Binary files in diff**: flag them, note size changes, but do not attempt textual analysis.

---

## Installation Validation

After deploying the skill, verify the installation:

```bash
bash ~/.claude/skills/cos-audit/scripts/validate-skill.sh
```

This checks: file structure, permissions, YAML frontmatter, git context, branch resolution, stack detection, script syntax, and available tools. Fix any ❌ findings before using the skill.
