# Skill Ecosystem Scan — Methodology

Detailed methodology for Phase 0.5: scanning available skills and determining
delegation opportunities before building the execution plan.

## Discovery Protocol

### In Claude Code

```bash
# List all installed skills
ls ~/.claude/skills/ 2>/dev/null

# For each skill, extract frontmatter only (name + description)
for skill_dir in ~/.claude/skills/*/; do
  if [ -f "$skill_dir/SKILL.md" ]; then
    echo "=== $(basename $skill_dir) ==="
    sed -n '/^---$/,/^---$/p' "$skill_dir/SKILL.md"
    echo ""
  fi
done
```

Also check for project-level skills:
```bash
ls .claude/skills/ 2>/dev/null
```

### In claude.ai

The `available_skills` block in the system context already lists all skills with
their descriptions. Scan this list directly — no filesystem access needed.

### In a Claude Project

Use `project_knowledge_search` to discover skills referenced in the project
knowledge base if available.

## Matching Criteria

For each sub-task extracted from the user's request, evaluate each candidate skill:

### Criterion 1 — Functional coverage

| Signal | Match level |
|--------|------------|
| Description explicitly mentions the task type | Strong match |
| Description mentions related concepts | Moderate — read full SKILL.md to confirm |
| Description is tangential | No match |

### Criterion 2 — Constraint compatibility

Does the skill respect ALL active Forge constraints?

| Constraint | How to verify |
|-----------|--------------|
| Git read-only policy | Does the skill ever run git add/commit/push? |
| Quality level | Does it enforce clean code at the active level? |
| Security level | Does it include security checks at the active level? |
| Verification loop | Does it include a completion promise or equivalent? |
| CLAUDE.md logging | Does it log actions in CLAUDE.md? |

**If a constraint is missing**: Forge can WRAP the delegation with the missing
constraint rather than rejecting the skill entirely.

### Criterion 3 — Interface compatibility

| Invocation mode | When to use |
|----------------|-------------|
| Direct trigger (`/skill-name`) | Claude Code — skill has a slash command |
| Contextual trigger (describe the sub-task) | Rely on skill auto-detection |
| Reference integration (read skill's references/) | Need methodology but not orchestration |

## Decision Matrix

| Functional coverage | Constraint compatible | Decision |
|--------------------|-----------------------|----------|
| Strong match | All constraints met | **📦 DELEGATE** — full delegation |
| Strong match | Some constraints missing | **📦 DELEGATE + WRAP** — add missing checks |
| Moderate match | — | **🔗 INTEGRATE** — use skill's references/scripts |
| No match | — | **🔧 FORGE HANDLES** — no delegation |

## Documentation Format

Record all decisions in the plan and in CLAUDE.md:

```markdown
### Skill Ecosystem Scan — [Timestamp]

**Skills discovered**: [N] skills scanned

| Sub-task | Candidate skill | Coverage | Constraints | Decision |
|----------|----------------|----------|-------------|----------|
| [sub-task] | [skill-name] | ✅ Strong | ✅ All met | 📦 DELEGATE |
| [sub-task] | [skill-name] | ✅ Strong | ⚠️ Missing X | 📦 DELEGATE + WRAP |
| [sub-task] | — | No match | — | 🔧 FORGE HANDLES |

**Integration points:**
🔗 [Agent] will use `[skill]/scripts/[script]` for [purpose]
```

## Delegation Rules

- A delegated skill MUST satisfy Forge's active constraints. If it doesn't,
  Forge wraps it with the missing constraints rather than delegating blindly.
- Delegation is at the SUB-TASK level, not the whole task. Forge remains the orchestrator.
- Document all delegation decisions in the plan presentation.

## Anti-patterns

- **Over-delegation**: Don't delegate sub-tasks tightly coupled with Forge's orchestration.
- **Blind trust**: If Forge's security = deep-audit and skill only does standard → wrap.
- **Cascade delegation**: Keep delegation depth to 1 level.
- **Hallucinated skills**: NEVER reference a skill not found in the actual scan.
