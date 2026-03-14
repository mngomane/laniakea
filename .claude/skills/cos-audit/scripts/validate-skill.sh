#!/usr/bin/env bash
# validate-skill.sh — Verify cos-audit skill installation and functionality
# Run from the project root where the skill will be used (e.g., ~/council-of-singulars/laniakea)
#
# Usage:
#   bash ~/.claude/skills/cos-audit/scripts/validate-skill.sh
#   — or —
#   bash /path/to/cos-audit/scripts/validate-skill.sh

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

pass() { PASS=$((PASS + 1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  ❌ $1"; }
warn() { WARN=$((WARN + 1)); echo "  ⚠️  $1"; }

echo "=== COS-AUDIT SKILL VALIDATION ==="
echo "Skill directory: ${SKILL_DIR}"
echo "Working directory: $(pwd)"
echo ""

# ─── 1. Structure Check ─────────────────────────────────────────────────────

echo "── 1. Structure"

[ -f "${SKILL_DIR}/SKILL.md" ] && pass "SKILL.md exists" || fail "SKILL.md missing"
[ -f "${SKILL_DIR}/scripts/detect-stack.sh" ] && pass "detect-stack.sh exists" || fail "detect-stack.sh missing"
[ -f "${SKILL_DIR}/scripts/scan-patterns.sh" ] && pass "scan-patterns.sh exists" || fail "scan-patterns.sh missing"
[ -f "${SKILL_DIR}/references/security-checklist.md" ] && pass "security-checklist.md exists" || fail "security-checklist.md missing"
[ -f "${SKILL_DIR}/references/agent-roles.md" ] && pass "agent-roles.md exists" || fail "agent-roles.md missing"
[ -f "${SKILL_DIR}/references/clean-code-rules.md" ] && pass "clean-code-rules.md exists" || fail "clean-code-rules.md missing"
[ -f "${SKILL_DIR}/references/git-policy.md" ] && pass "git-policy.md exists" || fail "git-policy.md missing"

echo ""

# ─── 2. Permissions ──────────────────────────────────────────────────────────

echo "── 2. Permissions"

[ -x "${SKILL_DIR}/scripts/detect-stack.sh" ] && pass "detect-stack.sh is executable" || fail "detect-stack.sh not executable — run: chmod +x ${SKILL_DIR}/scripts/detect-stack.sh"
[ -x "${SKILL_DIR}/scripts/scan-patterns.sh" ] && pass "scan-patterns.sh is executable" || fail "scan-patterns.sh not executable — run: chmod +x ${SKILL_DIR}/scripts/scan-patterns.sh"

echo ""

# ─── 3. YAML Frontmatter ────────────────────────────────────────────────────

echo "── 3. YAML Frontmatter"

FIRST_LINE=$(head -1 "${SKILL_DIR}/SKILL.md")
if [ "$FIRST_LINE" = "---" ]; then
    pass "Frontmatter delimiter present"
else
    fail "SKILL.md does not start with '---' — frontmatter broken"
fi

if grep -q '^name: cos-audit' "${SKILL_DIR}/SKILL.md"; then
    pass "name: cos-audit found"
else
    fail "name field missing or wrong in frontmatter"
fi

if grep -q '^description:' "${SKILL_DIR}/SKILL.md"; then
    pass "description field found"
else
    fail "description field missing in frontmatter"
fi

# Check description length (should be < 1024 chars)
DESC_LEN=$(sed -n '/^description:/,/^---$/p' "${SKILL_DIR}/SKILL.md" | wc -c)
if [ "$DESC_LEN" -lt 1024 ]; then
    pass "description under 1024 chars (${DESC_LEN})"
else
    warn "description is ${DESC_LEN} chars — may be truncated (limit: 1024)"
fi

echo ""

# ─── 4. Git Context ──────────────────────────────────────────────────────────

echo "── 4. Git Context (from working directory)"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    pass "Inside a git repository"

    # Branch resolution fallback chain
    BASE_FOUND=false
    for candidate in origin/master origin/main; do
        if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
            pass "Base branch resolved: ${candidate}"
            BASE_FOUND=true
            BASE="$candidate"
            break
        fi
    done

    if [ "$BASE_FOUND" = false ]; then
        warn "No base branch found in fallback chain (origin/master → origin/main). Run 'git fetch --all' first."
    fi

    # HEAD check
    if git rev-parse HEAD >/dev/null 2>&1; then
        CURRENT=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
        pass "HEAD is valid (current branch: ${CURRENT})"
    else
        fail "HEAD cannot be resolved"
    fi

    # Diff preview (if base found)
    if [ "$BASE_FOUND" = true ]; then
        DIFF_COUNT=$(git diff "${BASE}...HEAD" --name-only 2>/dev/null | wc -l || echo "0")
        if [ "$DIFF_COUNT" -gt 0 ]; then
            pass "Diff ${BASE}...HEAD has ${DIFF_COUNT} changed file(s) — audit will have work to do"
        else
            warn "Diff ${BASE}...HEAD has 0 changed files — you may be on the same branch"
        fi
    fi
else
    warn "Not inside a git repository — skill requires git context"
fi

echo ""

# ─── 5. Stack Detection (dry run) ───────────────────────────────────────────

echo "── 5. Stack Detection (dry run)"

DETECT_OUTPUT=$("${SKILL_DIR}/scripts/detect-stack.sh" 2>&1 || true)

if echo "$DETECT_OUTPUT" | grep -q "STACK DETECTION"; then
    pass "detect-stack.sh runs without error"

    # Count detected groups
    TECH_GROUPS=$(echo "$DETECT_OUTPUT" | grep "Total technology groups detected:" | grep -oP '\d+' || echo "0")
    if [ "$TECH_GROUPS" -gt 0 ]; then
        pass "Detected ${TECH_GROUPS} technology group(s)"
    else
        warn "No technology groups detected — is this the right directory?"
    fi

    # Show what was detected
    echo ""
    echo "  Detected stack:"
    echo "$DETECT_OUTPUT" | grep -E '^\s*(📦|🦀|🐹|🐍|🐘|⚙️|🔧|🐳|☸️|🏗️|🗄️|🔍|🐰|🎨)' | sed 's/^/    /'
else
    fail "detect-stack.sh produced unexpected output"
fi

echo ""

# ─── 6. Script Syntax Check ─────────────────────────────────────────────────

echo "── 6. Script Syntax"

if bash -n "${SKILL_DIR}/scripts/detect-stack.sh" 2>/dev/null; then
    pass "detect-stack.sh syntax valid"
else
    fail "detect-stack.sh has syntax errors"
fi

if bash -n "${SKILL_DIR}/scripts/scan-patterns.sh" 2>/dev/null; then
    pass "scan-patterns.sh syntax valid"
else
    fail "scan-patterns.sh has syntax errors"
fi

echo ""

# ─── 7. Tool Availability ───────────────────────────────────────────────────

echo "── 7. Available Lint/Audit Tools (informational)"

check_tool() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "  ✅ $1 — $(command -v "$1")"
    else
        echo "  ⬜ $1 — not found (optional)"
    fi
}

check_tool "cargo"
check_tool "rustc"
check_tool "clippy-driver"
check_tool "node"
check_tool "pnpm"
check_tool "npm"
check_tool "npx"
check_tool "go"
check_tool "golangci-lint"
check_tool "python3"
check_tool "ruff"
check_tool "mypy"
check_tool "php"
check_tool "composer"
check_tool "gcc"
check_tool "cppcheck"
check_tool "terraform"
check_tool "tfsec"
check_tool "hadolint"
check_tool "kubectl"
check_tool "kubesec"

echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────

echo "=== VALIDATION SUMMARY ==="
echo "  ✅ Passed: ${PASS}"
echo "  ❌ Failed: ${FAIL}"
echo "  ⚠️  Warnings: ${WARN}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo "🟢 Skill is ready. Launch with: /cos-audit"
    echo ""
    echo "Quick start:"
    echo "  1. Open Claude Code in the project directory"
    echo "  2. Type: /cos-audit"
    echo "  3. Or describe what you want: 'audit the diff before merge'"
    exit 0
else
    echo "🔴 ${FAIL} check(s) failed — fix the issues above before using the skill."
    exit 1
fi
