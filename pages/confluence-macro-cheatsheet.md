---
title: Confluence Macro Cheatsheet
aliases:
  - Confluence storage format cheatsheet
  - Confluence XHTML snippets
tags:
  - confluence
  - macros
  - storage-format
created: 2026-10-05
updated: 2026-10-05
related:
  - "[[confluence-hub]]"
  - "[[confluence-run-page-template]]"
  - "[[confluence-automation-api]]"
---

# Confluence Macro Cheatsheet

Back to [[confluence-hub]]. Each entry: editor command, storage-format name, when to use it, and a minimal XHTML snippet for automated publishing.

> [!info] Storage format basics
> - Body is XHTML: every tag closed (`<br/>`), `&` escaped as `&amp;`, prefer numeric entities (`&#160;`) over named ones.
> - Macros are `<ac:structured-macro ac:name="...">` with `<ac:parameter>` children.
> - Rich content goes in `<ac:rich-text-body>`; raw text (code) goes in `<ac:plain-text-body><![CDATA[...]]></ac:plain-text-body>`.
> - References use the `ri:` namespace: `ri:page`, `ri:attachment`, `ri:user`, `ri:url`.

## Quick table

| Need | Editor | Storage name | Use |
|---|---|---|---|
| Status chip | `/status` | `status` | Per-cell result, overall run status |
| Callout | `/info`, `/note`, `/warning`, `/tip` | `info`, `note`, `warning`, `tip` | Headline sentence, caveats |
| Key-value metadata | `/properties` | `details` | Run metadata, feeds the report macro |
| Index of many pages | `/contentpropertiesreport` | `detailssummary` | History table built automatically |
| Table of contents | `/toc` | `toc` | Long how-to pages only |
| Collapsible block | `/expand` | `expand` | Rarely: definitions, long notes |
| Reusable fragment | `/excerpt`, `/excerpt include` | `excerpt`, `excerpt-include` | Show one table on two pages |
| Child pages list | `/children` | `children` | Root or History page |
| Pages by label | `/content by label` | `contentbylabel` | Cross-space index |
| Attachment list | `/attachments` | `attachments` | "All artifacts" section |
| File preview | `/file` | `view-file` | Preview one XLSX/PDF inline |
| Jump target | `/anchor` | `anchor` | Per-pair anchors in long pages |
| Code | `/code` | `code` | Commands, config snippets |
| Jira issues | `/jira` | `jira` | Link findings to tickets |

> [!note] Naming drift
> Newer Cloud UI labels Page Properties / Page Properties Report as **Content Properties** / **Content Properties Report**. The storage names stay `details` / `detailssummary`.

## Status

Colours: `Grey`, `Red`, `Yellow`, `Green`, `Blue` (British spelling of the `colour` parameter). `subtle` gives an outline style.

```xml
<ac:structured-macro ac:name="status">
  <ac:parameter ac:name="colour">Green</ac:parameter>
  <ac:parameter ac:name="title">MATCH</ac:parameter>
</ac:structured-macro>
```

## Panels

```xml
<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    <p><strong>3 of 25 pairs need attention:</strong> orders, users, events.</p>
  </ac:rich-text-body>
</ac:structured-macro>
```

`note` (yellow), `warning` (red), `tip` (green) use the same shape. Optional `title` parameter.

## Page Properties and the report

On every run page:

```xml
<ac:structured-macro ac:name="details">
  <ac:parameter ac:name="id">dtrack-run</ac:parameter>
  <ac:rich-text-body>
    <table><tbody>
      <tr><th>Run date</th><td><time datetime="2026-10-01"/></td></tr>
      <tr><th>Run ID</th><td>2026-10-01T08</td></tr>
      <tr><th>Status</th><td><!-- status macro --></td></tr>
      <tr><th>Findings</th><td>5</td></tr>
    </tbody></table>
  </ac:rich-text-body>
</ac:structured-macro>
```

On the History page:

```xml
<ac:structured-macro ac:name="detailssummary">
  <ac:parameter ac:name="cql">label = "dtrack-run" and space = "DT"</ac:parameter>
  <ac:parameter ac:name="id">dtrack-run</ac:parameter>
  <ac:parameter ac:name="headings">Run date,Run ID,Status,Findings</ac:parameter>
  <ac:parameter ac:name="sortBy">Run date</ac:parameter>
  <ac:parameter ac:name="reverseSort">true</ac:parameter>
  <ac:parameter ac:name="firstcolumn">Run</ac:parameter>
</ac:structured-macro>
```

> [!warning] Exact-match rules
> Row header text must be identical on every page (case and spacing). The `id` on `details` must match the `id` on `detailssummary`. Pages must carry the label used in the CQL. The report reads only the first `details` macro with that id per page.

## Reuse

Wrap the pair table on the run page:

```xml
<ac:structured-macro ac:name="excerpt">
  <ac:parameter ac:name="hidden">false</ac:parameter>
  <ac:rich-text-body><table>...</table></ac:rich-text-body>
</ac:structured-macro>
```

Show it on `Latest` without copying:

```xml
<ac:structured-macro ac:name="excerpt-include">
  <ac:parameter ac:name="nopanel">true</ac:parameter>
  <ac:parameter ac:name="">
    <ac:link><ri:page ri:content-title="2026-10-01 · 2026-10-01T08"/></ac:link>
  </ac:parameter>
</ac:structured-macro>
```

Attachment links inside an included excerpt still resolve to the source page, which is what we want for immutable run pages.

## Links

```xml
<!-- page -->
<ac:link><ri:page ri:content-title="Report History"/><ac:plain-text-link-body><![CDATA[History]]></ac:plain-text-link-body></ac:link>

<!-- attachment on this page -->
<ac:link><ri:attachment ri:filename="orders_report.xlsx"/><ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body></ac:link>

<!-- attachment on another page -->
<ac:link>
  <ri:attachment ri:filename="orders_report.xlsx">
    <ri:page ri:content-title="2026-10-01 · 2026-10-01T08" ri:space-key="DT"/>
  </ri:attachment>
  <ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body>
</ac:link>

<!-- anchor on this page -->
<ac:link ac:anchor="orders"><ac:plain-text-link-body><![CDATA[orders]]></ac:plain-text-link-body></ac:link>

<!-- external, rendered as an inline smart link -->
<a href="https://reports.example.internal/dtrack/x/index.html" data-card-appearance="inline">HTML</a>

<!-- user mention -->
<ac:link><ri:user ri:account-id="5b10ac8d82e05b22cc7d4ef5"/></ac:link>
```

## Anchor

```xml
<ac:structured-macro ac:name="anchor">
  <ac:parameter ac:name="">orders</ac:parameter>
</ac:structured-macro>
```

## Children and labels

```xml
<ac:structured-macro ac:name="children">
  <ac:parameter ac:name="sort">title</ac:parameter>
  <ac:parameter ac:name="reverse">true</ac:parameter>
  <ac:parameter ac:name="depth">1</ac:parameter>
</ac:structured-macro>

<ac:structured-macro ac:name="contentbylabel">
  <ac:parameter ac:name="cql">label = "dtrack-run" and space = "DT"</ac:parameter>
  <ac:parameter ac:name="max">10</ac:parameter>
</ac:structured-macro>
```

## Files

```xml
<ac:structured-macro ac:name="attachments">
  <ac:parameter ac:name="patterns">.*\.xlsx,.*\.csv</ac:parameter>
  <ac:parameter ac:name="upload">false</ac:parameter>
</ac:structured-macro>

<ac:structured-macro ac:name="view-file">
  <ac:parameter ac:name="name"><ri:attachment ri:filename="report.xlsx"/></ac:parameter>
</ac:structured-macro>
```

## Code

```xml
<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">bash</ac:parameter>
  <ac:parameter ac:name="title">Republish a run</ac:parameter>
  <ac:plain-text-body><![CDATA[dtrack publish-confluence --run 2026-10-01T08 --force]]></ac:plain-text-body>
</ac:structured-macro>
```

## Expand

```xml
<ac:structured-macro ac:name="expand">
  <ac:parameter ac:name="title">How statuses are derived</ac:parameter>
  <ac:rich-text-body><p>...</p></ac:rich-text-body>
</ac:structured-macro>
```

## Other building blocks

```xml
<time datetime="2026-10-01"/>

<ac:task-list>
  <ac:task><ac:task-status>incomplete</ac:task-status><ac:task-body>Investigate RISK_SCORE drift</ac:task-body></ac:task>
</ac:task-list>

<ac:layout>
  <ac:layout-section ac:type="two_equal">
    <ac:layout-cell><p>left</p></ac:layout-cell>
    <ac:layout-cell><p>right</p></ac:layout-cell>
  </ac:layout-section>
</ac:layout>
```

> [!tip] Fastest way to learn a macro's storage form
> Build it once in the editor, then read the page with `GET /wiki/api/v2/pages/{id}?body-format=storage`. Copy what Confluence produced instead of guessing parameters.
