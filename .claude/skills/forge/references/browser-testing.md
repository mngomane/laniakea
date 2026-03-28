# Browser Testing — Phase FINALE

MANDATORY phase executed at the very end of the workflow, AFTER all other verification
conditions are met. Uses Chrome MCP (Claude in Chrome, Chrome DevTools MCP, or Browser MCP)
to visually and functionally test modifications on the local environment.

## Phase 0 — Discovery (URLs and tools)

BEFORE any browser test:

### 1. Extract environment URLs
Read CLAUDE.md and CLAUDE.local.md for:
- `LOCAL_URL`: local environment (e.g., https://localhost:3000, http://localhost:8080)
- `TEST_URL` / `STAGING_URL` / `PROD_URL`: comparison URL(s)

If URLs are not documented → ask the human BEFORE proceeding. NEVER invent a URL.

### 2. Check Chrome MCP availability
Run `/mcp` and look for `claude-in-chrome`, `chrome-devtools`, or `browser-mcp`.

- If Chrome MCP available → proceed with automated testing
- If NO Chrome MCP available → **GRACEFUL DEGRADATION**:
  1. Display: "⚠️ No Chrome MCP detected. Manual browser test required."
  2. Generate manual test instructions with URLs and scenarios
  3. List pages to test, elements to verify, expected results
  4. Do NOT block workflow — log in CLAUDE.md that browser test awaits human validation

### 3. Identify impacted pages
Map modified files (controllers, routes, components, templates) to corresponding URLs.
Priority: directly impacted pages > pages sharing modified components > global pages.

## Test Scenario Generation

For each impacted page:

```markdown
### Browser Test: [Page Name] — [URL]

**Prerequisites**: [required state — login, test data, etc.]

**Steps**:
1. Navigate to [LOCAL_URL]/[route]
2. Verify: [expected visual / functional element]
3. Interact: [user action — click, form, navigation]
4. Verify: [expected result after interaction]

**Automatic checks**:
- [ ] No JavaScript console errors
- [ ] No network errors (4xx/5xx) in requests
- [ ] Key elements visible and correctly rendered
- [ ] Navigation links functional
- [ ] Forms submit correctly (if applicable)
```

## Comparison Protocol (if reference URL available)

For each priority page:
1. Capture state on reference URL (test/staging/prod)
2. Capture same state on local URL
3. Compare: layout, typography, forms, buttons, interactive elements
4. Document differences: intentional (mark ✅) vs regression (classify 🔴/🟠/🟡)

## Report Format (in CLAUDE.md)

```markdown
### Phase FINALE — Browser Test Report — [Timestamp]

**Environment**: [LOCAL_URL]
**Comparison**: [REF_URL] (if available)
**Chrome MCP**: [available / graceful degradation]

| Page | JS Errors | Network | Layout | Interactions | Status |
|------|-----------|---------|--------|-------------|--------|
| [page] | ✅ 0 | ✅ 0 | ✅ OK | ✅ OK | ✅ PASS |
| [page] | 🔴 2 | ✅ 0 | 🟠 Shift | — | 🟠 ISSUES |

**Issues found:**
- [ ] [Page]: [Description] — Severity [🔴/🟠/🟡]

**Human validation required:**
- [Pages awaiting manual validation, if Chrome MCP unavailable]
```

## Blocking Rules

Phase FINALE can BLOCK the `[TASK_NAME]_COMPLETE` signal if:
- Any page has a 🔴 (critical) issue: JS errors, broken layout, non-functional forms
- A core user flow is broken by the modifications

🟠 issues are logged but do NOT block completion (documented for human review).

## SSL Self-Signed Workaround

DevTools snippets and Chrome MCP work AFTER manually accepting the certificate.
If the local environment uses self-signed SSL, include this note in the instructions.
