---
title: One-slide manager report templates
aliases:
  - Manager one-pagers
  - Consumer banking one-slide reports
tags:
  - reports
  - templates
  - pptx
  - consumer-banking
created: 2026-10-05
updated: 2026-10-05
---

# One-slide manager report templates

Fourteen one-page PowerPoint templates for reporting upward in a consumer banking business. Each file is one slide in its own visual style, written in business English and filled with **illustrative fictional numbers** so it reads as a finished page; swap the numbers and keep the structure.

![[catalog.jpg]]

> [!abstract] The rule every page follows
> **Title = the sentence you want remembered.** One line of meta (period · audience · owner · date). Body answers *is it OK, what needs action, where is the detail*. Status always carries a word next to its colour. Footer says the figures are illustrative.

## The templates

| File | Style | Use it when | Body structure |
|---|---|---|---|
| `01-executive-summary.pptx` | SCQA executive summary | Quarterly / monthly business review pre-read | 3 numbered messages (headline + support) · "What I need from you" card with a date |
| `02-kpi-dashboard.pptx` | KPI dashboard | Month-end scorecard | 6 stat tiles (good/bad colour, not up/down) · 2 single-series trend charts · one so-what line |
| `03-rag-status.pptx` | RAG status tracker | Weekly portfolio / programme review | Workstream × (status, this period, next period, owner) · overall rating · decisions needed · legend |
| `04-decision-memo.pptx` | Decision memo | You need a decision by a date | Situation · why it matters · deadline · options × criteria table (recommended column tinted) · recommendation + asks |
| `05-chart-insight.pptx` | Chart-led insight (consulting) | One chart tells the story | Emphasised two-series chart (one colour, one grey) · 3 takeaways · next step |
| `06-weekly-board.pptx` | Weekly update board (dark) | Team weekly to your manager | Done · In progress · Next week · Blockers and asks (each card ends in an ask) |
| `07-plan-vs-actual.pptx` | Variance analysis | Monthly finance review | Variance bar chart (favourable +, unfavourable −) · P&L table · 3 drivers written as causes |
| `08-risk-heatmap.pptx` | Risk heat map | Quarterly risk review | 3×3 likelihood × impact grid, one hue · register with owner, mitigation, trend |
| `09-roadmap.pptx` | Roadmap / Gantt | Planning review, prioritisation | Quarter header · bars (committed vs pending) · decision-gate diamonds · milestones · today line |
| `10-customer-funnel.pptx` | Funnel | Growth / acquisition review | Stage bar chart · step conversion vs benchmark (weakest step tinted) · where the leak is · actions |
| `11-segment-scorecard.pptx` | Heat table | Product or segment review | Product × measure cells with ▲ ● ▼ and tint vs target · overall column · 3 highlight cards |
| `12-business-case.pptx` | Business case one-pager | Investment committee | 4 headline numbers · cumulative cash-flow chart with break-even · benefits / assumptions / risks · decision requested |
| `13-incident-report.pptx` | Post-incident report (dark) | After an outage or Sev-2 | 4 fact tiles · alert-to-close timeline · root cause · customer impact · actions with owner, date, status |
| `14-okr-scorecard.pptx` | OKR scorecard | Quarter-end objectives review | 3 objectives × 3 key results · progress bar · confidence pill · proposed reset with a date |

Each deck has speaker notes describing how to fill it in. Headings and body use safe fonts (Cambria, Century Schoolbook, Calibri, Arial), so the files render the same in PowerPoint, Keynote and LibreOffice.

## Conventions baked into every file

- **Status colours** are fixed and never reused for data series: green `0CA30C` good, amber `FAB219` at risk, red `D03B3B` off track, grey `898781` not run. Each status has a word beside the dot, so colour never carries meaning alone.
- **Good/bad, not up/down.** A falling cost ratio is green; a rising delinquency is red.
- **Incomplete is never green.** Partial, skipped and running results get amber or grey.
- **Illustrative numbers are consistent across pages**: deposits $48.2bn (checking 21.4 + savings & CDs 26.8), consumer loans $31.6bn (cards 6.2 + mortgages 19.8 + auto 3.9 + personal 1.7), card 30+ DPD 1.42%, digital active 68%, NIM 3.18%, cost-to-income 58.4%. Change one page and the others still agree.
- **Charts are native PowerPoint charts** (editable data), one series per chart except the deliberate two-series emphasis chart on page 05. Variance and cash-flow charts colour negatives automatically.
- **One theme per file.** Colours are theme colours, so *Design → Variants → Colors* in PowerPoint restyles a page in one click; fonts come from the theme's heading/body pair.
- Footer on every page: "All figures are illustrative and for template use only · Replace with actuals before distribution." Delete it once the numbers are real.

## Editing

Open the `.pptx` and edit in place: text boxes, tables and charts are all native objects. To change the layout or generate a new variant, edit the JavaScript instead and rebuild:

```
reports/build/
  build.js          runner: node build.js [02 07 ...]   (no args = all)
  common.js         canvas, theme/layout, helpers (cards, badges, pills, tables, chart chrome)
  apply_theme.js    writes each file's colour scheme into the deck (vendored from the pptx skill)
  slides/NN-*.js    one spec per page: theme + title + meta + notes + build()
```

```bash
npm install pptxgenjs          # once, anywhere; then point NODE_PATH at it
NODE_PATH=<that>/node_modules node reports/build/build.js        # all 14
NODE_PATH=<that>/node_modules node reports/build/build.js 04 12  # just two
```

A spec is a plain object: change the data arrays at the top of the file (`tiles`, `rows`, `risks`, `objectives` …) and rebuild. Canvas is 13.33 × 7.5 in with 0.5 in margins; content starts at `TOP = 1.95` and ends at `BOTTOM = 6.95`.

## QA that was run

- `validate.py` (OOXML schema, relationships, chart XML) passes on all 14 files.
- Every page rendered through LibreOffice and inspected: no overflow, overlap or clipped text at 110 dpi.
- Text dump checked for leftover placeholders.
- The two-series chart palette (green `238636` + grey `B0B7B0`) passes the colour-vision checks; grey is the sanctioned "de-emphasised series" exception and the bars carry value labels.

## Related

- [[confluence-page-design-principles]] — same first-screen rule applied to Confluence pages
- [[confluence-hub]]
