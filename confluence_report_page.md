# Confluence row/col check report page

- Date: 2026-10-01
- Branch: pkg/distributed
- Status: Design finalized, not implemented
- Scope: Split dtrack report artifacts by pair and add a new `dtrack publish-confluence` subcommand to create/update Confluence pages

## 0. Finalized decisions (2026-10-01)

| Question | Decision | Impact |
|---|---|---|
| Confluence version | **Cloud (atlassian.net)** | Basic auth = email + API token; HTML attachments are always downloaded rather than rendered inline |
| Linking approach | **Attachments (Option B)**, because the report bucket has no stable HTTP endpoint | All four file types are attached to the page; HTML links mean “download and open locally” |
| Page structure | **latest parent page + one child page per run** | Attachments are uploaded only to the immutable child page; the parent page references attachments across pages without re-uploading them |
| In-page details | **Links only** | No expandable sections; keep the page lightweight |

## 1. Goal

After each run, Confluence should contain a per-pair table with one row per pair, making the row check / col check results immediately visible.
Each row provides two direct links, HTML and XLSX, to that pair's details. The page is generated mechanically from `summary.json`, is idempotent, and can be published repeatedly.

Design principles:

1. The link column contains **two separate links (HTML and XLSX)** rather than “one link that works for both HTML and Excel.” HTML can navigate with a `#anchor`,
   but Excel cannot select a sheet through a URL, so each format needs a pair-specific target file.
2. Links point to **permanent targets** (Confluence attachments), not presigned URLs, which expire after at most seven days and would leave broken links on the page.
3. The Confluence page reads only `summary.json`; it does not access the work store or re-parse row_check / results.
4. The page is a navigation layer. Details remain in HTML/XLSX, keeping the page itself lightweight.
5. Files are uploaded only once: attachments live on an immutable run child page, while the latest parent page is only a pointer.

## 2. Page design

### 2.1 Layout

```
latest parent page  "dtrack · latest" (overwritten on every run)
  [panel]  Run 2026-10-01T08  STATUS: DONE   units 412/412   findings 5   generated_at 2026-10-01 08:12 EDT
           Full HTML · Full XLSX · summary.json             ← cross-page attachment references pointing to this run's child page
  [table]  per-pair table (see 2.2)                          ← links are also cross-page attachment references
  [table]  Most recent N runs: run_id · status · findings · child-page link   (N defaults to 10)

run child page  "dtrack · <run_id>" (created once and immutable)
  The same panel + per-pair table, with links to attachments on this page
  Attachments: index.html, report.xlsx, summary.json, and four files per pair
```

The parent and child pages use the same rendering function; parent-page attachment references simply include an additional `ri:page` level.

### 2.2 Table columns

| Column | Content | Source (summary.json → pair_reports[i]) |
|---|---|---|
| Pair | Pair name | `pair` |
| Sources | `oracle / databricks` | `left.source`, `right.source` |
| Window | `2026-01-01..06-30 (month)` | `bounds.from`, `bounds.to`, `vintage` |
| Row check | Status chip + `match/count_diff/left_only/right_only` counts | `row.*` |
| Col check | Status chip + `diff/columns cols`; append `N dead` when applicable | `col.*` |
| Sample | `all` / `10%` / `50k` | `sample.mode/rate/count` |
| Report | Three attachment links: `HTML · XLSX · CSV` | `files.*` → attachment name |

Example:

```
| Pair   | Sources            | Window                   | Row check                    | Col check          | Sample | Report            |
|--------|--------------------|--------------------------|------------------------------|--------------------|--------|-------------------|
| events | trino / databricks | 2026-03-01..06-30 (week) | MATCH  17/17                 | PARTIAL 2 dead     | 50k    | HTML · XLSX · CSV |
| orders | oracle / databricks| 2026-01-01..06-30 (month)| MATCH  181/181               | DIFF  3/42 cols    | 10%    | HTML · XLSX · CSV |
| users  | hive / databricks  | 2026-01-01..06-30 (month)| DIFF  2 count_diff 1 left    | NOT_RELEASED       | all    | HTML · XLSX       |
```

Report-column user experience in Cloud: Confluence can preview or download XLSX / CSV files. Clicking HTML downloads the file,
which can then be opened locally in a browser. Each per-pair HTML file is already self-contained (inline CSS, no external resources) and works offline.

### 2.3 Status derivation and sorting

Row status (from the row_check document's `summary` and `gate_decision`):

| Condition | status | Color |
|---|---|---|
| `left_only + right_only > 0` | MISSING | Red |
| Otherwise, `count_diff > 0` | DIFF | Yellow |
| Otherwise | MATCH | Green |

Col status (from manifest + results + dead):

| Condition | status | Color |
|---|---|---|
| No manifest for the pair (the gate did not pass) | NOT_RELEASED | Grey |
| `dead > 0` or `units_completed < units_expected` | PARTIAL | Red |
| Any result has `verdict == "diff"` | DIFF | Yellow |
| Otherwise | PASS | Green |

Sort by descending severity, then by pair name within the same severity. Severity = max(row, col), where Red=0, Yellow=1, Grey=2, Green=3.
Pairs requiring attention always appear first.

## 3. Artifact changes (`src/dtrack_right/report/build.py`)

Currently, `build_report` produces only the all-pair `index.html` / `report.xlsx`. The artifacts must be split before per-pair links can be added.
`build.py` already loops over documents, so each iteration only needs one additional call to `wrap_document` and `build_workbook`.

### 3.1 New directory layout

```
history/<run_id>/
  index.html, report.xlsx, summary.json          Existing; retained
  pairs/<pair>/index.html                        New: contains only this pair's Stage 1 + Stage 2 sections
  pairs/<pair>/report.xlsx                       New: build_workbook([document], {pair: rows})
  pairs/<pair>/compare_row.csv                   Existing <pair>_compare_row.csv moved here
  pairs/<pair>/compare_col.csv                   Existing <pair>_compare_col.csv moved here
```

Change the keys in the `files` dictionary to relative paths (`pairs/orders/index.html`), so `publish_report` can continue to use `key = base + name` directly.
Note that `fetch_report` (`dtrack_left/backends/store.py`) must call `target.parent.mkdir(parents=True)` before writing to `out / name`,
or nested paths will fail.

Compatibility: top-level `<pair>_compare_*.csv` files will no longer be produced. Consumers of `dtrack fetch-report` that rely on filenames must instead use `summary.json["pair_reports"][i]["files"]`.

### 3.2 summary.json extension

Retain all existing fields (`pairs` remains an integer, and `summary_section` is still in use) and add a `pair_reports` list:

```json
"pair_reports": [
  {
    "pair": "orders",
    "left":  {"source": "oracle", "table": "SCHEMA.ORDERS"},
    "right": {"source": "databricks", "table": "cat.sch.orders"},
    "bounds": {"from": "2026-01-01", "to": "2026-06-30"},
    "vintage": "month",
    "sample": {"mode": "fraction", "rate": 0.1},
    "row": {"status": "MATCH", "gate_passed": true,
            "match": 181, "count_diff": 0, "left_only": 0, "right_only": 0},
    "col": {"status": "DIFF", "columns": 42, "diff": 3,
            "units_expected": 252, "units_completed": 252, "dead": 0},
    "files": {"html": "pairs/orders/index.html", "xlsx": "pairs/orders/report.xlsx",
              "row_csv": "pairs/orders/compare_row.csv", "col_csv": "pairs/orders/compare_col.csv"}
  }
]
```

Field sources:

- `bounds` / `vintage` / `sample`: `document["pair_config"]` (the left-side row_check already contains `bounds`; confirm whether the merged right-side document retains it, otherwise read `fromDate/toDate` from `pair_config`)
- `row.*`: `document["summary"]` (the four counts from `summarize_partitions`) + `document["gate_decision"]["passed"]`
- `col.columns` / `units_expected`: `manifests[pair]["columns"]`, `["expected_units"]`
- `col.diff` / `units_completed` / `dead`: `results_by_pair[pair]`; assign `dead` to pairs by the `unit_id` prefix
- `files`: record these while writing the files described in 3.1

`latest/pointer.json` remains unchanged.

## 4. Link resolution: Confluence attachments

### 4.1 Why attachments

| Option | HTML | XLSX / CSV | Validity | Cost | Decision |
|---|---|---|---|---|---|
| A. Stable HTTP endpoint (CloudFront, etc.) | Render directly in the browser | Download | Permanent | Requires infrastructure that does not currently exist | Add `--base-url` and switch back if an endpoint becomes available |
| B. Confluence attachments | Cloud forces a download; open locally | Preview + download, with permissions inherited from the page | Permanent | Upload 3 + 4N files per run | **Selected** |
| C. Presigned URL | Render | Download | ≤ 7 days | None | Rejected |

### 4.2 Attachment naming and ownership

- All attachments belong to the **run child page** `dtrack · <run_id>`. The child page is immutable, so each file is uploaded only once and attachment versions do not accumulate.
- Filenames must be unique within a page. Prefix them with the pair name and remove the directory:

```
index.html, report.xlsx, summary.json
<pair>_report.html, <pair>_report.xlsx, <pair>_compare_row.csv, <pair>_compare_col.csv
```

- The parent page `dtrack · latest` has no attachments; it links to child-page attachments through cross-page references:

```xml
<ac:link>
  <ri:attachment ri:filename="orders_report.xlsx">
    <ri:page ri:content-title="dtrack · 2026-10-01T08" ri:space-key="DT"/>
  </ri:attachment>
  <ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body>
</ac:link>
```

- Links on the child page itself omit `ri:page`.

### 4.3 Size and limits

- Per-pair HTML / XLSX files are typically tens of KB to several MB. The default Cloud per-attachment limit is configured by the site administrator (commonly 100 MB).
  During implementation, emit a warning and skip any individual file larger than 50 MB; display that link as grey text in the table rather than leaving a broken link.
- Upload attachments one file at a time. N pairs require approximately 4N requests; sequential requests are sufficient and concurrency is unnecessary.

## 5. Publishing workflow: `dtrack publish-confluence`

Following existing conventions, add a new subcommand instead of adding flags to `report` / `fetch-report`.

### 5.1 CLI contract

```
dtrack publish-confluence
    [--report-s3 s3://bucket/prefix | --report-dir PATH]   Mutually exclusive; S3 uses the existing fetch_report to retrieve all of history/<run_id>/
    [--run-id ID]                                          Defaults to latest/pointer.json
    --space KEY                                             DTRACK_CONFLUENCE_SPACE
    [--parent "dtrack reports"]                             Parent-page title; defaults to the space root
    [--title-prefix "dtrack"]                               Page-title prefix; defaults to dtrack
    [--history-n 10]                                        Number of entries in the parent page's “Most recent N runs” table
    [--force]                                               Re-upload attachments and overwrite the body when the child page already exists
    [--dry-run]                                             Print both storage XHTML documents without calling the API or uploading files
    [--json]
```

Environment variables: `DTRACK_CONFLUENCE_URL` (`https://<site>.atlassian.net/wiki`, including `/wiki`; the code must not infer it),
`DTRACK_CONFLUENCE_USER` (email), `DTRACK_CONFLUENCE_TOKEN` (API token), and `DTRACK_CONFLUENCE_SPACE`.

### 5.2 Execution order and idempotency

```
1. Retrieve summary.json (locally or through fetch_report)
2. Child page "dtrack · <run_id>":
     Does not exist            → POST to create it (with placeholder body) → upload attachments one by one → PUT the body (with links to attachments on this page)
     Exists without --force    → skip step 2 and proceed directly to step 3
     Exists with --force       → for each attachment name: use the update-data endpoint if it exists, otherwise create it; PUT body with version+1
3. Parent page "dtrack · latest":
     List history/ to obtain the most recent N run_ids and render the body (attachment links include ri:page references to the child pages)
     Does not exist → POST; exists → PUT with version+1
4. --json output: two page IDs, URL, number of uploaded attachments, and number skipped
```

This matches the semantics of S3's `history/<run_id>/` + `latest/pointer.json`. Confluence retains its own version history, so earlier versions remain available even when the parent page is overwritten.

### 5.3 Storage-format snippets

```xml
<!-- status chip -->
<ac:structured-macro ac:name="status">
  <ac:parameter ac:name="colour">Green</ac:parameter>
  <ac:parameter ac:name="title">MATCH</ac:parameter>
</ac:structured-macro>

<!-- attachment link on this page (child page) -->
<ac:link><ri:attachment ri:filename="orders_report.xlsx"/>
  <ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body></ac:link>

<!-- cross-page attachment link (parent page): see 4.2 -->

<!-- child-page link (parent page's “Most recent N runs” table) -->
<ac:link><ri:page ri:content-title="dtrack · 2026-10-01T08" ri:space-key="DT"/>
  <ac:plain-text-link-body><![CDATA[2026-10-01T08]]></ac:plain-text-link-body></ac:link>
```

Do not use the `html` macro (disabled by default in Cloud) or `expand`. Color mapping: Green=MATCH/PASS, Yellow=DIFF, Red=MISSING/PARTIAL, Grey=NOT_RELEASED.

### 5.4 REST endpoints (Cloud)

| Operation | Endpoint | Notes |
|---|---|---|
| Find page | `GET /wiki/api/v2/pages?space-id=&title=` | v2; first resolve space key → space ID once with `GET /wiki/api/v2/spaces?keys=` |
| Create page | `POST /wiki/api/v2/pages` | body `{"spaceId","status":"current","title","parentId","body":{"representation":"storage","value":...}}` |
| Update page | `PUT /wiki/api/v2/pages/{id}` | Include `version.number + 1` |
| List attachments | `GET /wiki/api/v2/pages/{id}/attachments` | Used by `--force` to decide whether to create or update |
| Upload attachment | `POST /wiki/rest/api/content/{id}/child/attachment` | v2 has no upload endpoint, so continue using v1; header `X-Atlassian-Token: nocheck`, multipart `file` |
| Update attachment | `POST /wiki/rest/api/content/{id}/child/attachment/{attachmentId}/data` | Only with `--force` |

Authentication: `requests.auth.HTTPBasicAuth(email, token)`. During implementation, verify against the then-current Atlassian documentation that the v1 attachment endpoint has not been retired.

## 6. Code change list

| File | Change |
|---|---|
| `src/dtrack_right/report/build.py` | Write per-pair html/xlsx/csv files to `pairs/<pair>/`; change `files` keys to relative paths; add `pair_reports` to `_summary` (derive status in `_pair_report(document, manifest, rows, dead)`) |
| `src/dtrack_right/report/html.py` | No changes; per-pair pages reuse `wrap_document(title=pair, sections=[row_section, col_section], subtitle=run_id)` |
| `src/dtrack_right/report/excel.py` | No changes |
| `src/dtrack_left/backends/store.py` | Have `fetch_report` create parent directories |
| `src/dtrack_left/report/__init__.py` | New package |
| `src/dtrack_left/report/confluence.py` | `render_page(summary, *, attachments_on: str \| None, recent_runs)` produces storage XHTML; `attachment_name(pair, kind)`; `ConfluenceClient` (`space_id` / `find_page` / `create_page` / `update_page` / `list_attachments` / `upload` / `update_attachment`, using `requests`); `publish(...)` orchestrates the workflow in 5.2 |
| `src/dtrack_left/cli/tools.py` | `publish_confluence_command` |
| `src/dtrack_left/cli/__init__.py` | Register the subcommand + add one line to the configuration reference |
| `src/dtrack_left/__main__.py` | Add step 8 to the distributed-workflow step table |
| `src/dtrack_local/pipeline.py` | Keep the `report()` return value unchanged; add a thin `publish_confluence(run, space)` wrapper that calls `dtrack_left.report.confluence.publish` |
| `src/dtrack_local/notebooks/03_report_and_backup.ipynb` | Add a publish cell at the end with a `CONFLUENCE_SPACE` parameter that defaults to the environment variable |

Constraints: `dtrack_right` must not import `dtrack_left`; `dtrack_left/report/confluence.py` depends only on `summary.json` and file paths and must not import `dtrack_right`.
Add `requests` to pyproject as a dtrack_left dependency (do not change dtrack_right's `requirements.txt`).
The new `dtrack_left/report/` directory contains two files, satisfying the ≤ 5 files/directory limit.

## 7. Tests

- `tests/unit`: `build_report` produces all four files under `pairs/<pair>/`; test the four row-status × four col-status derivations in `pair_reports`, plus sorting.
- `tests/unit`: `render_page` XHTML contains each pair's status macro, three `ri:attachment` links, and severity ordering; in parent-page mode every `ri:attachment` includes `ri:page`, while in child-page mode none do.
- `tests/unit`: mock `ConfluenceClient` coverage for create and update (version+1), new attachment vs `--force` update, and the `X-Atlassian-Token` header.
- `tests/unit`: `publish` orchestration: do not upload attachments when the child page already exists; `--dry-run` makes zero HTTP calls.
- `tests/unit`: `fetch_report` writes nested paths to disk.
- Packaging test: `dtrack_right` does not reference `dtrack_left`.
- Manual: paste `--dry-run` XHTML into Confluence's “Insert Markup” dialog to validate rendering and confirm that parent-page cross-page attachment links open successfully.

## 8. Out of scope

- Do not generate presigned URLs.
- Do not change the `latest/pointer.json` structure.
- Do not render detail tables or expandable sections in Confluence; details belong in HTML / XLSX.
- Do not implement pair-level Excel deep links across sheets.
- Do not support Data Center (authentication and endpoints differ); add `DTRACK_CONFLUENCE_FLAVOR` later if needed.
- Do not attach files to the parent page or implement an attachment-cleanup task.

## 9. Possible future work

- Once a stable HTTP endpoint is available, add `--base-url` and change the Report column to external links so HTML can render directly in the browser.
- Add a small cross-run trend table to the parent page (findings over time).
