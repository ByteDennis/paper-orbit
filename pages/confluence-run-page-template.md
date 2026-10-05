---
title: Confluence Run Page Template
aliases:
  - dtrack run page skeleton
tags:
  - confluence
  - template
  - dtrack
created: 2026-10-05
updated: 2026-10-05
related:
  - "[[confluence-hub]]"
  - "[[confluence-macro-cheatsheet]]"
  - "[[confluence-report-page-review]]"
---

# Confluence Run Page Template

Back to [[confluence-hub]]. Storage-format skeleton for one dtrack run page that applies [[confluence-page-design-principles]]. `{{...}}` are render-time placeholders; every one must be XML-escaped.

## Layout

```text
Title: {{run_date}} · {{run_id}}
Labels: dtrack, dtrack-run, dtrack-env-{{env}}

[Info]        headline sentence + what row/col check mean
[Properties]  Run date | Run ID | Environment | Status | Window | Pairs | Needs attention | Generated at | Owner
## Needs attention        non-green pairs only (omit section when empty)
## All pairs              full table, severity then name
## Artifacts              full HTML · full XLSX · summary.json
## Notes                  human-written, reruns, known issues
```

## Storage XHTML

```xml
<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    <p><strong>{{attention_count}} of {{pair_count}} pairs need attention</strong>: {{attention_list}}.</p>
    <p>Row check compares exact counts per date partition. Col check compares sampled, key-aligned column statistics and runs only after the row gate passes.</p>
  </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="details">
  <ac:parameter ac:name="id">dtrack-run</ac:parameter>
  <ac:rich-text-body>
    <table><tbody>
      <tr><th>Run date</th><td><time datetime="{{run_date}}"/></td></tr>
      <tr><th>Run ID</th><td><code>{{run_id}}</code></td></tr>
      <tr><th>Environment</th><td>{{env}}</td></tr>
      <tr><th>Status</th><td>{{run_status_macro}}</td></tr>
      <tr><th>Window</th><td>{{window_from}} → {{window_to}}</td></tr>
      <tr><th>Pairs</th><td>{{pair_count}}</td></tr>
      <tr><th>Needs attention</th><td>{{attention_count}}</td></tr>
      <tr><th>Generated at</th><td>{{generated_at}} {{tz}}</td></tr>
      <tr><th>Owner</th><td>{{owner}}</td></tr>
    </tbody></table>
  </ac:rich-text-body>
</ac:structured-macro>

<h2>Needs attention</h2>
{{attention_table}}

<h2>All pairs</h2>
<ac:structured-macro ac:name="excerpt">
  <ac:parameter ac:name="hidden">false</ac:parameter>
  <ac:rich-text-body>
    <table>
      <thead>
        <tr><th>Pair</th><th>Sources</th><th>Window</th><th>Row check</th><th>Col check</th><th>Sample</th><th>Δ vs prev</th><th>Report</th></tr>
      </thead>
      <tbody>
        {{pair_rows}}
      </tbody>
    </table>
  </ac:rich-text-body>
</ac:structured-macro>

<h2>Artifacts</h2>
<p>
  <ac:link><ri:attachment ri:filename="index.html"/><ac:plain-text-link-body><![CDATA[Download full HTML]]></ac:plain-text-link-body></ac:link> ·
  <ac:link><ri:attachment ri:filename="report.xlsx"/><ac:plain-text-link-body><![CDATA[Full XLSX]]></ac:plain-text-link-body></ac:link> ·
  <ac:link><ri:attachment ri:filename="summary.json"/><ac:plain-text-link-body><![CDATA[summary.json]]></ac:plain-text-link-body></ac:link>
</p>

<h2>Notes</h2>
<p>No notes.</p>
```

## One pair row

```xml
<tr>
  <td><ac:structured-macro ac:name="anchor"><ac:parameter ac:name="">{{pair}}</ac:parameter></ac:structured-macro><strong>{{pair}}</strong></td>
  <td>{{left_source}} / {{right_source}}</td>
  <td>{{from}}..{{to}} ({{vintage}})</td>
  <td>
    <ac:structured-macro ac:name="status">
      <ac:parameter ac:name="colour">{{row_colour}}</ac:parameter>
      <ac:parameter ac:name="title">{{row_status}}</ac:parameter>
    </ac:structured-macro> {{row_detail}}
  </td>
  <td>
    <ac:structured-macro ac:name="status">
      <ac:parameter ac:name="colour">{{col_colour}}</ac:parameter>
      <ac:parameter ac:name="title">{{col_status}}</ac:parameter>
    </ac:structured-macro> {{col_detail}}
  </td>
  <td>{{sample}}</td>
  <td>{{delta}}</td>
  <td>
    <ac:link><ri:attachment ri:filename="{{pair}}_report.html"/><ac:plain-text-link-body><![CDATA[HTML]]></ac:plain-text-link-body></ac:link> ·
    <ac:link><ri:attachment ri:filename="{{pair}}_report.xlsx"/><ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body></ac:link> ·
    <ac:link><ri:attachment ri:filename="{{pair}}_compare_col.csv"/><ac:plain-text-link-body><![CDATA[CSV]]></ac:plain-text-link-body></ac:link>
  </td>
</tr>
```

> [!tip] `Δ vs prev` column
> Compare with the previous run's `summary.json`: `new`, `fixed`, `same`, or `—` for the first run. Readers care most about what changed since yesterday, and it costs one extra file read.

## Latest page

```xml
<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    <p>Latest run: <ac:link><ri:page ri:content-title="{{run_date}} · {{run_id}}"/><ac:plain-text-link-body><![CDATA[{{run_date}} · {{run_id}}]]></ac:plain-text-link-body></ac:link> ({{run_status}}).</p>
  </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name="excerpt-include">
  <ac:parameter ac:name="nopanel">true</ac:parameter>
  <ac:parameter ac:name=""><ac:link><ri:page ri:content-title="{{run_date}} · {{run_id}}"/></ac:link></ac:parameter>
</ac:structured-macro>
```

## History page

```xml
<ac:structured-macro ac:name="detailssummary">
  <ac:parameter ac:name="cql">label = "dtrack-run" and space = "{{space_key}}"</ac:parameter>
  <ac:parameter ac:name="id">dtrack-run</ac:parameter>
  <ac:parameter ac:name="headings">Run date,Environment,Status,Pairs,Needs attention</ac:parameter>
  <ac:parameter ac:name="sortBy">Run date</ac:parameter>
  <ac:parameter ac:name="reverseSort">true</ac:parameter>
  <ac:parameter ac:name="firstcolumn">Run</ac:parameter>
</ac:structured-macro>
```

Zero maintenance: each new run page carries the `details` macro and the `dtrack-run` label, so it appears here automatically.
