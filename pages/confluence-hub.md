---
title: Confluence Hub
aliases:
  - Confluence MOC
  - Confluence notes index
tags:
  - confluence
  - moc
created: 2026-10-05
updated: 2026-10-05
---

# Confluence Hub

Entry point for everything about building better Confluence pages, general practice first, then the dtrack report.

> [!abstract] One-line rule
> A good Confluence page answers **"Is it OK? What needs action? Where is the detail?"** on the first screen, and is generated from a single source of truth.

## Notes

| Note | Use it when |
|---|---|
| [[confluence-page-design-principles]] | Designing any page: structure, wording, tables, status, links, permissions |
| [[confluence-macro-cheatsheet]] | Choosing a macro, and needing its editor command plus storage-format XHTML |
| [[confluence-automation-api]] | Publishing pages from code: REST v2/v1, idempotency, attachments, labels, pitfalls |
| [[confluence-run-page-template]] | Copy-paste storage-format skeleton for a dtrack run page |
| [[confluence-report-page-review]] | Gaps and conflicts between the two existing dtrack designs, with recommendations |
| [[confluence-rest-api.ipynb]] | Runnable REST API walkthrough, stdlib only, dry-run by default |

## Existing dtrack designs

- [[confluence_report_page]]: automated publishing design (`dtrack publish-confluence`, attachments, parent/child pages)
- [[dtrack-confluence-row-col-check-report]]: manual click-through guide (page tree, Status elements, Content Properties)

> [!warning] The two designs disagree
> Status vocabulary, PARTIAL colour, the Latest page and the HTML link strategy differ between them. Settle these first: see [[confluence-report-page-review#Conflicts to settle]].

## Reading order

```mermaid
flowchart LR
  A[design principles] --> B[macro cheatsheet]
  B --> C[run page template]
  C --> D[automation API]
  D --> E[report page review]
```
