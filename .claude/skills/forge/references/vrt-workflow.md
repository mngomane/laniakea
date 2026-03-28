# VRT Workflow — Visual Regression Testing

Activated when the task involves CSS/SCSS modifications, template changes impacting
CSS classes, CSS framework migration, or global SCSS variable modifications.

## VRT Agent — Visual Regression Tester

Specialized agent for detecting visual regressions by CSS source-code comparison
and/or runtime DevTools metrics. Operates IN PARALLEL with implementation agents.
Has BLOCKING RIGHTS on critical regressions (🔴).

### Responsibilities

- Capture CSS baseline of reference environment BEFORE modifications
- After each implementation phase: re-scan and compare CSS coverage
- Map missing CSS classes to impacted templates/pages
- Classify each regression by severity
- Generate DevTools snippets for human validation of priority pages

## Mode 1: Source-code Audit (primary — fully autonomous)

Parse compiled CSS to extract ALL unique CSS classes and their rule counts.

**Step 1 — Reference extraction:**
Parse reference compiled CSS (prod or stable commit) for all unique CSS classes.
```bash
# Inline extraction via grep/awk on compiled CSS
grep -oP '\.[a-zA-Z_-][\w-]*' [REF_CSS_FILE] | sort -u > /tmp/vrt/ref-selectors.txt
# Or use a dedicated CSS analysis skill/script if available
```

**Step 2 — Local extraction:**
Parse ALL CSS loaded on local pages (after modifications).
Merge selectors from all CSS files in the loading chain.

**Step 3 — Template scan:**
Scan templates (JSX, TSX, Vue SFC, Twig, Blade…) to map missing classes to pages.
Detect template inheritance to distinguish legacy vs migrated pages.

**Step 4 — Gap analysis:**
Compare reference vs local. Categorize missing classes by system
(card-system, navigation, forms, buttons, tables, panels, vendor, etc.).
Calculate coverage % and impacted rule count by category.

**Step 5 — Report:**
Produce structured report in CLAUDE.md.

## Mode 2: Runtime DevTools (secondary — human-assisted)

For priority pages, generate JavaScript DevTools snippets the user runs in Chrome:

```javascript
(function() {
  const $ = (sel) => document.querySelector(sel);
  const cs = (el, prop) => el ? getComputedStyle(el)[prop] : 'N/A';
  const count = (sel) => document.querySelectorAll(sel).length;
  const metrics = {
    _page: window.location.pathname,
    _env: window.location.hostname,
    body_fontSize: cs(document.body, 'fontSize'),
    body_fontFamily: cs(document.body, 'fontFamily'),
    body_color: cs(document.body, 'color'),
    body_backgroundColor: cs(document.body, 'backgroundColor'),
    h1_fontSize: cs($('h1'), 'fontSize'),
    formControl_height: cs($('.form-control'), 'height'),
    btn_fontSize: cs($('.btn'), 'fontSize'),
    counts: {
      forms: count('.form-control'),
      buttons: count('.btn'),
      tables: count('.table'),
      cards: count('[class*="card"]'),
    }
  };
  console.log(JSON.stringify(metrics, null, 2));
  return metrics;
})();
```

**Instructions for user:**
1. Run snippet on reference URL → copy JSON
2. Run same snippet on local URL → copy JSON
3. Paste both outputs for VRT comparison

## Scan Schedule

| Scan | Timing | Scope |
|------|--------|-------|
| S0 (baseline) | BEFORE any modification | Capture reference metrics |
| S1…SN-1 | After each major phase | Impacted pages |
| SN (final) | After all modifications | All priority pages — full scan |

Each scan numbered and logged in CLAUDE.md with result matrix.

## Report Format (in CLAUDE.md)

```markdown
### Scan S[N] — [Description] — [Timestamp]

**Coverage**: [X]% ([covered]/[ref_total] classes)

| Page | Layout | Typo | Forms | Buttons | Tables | Vendor | Overall |
|------|--------|------|-------|---------|--------|--------|---------|
| [page] | ✅/🟠/🔴 | ... | ... | ... | ... | ... | ✅/🟠/🔴 |

**Regressions to fix:**
- [ ] [Page]: [Description] — [Missing CSS classes] — Severity [🔴/🟠/🟡/🔵]
```

## Severity Classification

| Severity | Meaning | Threshold |
|----------|---------|-----------| 
| 🔴 Critical | Layout broken, invisible text, inaccessible functionality | >50 missing rules |
| 🟠 High | Visually degraded but functional | 20–50 missing rules |
| 🟡 Medium | Minor differences, cosmetic | 5–20 missing rules |
| 🔵 Low | Negligible | <5 missing rules |
| ✅ OK | Complete coverage or only intentional changes | — |

## Blocking Rights

VRT can BLOCK progress if:
- A control page shows any regression → IMMEDIATE BLOCK
- A priority page has a 🔴 (critical) regression → BLOCK until fixed
- Global coverage drops below acceptable threshold (defined in Phase 0)

🟠 regressions accepted TEMPORARILY during implementation (must be resolved before final scan).

## Anti-hallucination

- CSS class names, rule counts, and file paths MUST be reproduced EXACTLY from source. NEVER infer.
- If a metric cannot be extracted → mark `NON DÉTERMINABLE`. NEVER guess.
- ✅/🟠/🔴 statuses determined by data. NEVER assign without supporting evidence.
- Intentional changes documented and marked ✅ with "intentional" note.

## Activation Heuristic

Auto-activate VRT if the task involves:
- Deletion or replacement of a CSS/SCSS file
- CSS framework migration (Bootstrap→Tailwind, etc.)
- Modification of global SCSS/CSS variables (typography, spacing, colors)
- Template refactoring impacting CSS classes

Do NOT activate for: adding isolated styles to a new component, fixing a single selector.
