#!/usr/bin/env bash
# detect-stack.sh — Auto-detect project stack for adaptive audit checklists
# Council of Singulars — polyglot edition
# Output: structured summary of detected technologies

set -euo pipefail

echo "=== STACK DETECTION ==="
echo ""

DETECTED=0

# ─── TypeScript / JavaScript / Node.js ───────────────────────────────────────

if [ -f "package.json" ]; then
    echo "📦 Node.js project detected (package.json found)"
    DETECTED=$((DETECTED + 1))

    # Package manager detection
    if [ -f "pnpm-workspace.yaml" ] || [ -f "pnpm-lock.yaml" ]; then
        echo "  → pnpm (monorepo workspace)"
        if [ -f "pnpm-workspace.yaml" ]; then
            WORKSPACE_COUNT=$(grep -c '^\s*-' pnpm-workspace.yaml 2>/dev/null || echo "?")
            echo "    Workspace packages: ~${WORKSPACE_COUNT}"
        fi
    elif [ -f "yarn.lock" ]; then
        echo "  → Yarn"
    elif [ -f "package-lock.json" ]; then
        echo "  → npm"
    fi

    if grep -q '"typescript"' package.json 2>/dev/null; then
        echo "  → TypeScript"
    fi

    if grep -q '"react"' package.json 2>/dev/null; then
        echo "  → React"
    fi

    if grep -q '"vue"' package.json 2>/dev/null; then
        echo "  → Vue.js"
    fi

    if grep -q '"next"' package.json 2>/dev/null; then
        echo "  → Next.js"
    fi

    if grep -q '"express"' package.json 2>/dev/null; then
        echo "  → Express.js"
    fi

    if grep -q '"fastify"' package.json 2>/dev/null; then
        echo "  → Fastify"
    fi

    if grep -q '"@nestjs/core"' package.json 2>/dev/null; then
        echo "  → NestJS"
    fi

    if grep -q '"prisma"' package.json 2>/dev/null || grep -q '"@prisma/client"' package.json 2>/dev/null; then
        echo "  → Prisma ORM"
    fi

    if grep -q '"drizzle-orm"' package.json 2>/dev/null; then
        echo "  → Drizzle ORM"
    fi

    if grep -q '"eslint"' package.json 2>/dev/null; then
        echo "  → ESLint (linter)"
    fi

    if grep -q '"biome"' package.json 2>/dev/null || grep -q '"@biomejs/biome"' package.json 2>/dev/null; then
        echo "  → Biome (linter/formatter)"
    fi

    if grep -q '"vitest"' package.json 2>/dev/null; then
        echo "  → Vitest (test runner)"
    fi

    if grep -q '"jest"' package.json 2>/dev/null; then
        echo "  → Jest (test runner)"
    fi

    if grep -q '"apexcharts"' package.json 2>/dev/null; then
        echo "  → ApexCharts (XSS vector in chart data: CHECK)"
    fi

    if grep -q '"chart.js"' package.json 2>/dev/null; then
        echo "  → Chart.js (XSS vector in chart data: CHECK)"
    fi

    if grep -q '"hono"' package.json 2>/dev/null; then
        echo "  → Hono (web framework)"
    fi

    if grep -q '"mongoose"' package.json 2>/dev/null; then
        echo "  → Mongoose (MongoDB ODM)"
    fi

    if grep -q '"@electric-sql/pglite"' package.json 2>/dev/null; then
        echo "  → PGlite (in-process PostgreSQL for testing)"
    fi

    # Scan sub-packages in monorepo
    if [ -f "pnpm-workspace.yaml" ]; then
        for subpkg in packages/*/package.json; do
            [ -f "$subpkg" ] || continue
            PKG_NAME=$(grep -o '"name"\s*:\s*"[^"]*"' "$subpkg" | head -1 | sed 's/.*"\([^"]*\)"/\1/')
            PKG_DIR=$(dirname "$subpkg")

            SUB_DEPS=""
            if grep -q '"@napi-rs/cli"' "$subpkg" 2>/dev/null || grep -q '"napi"' "$subpkg" 2>/dev/null; then
                SUB_DEPS="${SUB_DEPS} napi-rs(Rust↔Node FFI: SECURITY AUDIT CRITICAL)"
            fi
            if grep -q '"hono"' "$subpkg" 2>/dev/null; then
                SUB_DEPS="${SUB_DEPS} Hono"
            fi
            if grep -q '"mongoose"' "$subpkg" 2>/dev/null; then
                SUB_DEPS="${SUB_DEPS} Mongoose"
            fi
            if grep -q '"drizzle-orm"' "$subpkg" 2>/dev/null; then
                SUB_DEPS="${SUB_DEPS} Drizzle"
            fi
            if grep -q '"react"' "$subpkg" 2>/dev/null; then
                SUB_DEPS="${SUB_DEPS} React"
            fi

            if [ -n "$SUB_DEPS" ]; then
                echo "  📦 ${PKG_NAME} (${PKG_DIR}):${SUB_DEPS}"
            fi
        done
    fi

    echo ""
fi

# ─── Rust ────────────────────────────────────────────────────────────────────

if [ -f "Cargo.toml" ]; then
    echo "🦀 Rust project detected (Cargo.toml found)"
    DETECTED=$((DETECTED + 1))

    if grep -q '\[workspace\]' Cargo.toml 2>/dev/null; then
        MEMBER_COUNT=$(grep -c 'members' Cargo.toml 2>/dev/null || echo "?")
        echo "  → Workspace project (members section found)"
    fi

    if grep -q 'tokio' Cargo.toml 2>/dev/null; then
        echo "  → Tokio (async runtime)"
    fi

    if grep -q 'actix-web' Cargo.toml 2>/dev/null; then
        echo "  → Actix-web (web framework)"
    fi

    if grep -q 'axum' Cargo.toml 2>/dev/null; then
        echo "  → Axum (web framework)"
    fi

    if grep -q 'diesel' Cargo.toml 2>/dev/null; then
        echo "  → Diesel (ORM)"
    fi

    if grep -q 'sqlx' Cargo.toml 2>/dev/null; then
        echo "  → SQLx (async SQL)"
    fi

    if grep -q 'serde' Cargo.toml 2>/dev/null; then
        echo "  → Serde (serialization)"
    fi

    # napi-rs detection (Rust↔Node.js FFI)
    NAPI_FOUND=false
    if grep -q 'napi' Cargo.toml 2>/dev/null; then
        NAPI_FOUND=true
    fi
    # Also check workspace member Cargo.toml files
    for member_toml in packages/*/Cargo.toml; do
        [ -f "$member_toml" ] || continue
        if grep -q 'napi' "$member_toml" 2>/dev/null; then
            NAPI_FOUND=true
            echo "  → napi-rs in $(dirname "$member_toml") (Rust↔Node FFI: SECURITY AUDIT on boundary)"
        fi
    done
    if [ "$NAPI_FOUND" = true ] && ! grep -q 'napi' Cargo.toml 2>/dev/null; then
        : # already printed from member
    elif grep -q 'napi' Cargo.toml 2>/dev/null; then
        echo "  → napi-rs (Rust↔Node FFI: SECURITY AUDIT on boundary)"
    fi

    if grep -q 'unsafe' Cargo.toml 2>/dev/null || find . -name "*.rs" -exec grep -l 'unsafe' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  ⚠️  unsafe code detected — requires security review"
    fi

    echo ""
fi

# ─── Go ──────────────────────────────────────────────────────────────────────

if [ -f "go.mod" ]; then
    echo "🐹 Go project detected (go.mod found)"
    DETECTED=$((DETECTED + 1))

    GO_VERSION=$(grep '^go ' go.mod | awk '{print $2}' || echo "unknown")
    echo "  → Go version: ${GO_VERSION}"

    if grep -q 'github.com/gin-gonic/gin' go.mod 2>/dev/null; then
        echo "  → Gin (web framework)"
    fi

    if grep -q 'github.com/labstack/echo' go.mod 2>/dev/null; then
        echo "  → Echo (web framework)"
    fi

    if grep -q 'github.com/gofiber/fiber' go.mod 2>/dev/null; then
        echo "  → Fiber (web framework)"
    fi

    if grep -q 'google.golang.org/grpc' go.mod 2>/dev/null; then
        echo "  → gRPC"
    fi

    if grep -q 'gorm.io/gorm' go.mod 2>/dev/null; then
        echo "  → GORM (ORM)"
    fi

    if grep -q 'github.com/jackc/pgx' go.mod 2>/dev/null; then
        echo "  → pgx (PostgreSQL driver)"
    fi

    echo ""
fi

# ─── Python ──────────────────────────────────────────────────────────────────

if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "Pipfile" ]; then
    echo "🐍 Python project detected"
    DETECTED=$((DETECTED + 1))

    PYCONF=""
    [ -f "pyproject.toml" ] && PYCONF="pyproject.toml"
    [ -f "requirements.txt" ] && PYCONF="${PYCONF} requirements.txt"

    for f in $PYCONF; do
        if grep -qi "django" "$f" 2>/dev/null; then
            echo "  → Django"
        fi
        if grep -qi "fastapi" "$f" 2>/dev/null; then
            echo "  → FastAPI"
        fi
        if grep -qi "flask" "$f" 2>/dev/null; then
            echo "  → Flask"
        fi
        if grep -qi "sqlalchemy" "$f" 2>/dev/null; then
            echo "  → SQLAlchemy (ORM)"
        fi
        if grep -qi "pydantic" "$f" 2>/dev/null; then
            echo "  → Pydantic"
        fi
        if grep -qi "celery" "$f" 2>/dev/null; then
            echo "  → Celery (task queue)"
        fi
    done

    echo ""
fi

# ─── PHP / Symfony / Laravel ─────────────────────────────────────────────────

if [ -f "composer.json" ]; then
    echo "🐘 PHP project detected (composer.json found)"
    DETECTED=$((DETECTED + 1))

    if grep -q '"symfony/framework-bundle"' composer.json 2>/dev/null; then
        SYMFONY_VERSION=$(grep '"symfony/framework-bundle"' composer.json | grep -oP '[\d.]+' | head -1)
        echo "  → Symfony framework (v${SYMFONY_VERSION:-unknown})"
    fi

    if grep -q '"laravel/framework"' composer.json 2>/dev/null; then
        echo "  → Laravel framework"
    fi

    if grep -q '"doctrine/mongodb-odm"' composer.json 2>/dev/null; then
        echo "  → Doctrine MongoDB ODM (multi-tenant audit: CRITICAL)"
    fi

    if grep -q '"doctrine/orm"' composer.json 2>/dev/null; then
        echo "  → Doctrine ORM"
    fi

    if grep -q '"phpunit/phpunit"' composer.json 2>/dev/null; then
        echo "  → PHPUnit (test runner)"
    fi

    if grep -q '"phpstan/phpstan"' composer.json 2>/dev/null; then
        echo "  → PHPStan (static analysis)"
    fi

    if grep -q '"friendsofphp/php-cs-fixer"' composer.json 2>/dev/null; then
        echo "  → PHP-CS-Fixer (coding standards)"
    fi

    echo ""
fi

# ─── C / C++ ────────────────────────────────────────────────────────────────

C_DETECTED=false
if [ -f "CMakeLists.txt" ] || [ -f "Makefile" ] || [ -f "meson.build" ]; then
    # Verify there are actually C/C++ source files
    if find . -maxdepth 4 -name "*.c" -o -name "*.cpp" -o -name "*.cc" -o -name "*.h" -o -name "*.hpp" 2>/dev/null | head -1 | grep -q .; then
        echo "⚙️  C/C++ project detected"
        DETECTED=$((DETECTED + 1))
        C_DETECTED=true

        [ -f "CMakeLists.txt" ] && echo "  → CMake build system"
        [ -f "Makefile" ] && echo "  → Makefile build system"
        [ -f "meson.build" ] && echo "  → Meson build system"

        # Check for common patterns
        if find . -maxdepth 4 -name "*.c" -exec grep -l 'malloc\|calloc\|realloc\|free' {} \; 2>/dev/null | head -1 | grep -q .; then
            echo "  ⚠️  Manual memory management detected — buffer overflow audit CRITICAL"
        fi

        if find . -maxdepth 4 -name "*.c" -o -name "*.cpp" 2>/dev/null | xargs grep -l 'strcpy\|strcat\|sprintf\|gets' 2>/dev/null | head -1 | grep -q .; then
            echo "  🔴 Unsafe string functions detected (strcpy/strcat/sprintf/gets) — IMMEDIATE REVIEW"
        fi

        echo ""
    fi
fi

# ─── Assembly (ASM) ─────────────────────────────────────────────────────────

if find . -maxdepth 4 -name "*.asm" -o -name "*.s" -o -name "*.S" -o -name "*.nasm" 2>/dev/null | head -1 | grep -q .; then
    echo "🔧 Assembly files detected"
    DETECTED=$((DETECTED + 1))

    if find . -maxdepth 4 -name "*.asm" -o -name "*.nasm" 2>/dev/null | xargs grep -li 'syscall\|int 0x80\|int 80h' 2>/dev/null | head -1 | grep -q .; then
        echo "  → Direct syscalls detected — security audit required"
    fi

    X86_COUNT=$(find . -maxdepth 4 -name "*.asm" -o -name "*.s" -o -name "*.S" -o -name "*.nasm" 2>/dev/null | wc -l)
    echo "  → ${X86_COUNT} assembly file(s)"
    echo ""
fi

# ─── Infrastructure: Docker ──────────────────────────────────────────────────

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] || [ -f "compose.yml" ] || [ -f "compose.yaml" ]; then
    COMPOSE_FILE=""
    for f in docker-compose.yml docker-compose.yaml compose.yml compose.yaml; do
        [ -f "$f" ] && COMPOSE_FILE="$f" && break
    done
    echo "🐳 Docker Compose detected (${COMPOSE_FILE})"

    if grep -q "postgres" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → PostgreSQL"
    fi
    if grep -q "mongo" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → MongoDB"
    fi
    if grep -q "redis" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → Redis"
    fi
    if grep -q "mysql\|mariadb" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → MySQL/MariaDB"
    fi
    if grep -q "elasticsearch\|opensearch" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → Elasticsearch/OpenSearch"
    fi
    if grep -q "rabbitmq" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → RabbitMQ"
    fi
    if grep -q "kafka" "$COMPOSE_FILE" 2>/dev/null; then
        echo "  → Kafka"
    fi
    echo ""
fi

if find . -maxdepth 2 -name "Dockerfile*" 2>/dev/null | head -1 | grep -q .; then
    DOCKERFILE_COUNT=$(find . -maxdepth 3 -name "Dockerfile*" 2>/dev/null | wc -l)
    echo "🐳 Dockerfile(s) detected: ${DOCKERFILE_COUNT}"
    echo ""
fi

# ─── Infrastructure: Kubernetes ──────────────────────────────────────────────

if [ -d "k8s" ] || [ -d "kubernetes" ] || [ -d ".kube" ] || [ -d "deploy" ] || find . -maxdepth 3 -name "*.yaml" -exec grep -l 'apiVersion.*apps/v1\|kind: Deployment\|kind: Service\|kind: Ingress' {} \; 2>/dev/null | head -1 | grep -q .; then
    echo "☸️  Kubernetes manifests detected"

    if find . -maxdepth 4 -name "*.yaml" -exec grep -l 'kind: Deployment' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Deployments"
    fi
    if find . -maxdepth 4 -name "*.yaml" -exec grep -l 'kind: Service' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Services"
    fi
    if find . -maxdepth 4 -name "*.yaml" -exec grep -l 'kind: Ingress\|kind: IngressRoute' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Ingress"
    fi
    if find . -maxdepth 4 -name "*.yaml" -exec grep -l 'kind: CronJob\|kind: Job' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Jobs/CronJobs"
    fi
    if find . -maxdepth 4 -name "*.yaml" -exec grep -l 'kind: NetworkPolicy' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → NetworkPolicies"
    fi

    echo ""
fi

# ─── Infrastructure: Terraform ───────────────────────────────────────────────

if find . -maxdepth 3 -name "*.tf" 2>/dev/null | head -1 | grep -q .; then
    echo "🏗️  Terraform detected"

    TF_COUNT=$(find . -maxdepth 5 -name "*.tf" 2>/dev/null | wc -l)
    echo "  → ${TF_COUNT} .tf file(s)"

    if find . -maxdepth 5 -name "*.tf" -exec grep -l 'provider.*aws' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → AWS provider"
    fi
    if find . -maxdepth 5 -name "*.tf" -exec grep -l 'provider.*google' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → GCP provider"
    fi
    if find . -maxdepth 5 -name "*.tf" -exec grep -l 'provider.*azurerm' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Azure provider"
    fi
    if find . -maxdepth 5 -name "*.tf" -exec grep -l 'provider.*hcloud' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  → Hetzner Cloud provider"
    fi

    if find . -maxdepth 5 -name "*.tf" -exec grep -l 'resource.*aws_security_group\|resource.*google_compute_firewall\|resource.*azurerm_network_security' {} \; 2>/dev/null | head -1 | grep -q .; then
        echo "  ⚠️  Firewall/security group rules detected — security audit required"
    fi

    echo ""
fi

# ─── Databases (standalone configs) ─────────────────────────────────────────

if find . -maxdepth 3 -name "*.sql" 2>/dev/null | head -1 | grep -q .; then
    SQL_COUNT=$(find . -maxdepth 5 -name "*.sql" 2>/dev/null | wc -l)
    echo "🗄️  SQL files detected: ${SQL_COUNT}"
    echo ""
fi

if find . -maxdepth 3 -name "elasticsearch*.yml" -o -name "elasticsearch*.yaml" -o -name "kibana*.yml" 2>/dev/null | head -1 | grep -q .; then
    echo "🔍 Elasticsearch/Kibana configuration detected"
    echo ""
fi

if find . -maxdepth 3 -name "rabbitmq*.conf" -o -name "rabbitmq*.config" 2>/dev/null | head -1 | grep -q .; then
    echo "🐰 RabbitMQ configuration detected"
    echo ""
fi

# ─── Templates ───────────────────────────────────────────────────────────────

if find . -maxdepth 4 -name "*.twig" 2>/dev/null | head -1 | grep -q .; then
    echo "🎨 Twig templates detected (check |raw usage for XSS)"
fi

if find . -maxdepth 4 -name "*.blade.php" 2>/dev/null | head -1 | grep -q .; then
    echo "🎨 Blade templates detected (check {!! !!} usage for XSS)"
fi

if find . -maxdepth 4 -name "*.ejs" -o -name "*.hbs" -o -name "*.pug" 2>/dev/null | head -1 | grep -q .; then
    echo "🎨 Node.js templates detected (check unescaped output)"
fi

if find . -maxdepth 4 -name "*.jinja2" -o -name "*.j2" 2>/dev/null | head -1 | grep -q .; then
    echo "🎨 Jinja2 templates detected (check |safe usage for XSS)"
fi

echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────

echo "=== END STACK DETECTION ==="
echo ""
echo "Total technology groups detected: ${DETECTED}"
echo ""
echo "⚠️  Stack detection is heuristic. If a technology is missing, specify it manually."
