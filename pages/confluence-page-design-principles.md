---
title: Confluence Page Design Principles
aliases:
  - Confluence best practices
  - How to write a good Confluence page
tags:
  - confluence
  - writing
  - design
created: 2026-10-05
updated: 2026-10-05
related:
  - "[[confluence-hub]]"
  - "[[confluence-macro-cheatsheet]]"
---

# Confluence Page Design Principles

Back to [[confluence-hub]].

## 1. Reader first: the first screen

Readers open a report page to answer three questions, in this order:

1. **Is it OK?** Overall status, as one status chip plus one sentence.
2. **What needs action?** The few rows that are not green, listed by name.
3. **Where is the detail?** Links to HTML / XLSX / CSV, never the detail itself.

> [!tip] Write the headline sentence, not just the table
> `3 of 25 pairs need attention: orders (col DIFF, 3 cols), users (row MISSING), events (col PARTIAL).`
> A generated sentence like this beats a 25-row table for most readers. Put it in an Info panel at the top.

Inverted pyramid layout:

```text
Title
[Info panel]   headline sentence + what row/col check mean (2 lines max)
[Properties]   run id, window, generated at (with timezone), owner, overall status
## Needs attention     only non-green rows
## All pairs           full table, sorted by severity
## Artifacts           run-level links (full HTML, XLSX, summary.json)
## Notes               human notes, reruns, known issues
```

## 2. One source of truth

- Every number on the page should come from one file (`summary.json` for dtrack). Never type a count by hand next to a generated one.
- If two pages show the same table, either generate both from the same source in the same run, or show it once and **include** it elsewhere (Excerpt + Excerpt Include, see [[confluence-macro-cheatsheet#Reuse]]).
- Historical pages are immutable evidence. Reruns create a new page; corrections are added as a labelled note, never by silently editing numbers.

## 3. Page tree and naming

- Shallow trees: root, then `Latest` and `History`, then one page per run. Avoid more than three levels.
- Titles must be unique **per space**, so put the unique key in the title: `YYYY-MM-DD · <run_id>`.
- Start titles with an ISO date so alphabetical sort equals chronological sort (useful in Children Display and search).
- Labels are the real index. Use a small, prefixed taxonomy: `dtrack`, `dtrack-run`, `dtrack-env-prod`. Labels are lowercase and cannot contain spaces.
- Set a page owner and keep a `Last verified` date on long-lived pages (root, how-to pages).

## 4. Tables

- 7 to 9 columns at most. Merge related values (`oracle / databricks`, `2026-01-01..06-30 (month)`) instead of adding columns.
- One row = one entity (pair). Sort by severity, then by name, so problems are always on top.
- Right-align numbers, use thousands separators, and show units (`3/42 cols`, `181/181 dates`).
- Turn on the header row; for key-value tables turn on the header column instead.
- Use **Full width** for wide tables; never make readers scroll sideways for the status columns. Put status columns left of free-text columns.
- Do not put detail rows (every date, every column diff) in Confluence. That is what HTML/XLSX are for.
- Large tables (hundreds of rows) make the editor slow; split by group or link out.

## 5. Status vocabulary

- One small vocabulary, used identically in Confluence, HTML, XLSX and `summary.json`-derived text.
- Colour carries severity, the word carries meaning. Never rely on colour alone (colour-blind readers, printed PDFs).
- Never show an incomplete result in green. `PARTIAL`, `SKIPPED`, `RUNNING` must look different from `PASS`.
- Keep internal codes (`NOT_RELEASED`, `count_diff`) out of the reader surface, or explain them once in the Info panel.

| Colour | Meaning |
|---|---|
| Green | Completed, no findings |
| Yellow | Completed with findings that need review |
| Red | Missing data, or result cannot be trusted |
| Grey | Did not run (gated or skipped) |
| Blue | In progress, not final |

## 6. Links

- Link text says what opens: `orders · HTML`, `Workbook (orders_col)`, not `click here`.
- Only permanent targets: attachments or stable URLs. Presigned URLs expire (max 7 days) and leave broken links in history.
- Smart Links: paste a URL, then switch to **inline** (or plain link) inside tables. Card and embed views blow up row height.
- Excel cannot deep-link to a sheet; name the sheet next to the link.
- In Confluence Cloud, an attached `.html` file is downloaded, not rendered. Label it `Download HTML`.
- After copying a page, check every link still points to the new run. Copied pages keep old attachment links.

## 7. Permissions

- View restrictions inherit down the page tree. Restrict the root once, rather than each run page.
- Verify as a regular reader (or with an incognito colleague): editors can often reach attachments or external URLs that readers cannot.
- External HTML hosting must have the same audience as the Confluence space.

## 8. Editor habits that save time

- `/` opens the insert menu: `/status`, `/info`, `/table`, `/toc`, `/expand`, `/excerpt`, `/jira`.
- Markdown shortcuts work while typing: `## ` heading, `* ` bullet, `1. ` list, `> ` quote, ` ``` ` code block, `[] ` action item.
- `Ctrl/Cmd + K` inserts a link; `@` mentions a person (and notifies them); `//` or `/date` inserts a date.
- Use page templates (space settings) for anything created more than twice by hand.
- Use page history ("Compare versions") to review what an automated publish changed.
- Archive old pages instead of deleting; archived pages drop out of search and the tree but keep links alive.

## 9. Anti-patterns

> [!failure] Avoid
> - A wall of macros (Expand inside Expand, tabs, embeds) for a page people only skim.
> - Duplicated tables maintained by hand on two pages.
> - Colour-only status, or a status cell left blank when a check did not run.
> - Times without timezone; dates in non-ISO format.
> - Live-editing historical evidence pages.
> - Screenshots of tables instead of real tables (not searchable, not accessible).
> - Using the `html` macro: disabled by default in Cloud.

## 10. Pre-publish checklist

- [ ] First screen answers OK / action / detail
- [ ] Numbers match the source file
- [ ] Every row has a status in every status column (no blanks)
- [ ] Incomplete results are not green
- [ ] Every link spot-checked as a reader
- [ ] Title has date + unique id; labels applied
- [ ] Timezone shown on every timestamp
- [ ] Full width if the table is wide
