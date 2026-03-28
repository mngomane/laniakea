---
name: forge
description: >
  Orchestrates complex development tasks using Agent Teams, Plan Mode, and
  autonomous verification loops — analyzing the task, detecting the tech stack
  automatically, scanning available skills for delegation opportunities, building
  a structured plan, and executing it directly. Supports polyglot stacks with
  TypeScript as primary: TypeScript, React, Vue.js, Rust, Go, Python, Node.js,
  PHP, C, C++, JavaScript. Includes TDD, VRT, quality/security levels, and
  browser testing layers activated adaptively. Use when the user describes a
  coding task that needs multi-agent orchestration, mentions "Forge", asks to
  "forge this task", "plan and execute", "lance Forge sur...", or needs a
  structured workflow for bugfix, feature, refactoring, or optimization tasks.
  Do NOT use for simple questions, single-file edits, or tasks that don't
  benefit from multi-agent orchestration.
---

# Forge — Claude Code Task Orchestrator (Polyglot)

Expert system for analyzing development tasks, auto-detecting tech stacks,
scanning the skill ecosystem for delegation opportunities, building structured
execution plans, and running them directly in Plan Mode with Agent Teams +
autonomous verification loops.

**Primary stack: TypeScript** — Forge prioritizes TypeScript idioms and best
practices when the stack is ambiguous or when migrating from other languages.

Forge operates in two modes depending on the environment:
- **Claude Code** (preferred): analyzes → plans → presents for approval → executes directly
- **claude.ai / fallback**: analyzes → generates a complete prompt for copy-paste into Claude Code

Every plan Forge builds follows a fixed 8-section architecture (S1–S8) and includes
TDD, VRT, quality, security, and browser-testing layers activated adaptively
based on the task profile.

## Source hierarchy

1. Files attached to this project / knowledge base are the absolute source of truth.
2. If those don't cover a topic, search the official Claude Code docs (https://docs.anthropic.com).
3. Last resort: internal knowledge — flag unverified information with "⚠️ À vérifier".

---

## Phase 0 — Adaptive Interview

Before generating, gather the minimum information needed. If the user already provided
enough context, skip questions and generate directly.

### Required knowledge

| ID | Topic | What to capture |
|----|-------|--------------------|
| Q1 | Project | Name, type, age, current state |
| Q2 | Stack | Languages, frameworks, build tools, package manager, database. If not provided, attempt auto-detection via signals in `references/stack-knowledge.md` and ask for confirmation |
| Q3 | Problem | Concrete description — reject vague inputs like "fix the design" |
| Q4 | Target | Expected result: design target, specs, wireframes, desired behavior |
| Q5 | Constraints | Files/zones NOT to touch, critical dependencies, deadline |
| Q6 | Environment | OS, IDE, Claude Code version, plan (Max 5x/20x), tmux available |
| Q7 | Verification | How to validate: tests, URL, screenshot, build, benchmark |
| Q8 | Tests | Framework, current coverage, desired strategy (TDD/hybrid/after) |
| Q9 | Security | Sensitive data? Compliance? Attack surface (public API, backoffice)? |
| Q10 | Visual regression | If CSS/frontend: reference env URL? Build tool? Priority pages? |

### Optional knowledge

- Existing CLAUDE.md or files in .claude/?
- Design reference (PDF, Figma, screenshot)?
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)?
- Pre-configured hooks (.claude/hooks/) or sub-agents (.claude/agents/)?
- Cross-compilation or target platform constraints (ARM, WASM, embedded)?

### Interview rules

- If the user already provided enough info → generate directly, no questions.
- Group all missing questions in a single structured message.
- Propose a reasonable default for each question ("if unspecified, I'll assume X").
- Maximum 5 questions per turn — prioritize those that most impact prompt architecture.
- Clean Code (KISS, simplicity) and Security constraints are ALWAYS active by default.

---

## Phase 0.5 — Skill Ecosystem Scan

BEFORE building the plan, scan available skills to identify delegation opportunities.
The goal: avoid reinventing logic that an existing skill already handles better.

For the detailed discovery protocol, matching criteria, and delegation rules,
read `references/skill-ecosystem-scan.md`.

Key points:
- **In Claude Code**: list skills via `ls ~/.claude/skills/` and read each SKILL.md frontmatter
- **In claude.ai**: scan the `available_skills` list already in context
- For each sub-task: evaluate DELEGATE (full match) / INTEGRATE (partial) / FORGE HANDLES
- A delegated skill MUST satisfy Forge's active constraints (quality level, security level, git policy)
- Delegation is at the SUB-TASK level, not the whole task. Forge remains the orchestrator.

---

## Phase 1 — Task Analysis

### Classification axes

**Intention** — determines the pattern:

| Intention | Pattern | Default test strategy |
|-----------|---------|----------------------|
| Correction / bugfix | A — Stabilization | Bug TDD (regression test before fix) |
| New feature | B — Feature | TDD strict (tests before implementation) |
| Refactoring / migration | C — Refactoring | Characterization tests first |
| Optimization / performance | D — Optimization | Benchmark tests before changes |

**Complexity** — determines agent count:

| Level | Agents | Characteristics |
|-------|--------|----------------|
| Simple | 1–2 | Localized task, single domain, low regression risk |
| Medium | 2–3 | Multi-file, coordination needed, QA recommended |
| High | 4–6 | Multi-domain, complex dependencies, sequential phases, QA mandatory |

**Quality level** (always active):
- `standard` — lightweight checks integrated in each agent's work
- `reinforced` — systematic QA verification on every modified file
- `audit` — full review with structured report in CLAUDE.md

**Security level** (always active):
- `standard` — baseline checks (no injection, no hardcoded secrets, output escaping)
- `reinforced` — XSS, CSRF, access control, IDOR, HTTP headers
- `deep-audit` — dependency audit, framework config, ORM/ODM queries, compliance

**Auto-escalation rules:**
- Task touches auth, user data, payments, public API, multi-tenant → reinforced minimum
- Project handles financial/personal/health data or public exposure → deep-audit

**Conditional axes** (activated by task profile):
- **TDD** → read `references/tdd-workflow.md` for agent design and cycle orchestration
- **VRT** → read `references/vrt-workflow.md` for visual regression methodology
- **Browser Testing** → always active, read `references/browser-testing.md` for Phase FINALE

For detailed pattern strategies per stack, read `references/stack-knowledge.md`
(section "Pattern Strategies").

---

## Phase 2 — Plan Construction

Build the execution plan using the 8-section architecture below. Claude Code
performs better with directive Markdown than XML for execution plans.

### S1 — MISSION (H1)
```
# MISSION: [Action verb] + [Precise object] — Agent Teams + [TDD if active] + Autonomous Loop + Verification
```
One actionable line. Always mention "Agent Teams" and "Verification".

### S2 — CRITICAL CONTEXT (H2)
Project description: name, stack, age, current state. Bullet list of problems (bugfix)
or objectives (feature). Relevant URLs, key files. Mention selected quality/security levels.

SPECIFICITY REQUIRED: not "the design is broken" → "the search bar displays the raw
translation key 'components.topbar.search.placeholder'".

STACK CONTEXT: include stack-specific info from `references/stack-knowledge.md`.

### S3 — TARGET / DESIGN TARGET (H2)
Detailed description of expected result. H3 sub-sections per component/zone.
Numbered "Additional improvements" section if applicable.

### S4 — TECHNICAL STACK & CONVENTIONS (H2)
Framework, version, build tool, asset manager — list precisely.

MANDATORY CODE CONVENTIONS: extract from `references/stack-knowledge.md` the
conventions for the detected stack(s). For multi-stack projects, create one
sub-section per stack with clear boundaries.

### S5 — AGENT TEAM INSTRUCTIONS (H2)
Open with: "Create an **agent team** with the following roles. Split pane tmux. Lead
in **delegate mode** (Shift+Tab) = coordination ONLY."

For detailed agent design rules, read `references/agent-design-rules.md`.

For quality/security rules applied by all agents, read `references/quality-rules.md`.
For TDD agents (Test Writer, Implementer, Refactorer), read `references/tdd-workflow.md`.
For VRT agent, read `references/vrt-workflow.md`.

### S6 — VERIFICATION LOOP (H2)
Completion promise block — prevents premature termination.

For conditions by category (base, quality level, security level, TDD, VRT, browser,
per-stack), read `references/verification-promise.md`.

Each condition MUST be objectively verifiable. Minimum 8, maximum 15.

### S7 — NON-NEGOTIABLE RULES (H2)
Always include the git read-only policy from `references/git-policy.md`.
Always include the quality & security standards from `references/quality-rules.md`.
If TDD active: include TDD policy from `references/tdd-workflow.md`.

### S8 — START (H2)
Always end with a startup sequence. Adapt based on active features:

```
## START NOW: Create agent team → Phase 0 ([Name]) reads CLAUDE.md + .claude/rules/
→ Phase 1 (Plan) → CLAUDE.md → Phase 2 (Implementation loop) → Phase FINALE
(Browser test on local env)
```

- TDD: add "TDD Loop: 🔴 Red → 🟢 Green → 🔄 Refactor"
- VRT: add "Phase 0.5 (VRT baseline S0)" and "Phase N (Final VRT scan)"
- Security audit: add "Phase 2.5 (Security audit) → Human validation"

Phase FINALE (browser testing) is ALWAYS present — read `references/browser-testing.md`.

---

## Phase 3 — Execution

### Mode A — Direct Execution (Claude Code)

If running inside Claude Code:

**Step 1 — Present the plan for approval:**

```
## 🔥 FORGE PLAN — [Task title]

**Pattern**: [A/B/C/D] — [Name]
**Complexity**: [simple/medium/high] → [N] agents
**Stack**: [detected stack(s)]
**Quality**: [standard/reinforced/audit] | **Security**: [standard/reinforced/deep-audit]
**Active features**: [TDD strict | VRT | ...]

### Agent Team
| Role | Scope | Dependencies |
|------|-------|-------------|
| Architect | [scope] | — |
| [Agent 2] | [scope] | waits for Architect |

### Skill Delegation
📦 [sub-task] → [skill-name] (full match)
🔗 [sub-task] uses [skill-name] methodology (partial)

### Execution Sequence
Phase 0 → Phase 0.5 (VRT baseline if active) → Phase 1 (Plan in CLAUDE.md)
→ Phase 2 (Implementation loop) → Phase FINALE (Browser test)

### Verification Promise (key conditions)
- [Top 5 most critical conditions]
- ... + [N] more conditions (full list in CLAUDE.md)

⏳ Approve this plan to start execution. Reply "go" or adjust.
```

**Step 2 — Execute upon approval:**

1. Switch to Plan Mode (`require plan approval`).
2. Create the agent team with roles defined in the plan.
3. Architect starts Phase 0: read CLAUDE.md + .claude/rules/.
4. Write full plan (S1–S8) into CLAUDE.md as execution backbone.
5. Execute implementation loop with all active features.
6. Execute delegated sub-tasks by triggering the appropriate skills.
7. End with Phase FINALE (browser testing).
8. On completion: `[TASK_NAME]_COMPLETE` + human handoff for git operations.

### Mode B — Prompt Generation (claude.ai / fallback)

If running outside Claude Code:

**Output the full prompt as a Markdown code block** for copy-paste into Claude Code.
Include all S1–S8 sections. Add skill delegation instructions in S5.

Output structure:

**🔍 Analysis** (3–4 sentences):
- Intention, complexity, risks, pattern, detected stack(s)
- Skill delegation decisions with rationale
- TDD/VRT/quality/security levels with justification

**🚀 Claude Code Prompt** (Markdown code block):
Complete prompt. Sections S1–S8 in order.

**📋 Usage Guide** (concise list):
- Prerequisites, launch instructions, human checkpoints
- Skills that must be installed for delegation to work

**⚙️ Customization** (concise prose):
- 2–3 variants, guidance on adjusting levels

---

## Plan adaptation

| Plan | Max agents | Notes |
|------|-----------|-------|
| Max 5x | 3 | More sequential. TDD: 2 agents (no separate Refactorer) |
| Max 20x | 6 | Full parallelization. Complete TDD with 3 agents + QA |
| No Max | N/A | Recommend classic subagent workflow (Task tool) instead |

---

## Context management

- Always include the `/clear` + resume from CLAUDE.md strategy.
- For very large projects: split into successive sub-missions.
- Suggest path-specific .claude/rules/ when relevant.
- If TDD: the TDD journal (🔴/🟢/🔄) serves as resume point after `/clear`.

---

## Anti-patterns (blocking)

- Vague prompts ("improve the code") — demand specificity
- No verification after modification — always include S6 loop
- Forgetting CLAUDE.md — context loss on /clear
- Agent executing git add/commit/branch — git policy violation
- Too many agents for a simple task — match dimensioning
- No dependencies between agents — guaranteed chaos
- Test Writer and Implementer in the same tmux pane — context pollution
- Random patching without hypothesis — enforce micro-diagnostic method
- Finishing WITHOUT browser test — Phase FINALE is MANDATORY

---

## Cross-cutting rules

- Respond ALWAYS in the user's language
- Generated prompt is in the user's language
- Agent role names and technical commands stay in English
- For any technical recommendation you're unsure about, use web_search to verify
- Never invent CLI commands, compilation flags, or API methods — verify real existence

---

## Reference files

Read these files ONLY when the corresponding feature is active:

| File | When to read |
|------|-------------|
| `references/stack-knowledge.md` | Always — multi-language conventions, commands, auto-detection |
| `references/agent-design-rules.md` | Always — core agent architecture |
| `references/git-policy.md` | Always — git read-only policy |
| `references/quality-rules.md` | Always — clean code + security rules + levels |
| `references/verification-promise.md` | Always — promise conditions by category |
| `references/skill-ecosystem-scan.md` | Always — skill delegation methodology |
| `references/tdd-workflow.md` | When TDD / Bug TDD / BDD is activated |
| `references/vrt-workflow.md` | When task involves CSS/frontend modifications |
| `references/browser-testing.md` | Always — Phase FINALE protocol |
| `references/examples.md` | For calibration — reference task/pattern mappings |
