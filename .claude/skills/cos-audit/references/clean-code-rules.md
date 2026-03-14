# Clean Code Rules — 10 Rules to Apply on the Diff

Apply these rules on each modified file with high change density.

## The 10 Rules

### 1. KISS (Keep It Simple, Stupid)
Unnecessarily complex solution when a simpler one exists?
- Unjustified multi-level abstraction for a simple case
- Overkill design pattern (Strategy pattern for 2 cases, Factory for a single type)
- Rust: excessive trait generics when a concrete type suffices
- Go: interface defined before a second implementation exists
- C: macro spaghetti when a function would do

### 2. YAGNI (You Ain't Gonna Need It)
Premature abstractions, "just in case" parameters, never-used code?
- Interfaces/traits with a single implementation without architectural justification
- Optional parameters not used anywhere in the current codebase
- Feature flags for unrequested functionality
- Generic type parameters that are only ever instantiated with one type

### 3. DRY (Don't Repeat Yourself)
Introduced duplications (threshold: 3+ occurrences of the same block)?
- Copy-pasted logic between handlers/services
- Similar DB queries in multiple places without extraction into a shared module
- Rust: duplicated match arms that could be collapsed
- Go: repeated error handling boilerplate that could use a helper

### 4. Explicit Naming
Ambiguous variables? Functions without qualifier?
- ❌ `data`, `tmp`, `result`, `item`, `info`, `obj`, `buf`, `ctx` (without context)
- ❌ `process()`, `handle()`, `execute()`, `run()`, `do_thing()` without context
- ✅ `campaign_metrics`, `pending_invitations`, `calculate_monthly_revenue()`
- Rust: ✅ `parse_config_from_file()` ❌ `parse()`
- Go: ✅ `FetchUserByEmail()` ❌ `Get()`
- C: ✅ `tcp_conn_state` ❌ `state`

### 5. Short Functions
Methods > 30 lines? Candidates for splitting?
- Identify internal logic blocks (setup, processing, formatting, output)
- If a function does 3 things → 3 functions
- Rust: `fn` with more than 3 levels of nesting → extract
- Go: functions with multiple `if err != nil` blocks → consider extracting steps

### 6. No Dead Code
Unused imports? Variables assigned but never read? Commented-out blocks?
- Code commented "just in case" → delete (git has the history)
- Private functions/methods never called
- Orphan `use`/`import`/`#include` statements
- Rust: `#[allow(dead_code)]` on items that should be removed
- Go: unexported functions unreferenced in package
- C: `#ifdef` blocks for removed features

### 7. No Magic Values
Unnamed hardcoded numbers or strings?
- ❌ `if status == 3` / `sleep(86400)` / `buf[0..32]`
- ✅ Named constants: `STATUS_ACTIVE`, `ONE_DAY_SECS`, `TOKEN_PREFIX_LEN`
- Rust: `const` or `enum` for semantic values
- Go: `const` block at package level
- C: `#define` or `enum` — never bare literals in logic

### 8. Project Consistency
Does the code follow the project's existing conventions?
- Naming style (camelCase vs snake_case) consistent with existing code
- File organization conforming to the project structure
- Service/handler/repository usage patterns consistent
- Rust: consistent error handling strategy (thiserror vs anyhow)
- Go: consistent context propagation pattern
- TypeScript: consistent use of types vs interfaces

### 9. Key Ordering
Associative arrays / YAML configs / JSON properties / struct fields — sorted?
- Unless a semantic order is preferable (form fields, workflow steps, protocol headers)
- Rust: `Cargo.toml` dependency sections alphabetized
- Go: `import` groups ordered (std, external, internal)

### 10. Minimal Naming
Single-character variables (`i`, `k`, `e`, `v`, `n`) outside trivial loops?
- OK in `for i := 0; ...` or `|v| v.is_some()` or `for (int i = 0; ...)`
- ❌ in any business logic, error handling, or complex iteration
- Go: `r`, `w` for reader/writer in I/O context is acceptable (convention)

---

## Quality Finding Format

```
File:line | Rule violated (KISS/DRY/Naming/…) | Description | Proposed fix
```
