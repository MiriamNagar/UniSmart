# Admin Analysis Export Script (Morgan Journey, FR49)

This script provides replayable evidence for the admin analysis to export flow.

## Goal

- Prove the admin can review scoped analysis and produce export evidence.
- Confirm CSV output carries the exact visible filter scope and disclaimer.
- Confirm PDF export behavior is documented as deferred with CSV fallback for this milestone.

## Preconditions

- Run on a branch that includes Epic 6 analysis filtering and export helpers.
- Admin analytics rows are available in-memory (seed/mocked data is acceptable for this story).
- Filters are selected for department, major, and semester.

## Script Steps

1. Open the admin analysis dashboard and set scope filters.
   - Example scope used for evidence: `Department=Engineering`, `Major=All Majors`, `Semester=Semester A`.
2. Confirm the visible scope label in the UI matches the selected filters.
3. Trigger CSV export evidence generation.
4. Verify exported CSV structure:
   - Header contains columns for course data, scope fields, generated timestamp, and disclaimer.
   - Every exported row includes the selected scope values.
   - Values with commas/quotes are CSV-escaped correctly.
5. Trigger PDF export path.
6. Verify PDF status is documented as deferred and includes:
   - fallback format = CSV
   - same visible scope text as the analysis screen
   - same system-analytics disclaimer text

## Automated Evidence Command

Run:

`npm test -- lib/admin-analysis-export.test.ts`

Expected evidence:

- `exerciseAdminAnalysisExport` test passes.
- CSV and PDF plan both report the same visible scope string.
- CSV contains the milestone disclaimer:
  - `System analytics only; not official registrar data.`

## FR49 Coverage Statement

When this script is followed, admin analysis review through CSV/PDF matches documented scope and disclaimer behavior for Morgan's journey (FR49).
