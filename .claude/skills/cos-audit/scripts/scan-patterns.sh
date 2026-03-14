#!/usr/bin/env bash
# scan-patterns.sh — Scan diff for dangerous patterns (polyglot edition)
# Council of Singulars
# Usage: scan-patterns.sh <base_ref> <compare_ref>
# Example: scan-patterns.sh origin/master HEAD

set -euo pipefail

BASE="${1:?Usage: scan-patterns.sh <base_ref> <compare_ref>}"
COMPARE="${2:?Usage: scan-patterns.sh <base_ref> <compare_ref>}"
DIFF_RANGE="${BASE}...${COMPARE}"

echo "=== PATTERN SCAN: ${DIFF_RANGE} ==="
echo "Scanning for dangerous patterns in added lines (+ lines only)..."
echo ""

# Get only added lines from the diff
DIFF_ADDED=$(git diff "$DIFF_RANGE" | grep '^+' | grep -v '^+++' || true)

if [ -z "$DIFF_ADDED" ]; then
    echo "⚠️  No added lines found in diff. Check branch references."
    exit 0
fi

TOTAL_FINDINGS=0

scan_pattern() {
    local label="$1"
    local pattern="$2"
    local severity="$3"

    local matches
    matches=$(echo "$DIFF_ADDED" | grep -inE "$pattern" 2>/dev/null || true)

    if [ -n "$matches" ]; then
        local count
        count=$(echo "$matches" | wc -l)
        TOTAL_FINDINGS=$((TOTAL_FINDINGS + count))
        echo "${severity} ${label} (${count} occurrence(s)):"
        echo "$matches" | head -20
        if [ "$count" -gt 20 ]; then
            echo "  ... and $((count - 20)) more"
        fi
        echo ""
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
#  🔴 CRITICAL PATTERNS (all languages)
# ═══════════════════════════════════════════════════════════════════════════════

echo "--- 🔴 CRITICAL PATTERNS ---"
echo ""

# --- Universal ---

scan_pattern "Hardcoded secrets/credentials" \
    '(password|secret|api_key|apikey|token|credential|private_key)\s*[=:]\s*["\x27][^"\x27]{8,}' \
    "🔴"

scan_pattern "Debug output in production code" \
    '\b(dump|dd|var_dump|print_r|console\.log|debugger|dbg!|println!.*debug|log\.Debug|pprint|breakpoint\(\))\s*\(' \
    "🔴"

# --- PHP / Dynamic languages ---

scan_pattern "eval/exec with potential user data (PHP/Python/JS)" \
    'eval\s*\(|exec\s*\(|system\s*\(|passthru\s*\(|shell_exec\s*\(|proc_open\s*\(|os\.system\s*\(|subprocess\.call.*shell\s*=\s*True' \
    "🔴"

# --- C / C++ ---

scan_pattern "Unsafe C string functions (buffer overflow)" \
    '\b(strcpy|strcat|sprintf|gets|scanf)\s*\(' \
    "🔴"

scan_pattern "C/C++ format string vulnerability" \
    'printf\s*\(\s*[a-zA-Z_]' \
    "🔴"

# --- Rust ---

scan_pattern "Rust unsafe blocks" \
    '\bunsafe\s*\{|\bunsafe\s+fn\b|\bunsafe\s+impl\b' \
    "🔴"

scan_pattern "Rust .unwrap() in non-test code" \
    '\.unwrap\(\)|\.expect\(' \
    "🔴"

# --- napi-rs / FFI ---

scan_pattern "napi-rs unsafe FFI or raw pointer at boundary" \
    '#\[napi\].*unsafe|napi::bindgen_prelude::.*raw|as_mut_ptr|from_raw' \
    "🔴"

# --- SQL / Database ---

scan_pattern "Raw SQL concatenation (injection risk)" \
    '(\+\s*["\x27].*SELECT|format!.*SELECT|f".*SELECT|\.query\(.*\+|\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE))' \
    "🔴"

# --- Terraform ---

scan_pattern "Terraform hardcoded secrets" \
    '(access_key|secret_key|password|token)\s*=\s*"[^"]{8,}"' \
    "🔴"

# --- Kubernetes ---

scan_pattern "K8s privileged container" \
    'privileged:\s*true|allowPrivilegeEscalation:\s*true' \
    "🔴"

scan_pattern "K8s host namespace sharing" \
    'hostNetwork:\s*true|hostPID:\s*true|hostIPC:\s*true' \
    "🔴"

# ═══════════════════════════════════════════════════════════════════════════════
#  🟠 HIGH PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

echo "--- 🟠 HIGH PATTERNS ---"
echo ""

# --- XSS vectors ---

scan_pattern "Unescaped output (XSS vectors)" \
    '\|raw\b|v-html|innerHTML|dangerouslySetInnerHTML|\{!!|\.html\(|\.safe\b' \
    "🟠"

# --- PHP / Dynamic ---

scan_pattern "Direct user input in DB queries (PHP)" \
    '(findBy|findOneBy|createQueryBuilder).*\$(request|input|params|_GET|_POST|_REQUEST)' \
    "🟠"

# --- Go ---

scan_pattern "Go error silently discarded" \
    ',\s*_\s*:?=.*\.\w+\(|_\s*=\s*\w+\.\w+\(' \
    "🟠"

scan_pattern "Go unsafe package usage" \
    'import\s+.*"unsafe"|\bunsafe\.Pointer\b' \
    "🟠"

# --- Rust ---

scan_pattern "Rust transmute (type coercion bypass)" \
    'std::mem::transmute|mem::transmute' \
    "🟠"

# --- Permissions / CORS ---

scan_pattern "Permissive CORS" \
    'Access-Control-Allow-Origin.*\*|cors.*origin.*\*|AllowAllOrigins\s*:\s*true' \
    "🟠"

scan_pattern "Missing CSRF protection patterns" \
    '(method\s*=\s*["\x27]POST["\x27]|@(Delete|Put|Patch)Mapping)' \
    "🟠"

# --- C / C++ ---

scan_pattern "C/C++ use-after-free patterns" \
    'free\s*\(.*\);\s*$' \
    "🟠"

scan_pattern "C/C++ unchecked malloc/calloc" \
    '=\s*(malloc|calloc|realloc)\s*\([^;]*;\s*$' \
    "🟠"

# --- Terraform ---

scan_pattern "Terraform permissive security group (0.0.0.0/0)" \
    'cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0/0"\s*\]|source_ranges\s*=\s*\[\s*"0\.0\.0\.0/0"\s*\]' \
    "🟠"

scan_pattern "Terraform resource deletion/rename (state break)" \
    '^\-resource\s|^\-\s+name\s*=' \
    "🟠"

# --- Kubernetes ---

scan_pattern "K8s container running as root" \
    'runAsNonRoot:\s*false|runAsUser:\s*0' \
    "🟠"

scan_pattern "K8s no resource limits" \
    'resources:\s*\{\}|resources:\s*$' \
    "🟠"

# --- ASM ---

scan_pattern "ASM direct syscall (potential backdoor)" \
    'syscall|int\s+0x80|int\s+80h|sysenter' \
    "🟠"

# ═══════════════════════════════════════════════════════════════════════════════
#  🟡 MEDIUM PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

echo "--- 🟡 MEDIUM PATTERNS ---"
echo ""

scan_pattern "TODO/FIXME/HACK comments" \
    '\b(TODO|FIXME|HACK|XXX|TEMPORARY|TEMP)\b' \
    "🟡"

scan_pattern "Disabled tests" \
    '(\.skip|\.only|@group\s+ignore|this->markTestSkipped|test\.todo|#\[ignore\]|@pytest\.mark\.skip|t\.Skip)' \
    "🟡"

scan_pattern "Magic numbers in logic" \
    'if\s*\(.*[=<>!]+\s*\d{2,}\s*\)|return\s+\d{3,}|sleep\s*\(\s*\d{2,}|Duration::from_secs\(\d{2,}' \
    "🟡"

scan_pattern "Empty catch/error blocks" \
    'catch\s*\([^)]*\)\s*\{\s*\}|except:\s*$|except\s+\w+:\s*pass|if err != nil \{\s*\}' \
    "🟡"

scan_pattern "Rust allow(clippy) suppression" \
    '#\[allow\(clippy::' \
    "🟡"

scan_pattern "Go nolint directive" \
    '//\s*nolint' \
    "🟡"

scan_pattern "TypeScript @ts-ignore / @ts-expect-error" \
    '@ts-ignore|@ts-expect-error|@ts-nocheck' \
    "🟡"

scan_pattern "Python type: ignore" \
    '#\s*type:\s*ignore' \
    "🟡"

# ═══════════════════════════════════════════════════════════════════════════════
#  🔵 INFO PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

echo "--- 🔵 INFO PATTERNS ---"
echo ""

scan_pattern "New dependencies added" \
    '"require":|"dependencies":|pip install|go get|cargo add|\[dependencies\]' \
    "🔵"

scan_pattern "Configuration changes" \
    '(\.env|config\.yml|config\.yaml|config\.toml|\.ini|settings\.|terraform\.tfvars)' \
    "🔵"

scan_pattern "Dockerfile changes" \
    'FROM\s|EXPOSE\s|ENTRYPOINT\s|CMD\s' \
    "🔵"

scan_pattern "Migration files" \
    'CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX|ADD COLUMN|DROP COLUMN' \
    "🔵"

scan_pattern "ORM migration patterns (Mongoose/Drizzle/Prisma/Diesel)" \
    'mongoose\.model|new Schema\(|drizzle\(|pgTable\(|diesel::table!|\.migrate\(' \
    "🔵"

scan_pattern "Model/Schema file deletion (verify migration order)" \
    '^\-.*\.model\.(ts|js|py)|^\-.*schema\.(ts|rs|go)' \
    "🔵"

# ═══════════════════════════════════════════════════════════════════════════════
#  SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo "=== END PATTERN SCAN ==="
echo ""
echo "Total heuristic matches: ${TOTAL_FINDINGS}"
echo ""
echo "⚠️  These are heuristic matches on added lines only."
echo "   Each match requires manual review by the appropriate agent to confirm or dismiss."
echo "   False positives are expected — the goal is zero false negatives on critical patterns."
