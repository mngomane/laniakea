# TDD Workflow

Activated when the task profile selects TDD strict, Bug TDD, or BDD strategy.

## TDD Agents

### Test Writer (TDD-1) — mandatory if TDD active

- Writes tests BEFORE any implementation (Red phase)
- Does NOT know the planned implementation — strict context isolation
- Receives ONLY: functional spec / user story / behavior description
- Each test encodes ONE expected behavior
- Includes at minimum: one nominal case, one edge case, one error case
- For BDD: writes Given/When/Then scenarios first, then converts to automated tests

**Rules:**
- NEVER modify an existing test without explicit human agreement
- Test MUST fail before implementation (Red). If a test passes without implementation → the test is probably wrong, delete and rewrite
- Descriptive naming: `test_should_[behavior]_when_[condition]`
- Prefer behavioral integration tests (Testing Library, Supertest) over pure unit tests for user interactions

**Output:** Test files created, each test executed and verified as failing (Red).
Log in CLAUDE.md: "🔴 RED: [test_name] — fails as expected"

### Implementer (TDD-2) — mandatory if TDD active

- Writes MINIMAL code to make the test pass (Green phase)
- Sees ONLY the failing test + existing codebase. Does NOT have access to the full spec
- Implements the simplest possible solution — no over-engineering
- Runs the test after each modification to verify it passes

**Rules:**
- NEVER modify tests. If a test seems incorrect, signal to Test Writer via mailbox
- One test at a time: make one test pass, verify, THEN move to the next
- If test is ambiguous, formulate an EXPLICIT HYPOTHESIS before coding: "I think this test expects [X] because [Y]". Log hypothesis in CLAUDE.md

**Diagnostic method (on persistent failure):**
1. Identify the FIRST failing test (not all of them)
2. Classify failure: assertion (logic), exception (crash), flaky (unstable)
3. Formulate a hypothesis on root cause
4. Fix root cause — NO random patching

**Output:** Code implemented, tests passing.
Log in CLAUDE.md: "🟢 GREEN: [test_name] — passes"

### Refactorer (TDD-3) — if complexity ≥ medium and TDD active

- Refactors code AFTER all tests pass (Refactor phase)
- Evaluates code without baggage from previous phases — fresh context
- Objective: improve readability, remove duplication, respect SOLID principles
- Runs full test suite after each refactoring to guarantee non-regression

**Rules:**
- NEVER modify tests during refactoring. Tests are the specification
- If refactoring breaks a test → `git restore` immediately and try a different approach
- Atomic modifications: one refactoring at a time, full test between each

**Output:** Refactored code, all tests still passing.
Log in CLAUDE.md: "🔄 REFACTOR: [description] — all tests pass"

## Cycle Orchestration

The Red → Green → Refactor cycle is a SEQUENTIAL GATE. No phase can be skipped.

| Step | Gate | Rule |
|------|------|------|
| 1. RED | Test MUST fail | If test passes → delete and rewrite |
| 2. GREEN | Test MUST pass + no regression | All existing tests still pass |
| 3. REFACTOR | All tests stay green | If any breaks → `git restore` |
| 4. LOOP | Return to step 1 | Update coverage score in CLAUDE.md |

### Special case: Bug TDD (Pattern A)
1. Test Writer writes a test that REPRODUCES the bug (test fails → confirms bug)
2. Implementer fixes the bug (test passes → confirms fix)
3. This regression test stays forever → growing test capital

### Special case: BDD
1. Test Writer writes Given/When/Then scenarios (business specs)
2. Test Writer converts each scenario to automated test
3. Implementer makes tests pass
4. BDD scenarios serve as living documentation

## TDD Policy (for S7)

Include in every TDD-active prompt:

```markdown
### TDD Policy — CRITICAL / BLOCKING

**FORBIDDEN:**
- Modify an existing test without explicit human agreement
- Comment, `.skip()`, or `.only()` a test to bypass a failure
- Write implementation BEFORE the test
- Run Test Writer and Implementer in the SAME tmux pane
- Delete an existing regression test
- Write a test that CANNOT fail (always-green = useless)

**ALLOWED:**
- Add NEW tests
- Modify a test IF business spec changed (human agreement required)
- Refactor a test to improve readability WITHOUT changing assertions
- Add additional edge cases

**Gate enforcement:**
- RED gate: do not implement until test fails
- GREEN gate: do not refactor until test passes AND all existing tests green
- REFACTOR gate: do not move to next cycle until full suite green
- Gate violation = IMMEDIATE STOP + report in CLAUDE.md
```

## Dimensioning

| Complexity | TDD agents | Notes |
|-----------|-----------|-------|
| Simple | 2 (Test Writer + Implementer) | Refactorer optional |
| Medium | 3 (+ Refactorer) | QA parallel recommended |
| High | 4–5 (+ QA) | Test Writer can be split by domain |
