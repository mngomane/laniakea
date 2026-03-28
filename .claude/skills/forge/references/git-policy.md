# Git Policy — Human-Only Control

All Git history and index modifications remain under exclusive human control.
Agents may only use Git for reading and safety rollback.

## FORBIDDEN — never execute

- `git add` (all variants: `git add .`, `git add -p`, `git add -A`, `git add <file>`)
- `git rm` (all variants)
- `git commit` (all variants: `git commit -m`, `git commit --amend`, etc.)
- `git branch <n>` (branch creation)
- `git checkout -b <n>` (branch creation)
- `git switch -c <n>` (branch creation)
- `git merge`
- `git rebase`
- `git push`
- `git tag`
- `git stash` (implicitly modifies index)

## ALLOWED — read and safety rollback only

- `git status` (read)
- `git log` (read)
- `git diff` (read, all variants)
- `git show` (read)
- `git blame` (read)
- `git checkout -- <file>` (rollback file to last commit — SAFETY)
- `git checkout <commit> -- <file>` (restore file from a specific commit — SAFETY)
- `git restore <file>` (rollback working tree — SAFETY)
- `git reset HEAD <file>` (unstage only — SAFETY)
- `git reset --hard` (full rollback to last commit — SAFETY, last resort)

## Human handoff protocol

When a work phase is complete:

1. List in CLAUDE.md all files created, modified, or deleted.
2. Display a clear summary: "📋 FILES READY FOR HUMAN REVIEW: [list]"
3. Suggest git commands the human can execute, WITHOUT executing them:
   Example: "Once validated, you can run: `git add -p && git commit -m 'feat: description'`"
4. WAIT for human instruction before continuing if other phases depend on the commit.

## Template for generated prompts

Always include this block in S7 (Non-negotiable Rules):

```markdown
### Git Policy — CRITICAL / BLOCKING

**FORBIDDEN:** git add, git rm, git commit, git branch, git merge, git rebase, git push, git tag, git stash

**ALLOWED (read + safety only):** git status, git log, git diff, git show, git blame, git checkout -- <file>, git restore <file>, git reset HEAD <file>

**After each completed phase:**
1. List modified files in CLAUDE.md
2. Display: "📋 FILES READY FOR HUMAN REVIEW: [list]"
3. Suggest git commands for the human
4. WAIT for human instruction
```
