.PHONY: install build test check lint dev dev-web \
       engine-test engine-clippy engine-fmt engine-build \
       api-test api-check web-build web-check \
       verify clean legacy-build legacy-test legacy-install

# --- Project-wide ---

install:
	@pnpm install

build:
	@pnpm -r build

test:
	@pnpm -r test

check:
	@pnpm -r check

lint:
	@eslint packages/

# --- Dev servers ---

dev:
	@pnpm --filter @laniakea/api dev

dev-web:
	@pnpm --filter @laniakea/web dev

# --- Engine (Rust) ---

engine-test:
	@cd packages/engine && cargo test

engine-clippy:
	@cd packages/engine && cargo clippy --all-targets -- -D warnings

engine-fmt:
	@cd packages/engine && cargo fmt -- --check

engine-build:
	@cd packages/engine && napi build --release --platform

# --- API ---

api-test:
	@pnpm --filter @laniakea/api test

api-check:
	@pnpm --filter @laniakea/api exec tsc --noEmit

# --- Web ---

web-build:
	@pnpm --filter @laniakea/web build

web-check:
	@pnpm --filter @laniakea/web exec tsc --noEmit

# --- Full verification ---

verify:
	@echo "==> Engine: cargo test"
	@cd packages/engine && cargo test
	@echo "==> Engine: clippy"
	@cd packages/engine && cargo clippy --all-targets -- -D warnings
	@echo "==> Engine: fmt check"
	@cd packages/engine && cargo fmt -- --check
	@echo "==> API: typecheck"
	@pnpm --filter @laniakea/api exec tsc --noEmit
	@echo "==> API: tests"
	@pnpm --filter @laniakea/api test
	@echo "==> Web: typecheck"
	@pnpm --filter @laniakea/web exec tsc --noEmit
	@echo "==> Web: build"
	@pnpm --filter @laniakea/web build
	@echo "==> All checks passed"

# --- Cleanup ---

clean:
	@rm -rf packages/*/dist packages/engine/target packages/*/node_modules node_modules

# --- Legacy Go targets ---

legacy-build:
	@go test src/*.go
	@echo "\033[1;33mGenerating bin...\033[0m"
	@go build src/*.go
	@echo "\033[1;32mDone\033[0m"

legacy-test:
	@go test src/*.go

legacy-install:
	@./scripts/install.sh
