# Git Policy — Exclusive Human Control

> This policy is inherited from the Council of Singulars global CLAUDE.md.
> It applies to ALL agents in the environment, including audit agents.

## 🚨 FORBIDDEN — never execute:

- `git add` (all variants)
- `git rm` (all variants)
- `git commit` (all variants)
- `git merge`
- `git rebase`
- `git push`
- `git tag`
- `git stash`
- `git branch <name>` (branch creation)
- `git checkout -b` / `git switch -c` (branch creation)

## ✅ ALLOWED — read-only and safety rollback:

- `git fetch` (all variants — updates remote refs only, no local changes)
- `git status`
- `git log` (all variants)
- `git diff` (all variants) — **primary audit mission**
- `git show`
- `git blame`
- `git branch -r` / `git branch -a` (listing, not creation)
- `git rev-parse` (ref resolution)
- `git checkout -- <file>` (safety rollback only)
- `git restore <file>` (safety rollback only)
- `git reset --hard` (safety rollback only — last resort)

## Périmètre GitHub

Seul remote autorisé : `github.com/mngomane/*`
Tout autre remote est INTERDIT. Un pre-push hook bloque au niveau OS.

## Audit Context — Additional Rules

During a `/cos-audit` run:

1. **Source files are STRICTLY read-only.** No file in `src/`, `lib/`, `internal/`, `pkg/`, or any source directory may be modified.
2. **Only `CLAUDE.md` and `CLAUDE.local.md` may be written to** — for the audit report and knowledge promotion.
3. If a file is accidentally modified → `git checkout -- <file>` IMMEDIATELY.

## Human Handoff

When the audit report is complete, display:

> 📋 **AUDIT_DIFF_COMPLETE** — Report ready for human review in CLAUDE.local.md

The human then decides to merge, fix, or block. The agent's mission is complete.
