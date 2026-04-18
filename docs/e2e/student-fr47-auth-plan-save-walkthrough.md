# FR47 Walkthrough: Dana Auth -> Plan -> Save

## Purpose

This walkthrough documents the student end-to-end journey for FR47:
authentication through planner generation and persisted save.

## Preconditions

- App is configured with Firebase and a seeded catalog for the active term.
- A student test account exists (or can be created through the student registration path).
- The student can access Planner and Saved tabs after sign-in.

## Manual Flow Script (Replay Steps)

1. Open UniSmart and choose the student sign-in path.
2. Enter valid institutional email and password, then sign in.
3. Confirm the app routes to the student experience and opens Planner.
4. Start course selection and choose at least 2 courses with section data.
5. Continue to constraints and set at least one hard constraint (for example: block Monday, earliest start 09:00).
6. Run optimizer and wait for generated options.
7. Verify at least one candidate schedule is shown with a fit score.
8. Save one generated plan.
9. Verify automatic navigation to Saved without manual tab switching.
10. Verify the saved plan appears with metadata (date/score) and can be opened.

## Checkpoints (Expected Results)

- Auth form gates invalid input and allows valid sign-in.
- Post sign-in routing lands the user in the student area.
- Planner flow preserves selected courses/constraints through generation.
- Save action persists under the signed-in user and does not report false success.
- Successful save takes the user directly to Saved.

## Evidence Mapping (Automated + Manual)

### Automated evidence (Jest)

- Auth validation: `lib/email-password-auth-validation.test.ts`
- Post sign-in routing: `lib/auth-post-sign-in.test.ts`
- Optimizer CTA and run behavior: `lib/planner-optimizer-cta.test.ts`
- Saved schedule persistence and retrieval: `lib/saved-schedule-firestore.test.ts`
- Saved schedule RBAC rules: `lib/saved-schedule-firestore.rules.test.ts`

### Manual evidence artifact

- Execution checklist and run log: `docs/manual-qa/fr47-dana-journey-checklist.md`

## Notes for Graders

- This script verifies FR47 specifically (student auth -> planner -> persisted save).
- If a run fails, capture the failing checkpoint, screenshot, and console error text in the manual QA file.
