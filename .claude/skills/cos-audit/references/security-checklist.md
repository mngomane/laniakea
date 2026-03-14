# Security Checklist — In-Depth Audit (Polyglot Edition)

Checklist adapted to the project context. Sections apply conditionally based on the detected stack.

---

## Level 1 — Universal Rules (ALWAYS apply)

- [ ] No DB/query injection (no query concatenation — use parameterized queries, Query Builder, ORM)
- [ ] No hardcoded secrets (API keys, passwords, tokens, private keys in source code)
- [ ] Output escaping (auto-escaping enabled, no unjustified bypass)
- [ ] No `eval()` / `exec()` / `Function()` / `system()` with user data
- [ ] Access control on every route/endpoint
- [ ] User input validation and sanitization at trust boundaries
- [ ] No debug output in merged code (`dump`, `dd`, `console.log`, `dbg!`, `println!`, `log.Debug`)
- [ ] Dependencies audited for known vulnerabilities (`npm audit`, `cargo audit`, `pip-audit`, `composer audit`)
- [ ] No new dependencies without justification

## Level 2 — Multi-tenant (if applicable)

- [ ] Tenant isolation: every DB query filters by current organization/tenant
- [ ] No IDOR: verify resource belongs to user/tenant before access
- [ ] Aggregations scoped to tenant (no boundary crossing)
- [ ] New endpoints verified for tenant filtering

## Level 3 — TypeScript / JavaScript / Node.js

- [ ] No `innerHTML` / `v-html` / `dangerouslySetInnerHTML` with unsanitized user data
- [ ] No `eval()` or `new Function()` with dynamic input
- [ ] Express/Fastify: helmet or security headers configured
- [ ] `npm audit`: 0 critical vulnerabilities
- [ ] No dynamic `require()` or `import()` with user data
- [ ] Rate limiting on public endpoints
- [ ] CORS configured restrictively (no `*` in production)
- [ ] No `@ts-ignore` hiding type safety issues in security-critical code
- [ ] WebSocket connections authenticated and authorized
- [ ] JSON parsing with size limits on public endpoints

## Level 4 — Rust

- [ ] Every `unsafe` block justified with a SAFETY comment explaining the invariant
- [ ] No `.unwrap()` or `.expect()` on user-controlled data paths in production code
- [ ] No `std::mem::transmute` without explicit justification
- [ ] FFI boundaries validate all inputs from external code
- [ ] No data races: `Send`/`Sync` bounds respected
- [ ] `cargo audit`: 0 critical vulnerabilities
- [ ] `cargo clippy -- -D warnings` passes clean
- [ ] Integer overflow behavior considered (`checked_*`, `saturating_*`, or `wrapping_*` where appropriate)
- [ ] Lifetime annotations prevent dangling references at API boundaries
- [ ] No `#[allow(clippy::*)]` suppressing security-relevant lints

## Level 5 — Go

- [ ] Errors never silently discarded (`_ = someFunc()` on fallible operations)
- [ ] `go vet` + `golangci-lint` pass clean
- [ ] Context propagation correct (no leaked goroutines, proper cancellation)
- [ ] HTTP handlers use timeouts (`http.Server.ReadTimeout`, `WriteTimeout`)
- [ ] SQL queries use `$1` parameterized arguments, no `fmt.Sprintf` for queries
- [ ] No goroutine leaks (channels closed, contexts cancelled)
- [ ] Mutex usage reviewed for deadlocks (consistent lock ordering)
- [ ] `defer` used for cleanup in all resource-acquisition paths
- [ ] gRPC services authenticate and authorize calls (if applicable)

## Level 5b — FFI Boundaries (napi-rs, cgo, WASM, extern "C")

- [ ] All data crossing the FFI boundary is validated on the receiving side (never trust the caller)
- [ ] napi-rs: Rust functions exposed via `#[napi]` validate input types before processing
- [ ] napi-rs: JavaScript exceptions from Rust properly surfaced (no silent swallow via `napi::Result`)
- [ ] napi-rs: No `Buffer`/`TypedArray` returned with dangling Rust references (lifetime safety)
- [ ] napi-rs: Struct fields exposed to JS match the expected TypeScript types in `.d.ts`
- [ ] cgo: Go strings passed to C are null-terminated and freed after use
- [ ] WASM: linear memory bounds checked before access from host
- [ ] Serialization format at boundary consistent (JSON, MessagePack, etc.) — no implicit coercion
- [ ] Error types at boundary are exhaustive — no generic "internal error" hiding security issues
- [ ] Performance-sensitive FFI paths don't allocate unboundedly (DoS via large input)

## Level 6 — Python

- [ ] No `os.system()`, `subprocess.call(shell=True)` with user data
- [ ] No `pickle.loads()` on untrusted data (deserialization attack)
- [ ] No `eval()` / `exec()` with dynamic input
- [ ] SQL: use parameterized queries (`%s` with tuple, never f-strings)
- [ ] Django: CSRF middleware enabled, `mark_safe()` usage justified
- [ ] Flask: `Markup()` usage justified, `render_template_string()` avoided
- [ ] FastAPI: Pydantic models validate all request bodies
- [ ] `pip-audit`: 0 critical vulnerabilities
- [ ] Type hints present on public API functions

## Level 7 — PHP / Symfony

- [ ] CSRF tokens on all forms (FormType or `csrf_token()`)
- [ ] Twig: every `|raw` usage justified and sanitized
- [ ] Doctrine ODM/ORM: query criteria via official API, no raw native queries
- [ ] MongoDB operators not injectable via payload (`$where`, `$regex`, `$gt`)
- [ ] `#[IsGranted]` or Voter on every controller action
- [ ] No profiling routes exposed in prod (`_profiler`, `_wdt`)
- [ ] `composer audit`: 0 critical vulnerabilities

## Level 8 — C / C++

- [ ] No `strcpy`, `strcat`, `sprintf`, `gets`, `scanf` — use `strncpy`, `snprintf`, `fgets`
- [ ] Every `malloc`/`calloc`/`realloc` return value checked for NULL
- [ ] Every `malloc` has a corresponding `free` on all code paths (no leaks)
- [ ] No use-after-free: freed pointers set to NULL
- [ ] Buffer sizes validated before array access (bounds checking)
- [ ] Format strings never contain user-controlled data
- [ ] Integer overflow checked before allocation sizes (`size * count` patterns)
- [ ] Stack buffer overflow: no variable-length arrays (VLAs) with user-controlled size
- [ ] No `system()` / `popen()` with user data
- [ ] Signal handlers are async-signal-safe only
- [ ] Static analysis (cppcheck, ASan, Valgrind) results clean

## Level 9 — Assembly (x86 / x64)

- [ ] Direct syscalls justified and documented
- [ ] Stack alignment maintained per ABI
- [ ] No hardcoded addresses that bypass ASLR
- [ ] Buffer boundaries respected in string operations
- [ ] Privileged instructions justified (ring-0 code review required)
- [ ] No embedded shellcode patterns

## Level 10 — Infrastructure: Docker

- [ ] No `latest` tag in FROM — use pinned versions
- [ ] No `--privileged` flag in docker-compose
- [ ] Non-root USER directive in Dockerfile
- [ ] No secrets in Dockerfile (ARG/ENV with credentials)
- [ ] Multi-stage builds: build dependencies not in final image
- [ ] `.dockerignore` excludes `.env`, `.git`, `node_modules`, secrets
- [ ] Health checks defined

## Level 11 — Infrastructure: Kubernetes

- [ ] Containers run as non-root (`runAsNonRoot: true`, `runAsUser: > 0`)
- [ ] `allowPrivilegeEscalation: false` set on all containers
- [ ] Resource limits (CPU/memory) defined on all containers
- [ ] No `hostNetwork`, `hostPID`, `hostIPC` unless justified
- [ ] NetworkPolicies restrict inter-pod traffic
- [ ] Secrets mounted as volumes, not env vars (less exposure in logs)
- [ ] No `*` in RBAC ClusterRoleBindings
- [ ] Liveness and readiness probes defined
- [ ] Image pull policy: `IfNotPresent` or `Always` (never `Never` in prod)
- [ ] Pod Security Standards enforced (restricted or baseline)

## Level 12 — Infrastructure: Terraform

- [ ] No hardcoded credentials in `.tf` files — use variables or secret manager
- [ ] No `0.0.0.0/0` in security groups/firewall rules unless justified
- [ ] State file stored remotely with encryption (S3+DynamoDB, GCS, etc.)
- [ ] State file not committed to git
- [ ] Resource deletion/rename reviewed for state impact
- [ ] `terraform plan` output reviewed before apply
- [ ] Provider versions pinned
- [ ] Sensitive variables marked `sensitive = true`
- [ ] IAM policies follow least-privilege principle

## Level 13 — Message Queues: RabbitMQ / Kafka

- [ ] Message payloads validated at consumer
- [ ] No credentials in connection strings (use env vars or secrets)
- [ ] Dead letter queues configured for failed messages
- [ ] TLS enabled on connections in production
- [ ] Queue/topic permissions follow least privilege

## Level 14 — Search: Elasticsearch

- [ ] No user input directly in query DSL without sanitization
- [ ] Authentication enabled (X-Pack Security or OpenSearch Security)
- [ ] No `script` queries with user-controlled input (script injection)
- [ ] Index-level access control if multi-tenant
- [ ] Cluster exposed only on private network (no public 9200/9300)

## Level 15 — Database: PostgreSQL

- [ ] All queries parameterized (no string concatenation with user input)
- [ ] Migrations reviewed for data loss (DROP COLUMN, type changes)
- [ ] Row-level security (RLS) enabled if multi-tenant
- [ ] Connection strings not hardcoded
- [ ] Backup and point-in-time recovery configured
- [ ] Extensions added only with justification

## Level 16 — Database: MongoDB

- [ ] No injectable operators via payload (`$where`, `$regex`, `$gt`, `$ne`, `$in`)
- [ ] Queries use official driver API, not raw JSON/BSON from user
- [ ] Authentication enabled (no anonymous access)
- [ ] Tenant isolation enforced in every query
- [ ] Index existence verified for new query patterns

## Level 17 — Config & General Infrastructure

- [ ] No debug mode enabled in production
- [ ] Sensitive environment variables not in tracked files
- [ ] Security HTTP headers present (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)
- [ ] Secure logging: no sensitive data (passwords, tokens, PII) in logs
- [ ] User-facing errors without implementation details (stack traces hidden in prod)
- [ ] TLS/HTTPS enforced on all public endpoints

---

## Finding Format

```
File:line | Severity (🔴/🟠/🟡/🔵) | Vulnerability type | Concrete exploitation scenario | Proposed fix | Justification
```

### Severity Scale:
- 🔴 **Critical**: trivial exploitation, impacts sensitive data, RCE, privilege escalation, or multi-tenant breach → **BLOCKING**
- 🟠 **High**: exploitation possible with effort, significant impact → fix required before merge
- 🟡 **Medium**: low probability or limited impact → fix recommended
- 🔵 **Low**: best practice not followed, no direct exploitation → nice-to-have
