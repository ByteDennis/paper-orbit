---
title: Confluence Report Page Review
aliases:
  - dtrack Confluence design review
tags:
  - confluence
  - dtrack
  - review
created: 2026-10-05
updated: 2026-10-05
status: open
related:
  - "[[confluence-hub]]"
  - "[[confluence_report_page]]"
  - "[[dtrack-confluence-row-col-check-report]]"
---

# Confluence Report Page Review

Back to [[confluence-hub]]. Compares [[confluence_report_page]] (automated design, "**A**") with [[dtrack-confluence-row-col-check-report]] (manual guide, "**M**") and lists what to settle and what to add.

## What both already get right

- Confluence is the navigation layer; detail stays in HTML / XLSX / CSV.
- One row per pair; permanent link targets; no presigned URLs.
- Historical run pages are immutable; reruns create new pages.
- Excel cannot deep-link to a sheet, so per-pair files (A) or named sheets (M).

## Conflicts to settle

| Topic | A says | M says | Recommendation |
|---|---|---|---|
| Row statuses | `MATCH` / `DIFF` / `MISSING` | `PASS` / `FAIL` | Keep A's words; they say *what* is wrong. Use the same words in HTML and XLSX. |
| Col statuses | `PASS` / `DIFF` / `PARTIAL` / `NOT_RELEASED` | `PASS` / `FAIL` / `PARTIAL` / `SKIPPED` / `RUNNING` | Show `SKIPPED` to readers instead of `NOT_RELEASED` (internal term); keep `NOT_RELEASED` in `summary.json`. Add `RUNNING` only if pages are ever published mid-run. |
| PARTIAL colour | Red | Yellow | Decide once. Red if "incomplete = untrustworthy" (A's severity sort already puts it first); Yellow if Red is reserved for confirmed data loss. Either way, never Green. |
| Latest page | Parent page overwritten with full table + recent runs | Link only, to avoid two sources | With automation both are generated from one `summary.json`, so duplication is safe. Simpler still: Excerpt Include of the run page's table (see [[confluence-run-page-template#Latest page]]). |
| History index | Script renders "most recent N runs" table on parent | Content Properties Report | Emit a `details` macro + `dtrack-run` label on each run page and put `detailssummary` on History. No script-side history logic. |
| Page titles | `dtrack · <run_id>` | `YYYY-MM-DD — <run_id>` | `YYYY-MM-DD · <run_id>` sorts chronologically. If `run_id` already starts with the date, `dtrack · <run_id>` is fine; just pick one. |
| HTML links | Attachment, downloaded | Stable external URL, rendered | A is correct for today (no endpoint). Keep M's `--base-url` path as the upgrade. Label links `Download HTML` until then. |
| Columns | 7, no owner/note | 9, with owner/note | Automated pages cannot know owner notes; put human notes in a `Notes` section below the table, not in a column the bot overwrites. |

> [!question] Decisions needed
> - [ ] Final reader vocabulary for row and col status
> - [ ] PARTIAL colour: Red or Yellow
> - [ ] Latest page: full table, Excerpt Include, or link only
> - [ ] Title format

## Gaps worth adding

### Reader value

- [ ] **Headline sentence** in an Info panel: `N of M pairs need attention: ...`. Generated from `pair_reports`.
- [ ] **Needs attention** section listing only non-green pairs above the full table.
- [ ] **Δ vs previous run** column (`new` / `fixed` / `same`). Needs the previous run's `summary.json`, which the publish step can fetch via `latest/pointer.json` before updating it.
- [ ] **Timezone** on `generated_at` everywhere (A shows `EDT`; make it a rule, not an example).
- [ ] **Per-pair anchors** so a Slack message can link to `#orders` on the run page.
- [ ] Explain row vs col check in two lines at the top (M has this; A does not).

### Automation robustness

- [ ] Store `summary_sha256` as a content property; skip publish when unchanged.
- [ ] Validate XHTML with `contentbody/convert/view` before create/update; fail before any upload.
- [ ] Handle `429 Retry-After` and `409` version conflicts (see [[confluence-automation-api#Handling errors]]).
- [ ] XML-escape all dynamic strings (pair names, column names).
- [ ] Set `full-width` appearance properties on create.
- [ ] Apply labels on create: `dtrack`, `dtrack-run`, `dtrack-env-<env>`.
- [ ] Version message: `dtrack <version> run <run_id>`.
- [ ] Decide notification policy: Latest updates as minor edits (quiet), or let watchers hear about failures only.

### Governance

- [ ] Service account owns pages; token in env var.
- [ ] Space-level or root-level view restriction matching source-data access; verified as a plain reader.
- [ ] Retention: archive run pages older than N months instead of deleting.
- [ ] A short "How to read this report" child page under the root, linked from every Info panel.

## Suggested status table (draft)

| Check | Reader status | Internal source | Colour |
|---|---|---|---|
| Row | MATCH | no diffs | Green |
| Row | DIFF | `count_diff > 0` | Yellow |
| Row | MISSING | `left_only + right_only > 0` | Red |
| Col | PASS | no `verdict == diff` | Green |
| Col | DIFF | any `verdict == diff` | Yellow |
| Col | PARTIAL | `dead > 0` or units incomplete | Red *(pending decision)* |
| Col | SKIPPED | no manifest (`NOT_RELEASED`) | Grey |

Sort: severity `max(row, col)` with Red < Yellow < Grey < Green, then pair name (unchanged from A).
