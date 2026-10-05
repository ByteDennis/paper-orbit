# DTrack Row/Col Check Report: Confluence Implementation Guide

## 1. Objective and Recommendation

Create a reader-facing check report page in Confluence:

- Each dtrack run corresponds to one historical report page;
- The core of the report page is a table with one row per pair;
- Confluence stores summaries, statuses, owners, and links;
- Detailed row/col results remain in HTML, Excel, or CSV artifacts;
- HTML is used for online viewing, while Excel is used for downloads, filtering, and further analysis;
- Historical report pages are not overwritten after publication, preserving an audit trail.

For the initial version, use a standard Confluence table, Status elements, and attachment/external links. Do not introduce complex macros or plugins at the outset. Once the number of runs grows, add a Content Properties Report to generate the historical index automatically.

---

## 2. Recommended Page Tree

Create the following structure in the target Space:

```text
DTrack Reconciliation Reports
├── Latest Report
└── Report History
    ├── 2026-10-01 — <run_id>
    ├── 2026-09-30 — <run_id>
    └── ...
```

Page responsibilities:

| Page | Responsibility |
|---|---|
| `DTrack Reconciliation Reports` | Entry point, overview, and navigation to Latest/History |
| `Latest Report` | Points to or displays the latest run; it is not the sole repository of historical evidence |
| `Report History` | Index table of historical runs |
| `<date> — <run_id>` | Complete pair summary and artifact links for one run |

---

## 3. Initial Confluence Setup

The following steps assume the current Confluence Cloud editor. Button names may differ slightly in Data Center, but the page structure and fields can remain the same.

### 3.1 Create the Root Page

1. Open the Confluence Space where the reports will be stored.
2. Click **Create** in the top navigation or sidebar.
3. Select **Blank page**.
4. Enter the following page title:

   ```text
   DTrack Reconciliation Reports
   ```

5. Add the following description to the page:

   ```text
   This area stores the results of DTrack row-check and col-check runs.
   Confluence pages provide summaries and navigation; HTML, Excel, and CSV files contain the detailed check results.
   ```

6. Add two level-two headings:

   ```text
   Latest Report
   Report History
   ```

7. Click **Publish**.

### 3.2 Create the Report History Child Page

1. Open the newly published `DTrack Reconciliation Reports` page.
2. Select **More actions (...) → Create child page**. If that option is not available, click **Create** and select the parent page under page location.
3. Enter the title:

   ```text
   Report History
   ```

4. Insert a standard table with the following columns:

| Run Date | Run ID | Environment | Status | Pairs | Passed | Failed | Partial | Report |
|---|---|---|---|---:|---:|---:|---:|---|
| 2026-10-01 | `<run_id>` | PROD | DONE | 25 | 21 | 4 | 0 | View report |

5. Keep the sample row temporarily; you can delete it after setup is complete.
6. Publish the page.

For the initial version, simply add one row to this History table for each run. Later, you can replace manual maintenance with a Content Properties Report as described in Section 8.

### 3.3 Create the Latest Report Child Page

1. Create another child page under the root page.
2. Enter the title:

   ```text
   Latest Report
   ```

3. Add the following to the page body:

   ```text
   Current report: <paste the link to the latest historical report page>
   ```

4. Paste the historical report page URL.
5. Click the link and change its display style to a standard link or card. A standard link is recommended for maximum stability and simplicity.
6. Publish the page.

Do not duplicate the full pair table on `Latest Report`, as this would create two data sources that must be kept in sync. This page should contain only a link to the latest historical page.

---

## 4. Create a Report Page for One Run

### 4.1 Create the Page

1. Open the `Report History` page.
2. Create a child page under it.
3. Use the following title format:

   ```text
   YYYY-MM-DD — <run_id>
   ```

   Example:

   ```text
   2026-10-01 — 20261001T123000Z-a3f9c1
   ```

4. Add an Info panel below the page title: type `/info` and select **Info panel**.
5. Enter the following text in the panel:

   ```text
   Row check compares exact counts by date partition.
   Col check compares sampled, key-aligned column statistics after the row gate passes.
   ```

This explanation prevents readers from treating row findings and col findings as the same type of error.

### 4.2 Add the Run-Level Summary

Below the Info panel, insert a two-column table and configure the first column as a header column:

| Field | Value |
|---|---|
| Run ID | `<run_id>` |
| Environment | `DEV` / `UAT` / `PROD` |
| Overall Status | Status element: `DONE` / `PARTIAL` / `FAILED` |
| Date Window | `YYYY-MM-DD → YYYY-MM-DD` |
| Generated At | `YYYY-MM-DD HH:mm ET` |
| Pair Count | `25` |
| Passed | `21` |
| Failed | `3` |
| Partial | `1` |
| Owner | `@person` or team name |
| Source Report | `summary.json` or a link to the run artifact root directory |

To insert a Status element:

1. Click the Value cell for `Overall Status`.
2. Type `/status`.
3. Select **Status**.
4. Enter the text and set the color:
   - `DONE`: green;
   - `PARTIAL`: yellow;
   - `FAILED`: red;
   - `RUNNING`: blue.

### 4.3 Insert the Core Pair Table

1. Add the following heading below the summary:

   ```text
   Pair Results
   ```

2. Type `/table` and insert a nine-column table.
3. Enter the following fixed headers in the first row:

| Pair | Row Check | Row Findings | Col Check | Col Findings | Coverage | HTML Details | Excel / CSV | Owner / Note |
|---|---|---:|---|---:|---|---|---|---|

4. Add one row for each pair, for example:

| Pair | Row Check | Row Findings | Col Check | Col Findings | Coverage | HTML Details | Excel / CSV | Owner / Note |
|---|---|---:|---|---:|---|---|---|---|
| `orders` | PASS | 0 dates | FAIL | 3 columns | 30/30 dates; 1,000 samples | View HTML | Workbook (`orders_col`) | Investigate `RISK_SCORE` |
| `customers` | FAIL | 2 dates | SKIPPED | — | 28/30 dates | View HTML | Workbook (`customers_row`) | Row population mismatch |
| `products` | PASS | 0 dates | PASS | 0 columns | 30/30 dates; 500 samples | View HTML | Workbook | — |

5. Replace the plain text in the `Row Check` and `Col Check` cells with Status elements.

Recommended status rules:

| Status | Color | Meaning |
|---|---|---|
| `PASS` | Green | The check completed with no findings |
| `FAIL` | Red | The check completed and found differences |
| `PARTIAL` | Yellow | The result is incomplete and must not be treated as a pass |
| `SKIPPED` | Gray | The upstream gate did not pass, or configuration explicitly skipped the check |
| `RUNNING` | Blue | The check is still running and this is not a final result |

Note: If a Row Check failure prevents the Col Check from running, the Col Check must be marked `SKIPPED`. It must not be left blank or marked `PASS`.

### 4.4 Adjust the Table Display

1. Select the table.
2. Confirm that **Header row** is enabled in the table toolbar.
3. If the page body is too narrow, use the width setting in the upper-right corner of the page and select **Full width**.
4. Recommended column widths:
   - `Pair`: medium;
   - the two Check status columns: narrow;
   - the two Findings columns: narrow;
   - `Coverage`: medium;
   - the two link columns: medium;
   - `Owner / Note`: wide.
5. Do not put every date or column difference directly into the table; detailed results should remain in HTML/Excel.

---

## 5. Add Excel, CSV, and HTML Links

### 5.1 Attach Excel to Confluence

This approach is appropriate for internal reports that require Confluence access controls and attachment version history.

1. Edit the run report page.
2. Drag `report.xlsx` directly to the bottom of the page, or select **Add image, video, or file** from the toolbar.
3. Wait for the upload to complete.
4. Publish the page.
5. Open the published page.
6. Open **Show details / More → Attachments**.
7. Copy the link address for `report.xlsx`.
8. Edit the page again.
9. Select the corresponding `Workbook` text in the Pair table.
10. Press `Ctrl+K` or `Cmd+K`, paste the attachment link, and confirm.
11. Add the worksheet names after the link:

    ```text
    Workbook (`orders_row`, `orders_col`)
    ```

Do not rely on a link to open a specific Excel worksheet directly. The Confluence attachment link should point to the workbook, while the table tells readers which worksheet to use.

If you later update the Excel file on the same page, upload it using the exact same filename, `report.xlsx`. Confluence will retain a new attachment version; changes to the source file do not sync to Confluence automatically.

### 5.2 Attach Pair CSV Files

If you use the current per-pair CSV output from dtrack:

1. Upload `<pair>_compare_row.csv` and `<pair>_compare_col.csv` to the corresponding run page.
2. Copy the link for each file from the Attachments page.
3. Enter the following in the `Excel / CSV` cell of the Pair table:

   ```text
   Workbook · Row CSV · Col CSV
   ```

4. Add the respective links.
5. If there are many pairs, the initial version can link only to the workbook and list the CSV files together at the bottom of the page to avoid making the table too wide.

### 5.3 Use a Permanent External Link for HTML

HTML should be deployed to an internal static site or an object-storage web frontend rather than uploaded as a standard attachment with the expectation that Confluence will render it online.

1. Confirm that the HTML has been uploaded to a stable location, for example:

   ```text
   https://reports.example.internal/dtrack/history/<run_id>/index.html
   ```

2. Edit the Confluence run page.
3. Enter `View HTML` in the `HTML Details` cell.
4. Select the text and press `Ctrl+K` or `Cmd+K`.
5. Paste the URL.
6. Change the Smart Link display style to a standard inline link to avoid showing a large card in every row.

Links must meet the following requirements:

- Use a stable URL, not a short-lived presigned URL;
- Reader access must match the readership of the Confluence page;
- The HTML must open in a browser;
- A new run must not overwrite the URL of a historical run.

If the current dtrack output contains only a run-level `index.html`, each row can initially link to the same HTML page. Use the following link text:

```text
View run HTML
```

Do not imply that the link opens that specific pair. Once `pairs/<pair>/index.html` is generated in the future, change it to a true pair-level link:

```text
https://reports.example.internal/dtrack/history/<run_id>/pairs/<pair>/index.html
```

### 5.4 If HTML Can Only Be Uploaded as an Attachment

You can upload the HTML to the run page and provide a download link, but label the link clearly:

```text
Download HTML
```

Do not promise that it will run directly inside Confluence. Confluence, the browser, or enterprise security policies may treat HTML as a downloadable file or block script execution. A self-contained HTML file can still be downloaded and opened locally in a browser.

---

## 6. Pre-Publication Checklist

Before clicking Publish, verify each item:

- [ ] The page title includes both the date and a unique `run_id`.
- [ ] Overall Status matches `summary.json`.
- [ ] The pair count matches the summary.
- [ ] Every active pair has exactly one row.
- [ ] Row Check and Col Check have not been combined into one ambiguous status.
- [ ] If Row Check fails, a Col Check that did not run is marked `SKIPPED`.
- [ ] `PARTIAL` is not displayed in green.
- [ ] At least one HTML link and one Excel/CSV link have been spot-checked.
- [ ] Links use stable locations rather than short-lived presigned URLs.
- [ ] Page permissions do not expose the report to users who are not authorized to access the source data.
- [ ] The page is set to Full width, and the table does not require frequent horizontal scrolling.

After publication, open the page as a regular reader and verify link permissions. An editor's ability to access a resource does not mean that all readers can access the external HTML or attachments.

---

## 7. Routine Update Steps for Each New Run

### 7.1 Create a New Historical Page

1. Copy the previous run report page, or create one from the template.
2. Place the page under `Report History`.
3. Update the date and `run_id` in the title.
4. Clear all pair statuses, findings, coverage values, owner notes, and links from the previous run.
5. Enter the summary for the new run.
6. Populate the Pair Results table.
7. Upload the new `report.xlsx` and any CSV files that must be retained.
8. Replace the HTML links.
9. Complete the pre-publication checklist and publish the page.

The most common mistake after copying a page is retaining old attachment links. Even if the link text is unchanged, confirm that each URL points to the new page or new run path.

### 7.2 Update History

1. Edit `Report History`.
2. Add a row at the top of the table.
3. Enter the run date, run ID, environment, status, and counts.
4. Link the `Report` column to the newly published historical page.
5. Publish the page.

### 7.3 Update Latest Report

1. Edit `Latest Report`.
2. Replace the single current-report link.
3. Confirm that the link points to the newly published historical page.
4. Publish the page.

### 7.4 Do Not Modify Old Historical Pages

Do not overwrite old pages except to:

- Correct spelling;
- Repair broken links;
- Add clearly labeled supplemental notes.

If the check is rerun, create a new run page rather than replacing the old page's results.

---

## 8. Optional: Generate the Historical Index with Content Properties

Enable this section only after the number of historical runs grows and manual maintenance of `Report History` becomes error-prone.

### 8.1 Add Content Properties to Each Run Page

1. Edit a run page.
2. Type `/properties` around or near the run-level summary.
3. Select **Content Properties**.
4. Create a two-column table inside the macro.
5. Enable Header column.
6. Use exactly the same field names on every page:

| Field | Value |
|---|---|
| Run Date | `2026-10-01` |
| Run ID | `<run_id>` |
| Environment | `PROD` |
| Status | Status element |
| Pairs | `25` |
| Passed | `21` |
| Failed | `3` |
| Partial | `1` |

7. Edit the macro settings and set the Content Properties ID to:

   ```text
   dtrack-run-report
   ```

8. Add the following shared label to the page:

   ```text
   dtrack-run-report
   ```

9. Publish the page.

Field names must match exactly because Content Properties Report reads data from the table headers. The table inside the macro must have a header row or header column.

### 8.2 Add an Automatic Summary to the History Page

1. Edit `Report History`.
2. Type `/contentpropertiesreport`.
3. Select **Content Properties Report**.
4. Enter the following Label:

   ```text
   dtrack-run-report
   ```

5. Expand Options.
6. Enter the following Content Properties ID:

   ```text
   dtrack-run-report
   ```

7. Enter the following Columns to show:

   ```text
   Run Date, Run ID, Environment, Status, Pairs, Passed, Failed, Partial
   ```

8. If the interface provides `With ancestor`, limit the scope to the `Report History` page tree so that unrelated pages in the Space are not included.
9. Sort by modification time or Run Date. If the macro cannot reliably sort by the date field, ensure that page titles begin with `YYYY-MM-DD`.
10. Save the macro and publish the page.

The macro automatically includes links to the page titles, so you do not need to maintain a separate `Report` column.

### 8.3 Create a Space Template

If team members frequently create report pages manually:

1. Open the Space.
2. Select **More actions (...) → Space settings** next to the Space name.
3. Open **Look and Feel → Templates**.
4. Select **Create a new template**.
5. Enter the template name:

   ```text
   DTrack Run Report
   ```

6. Add the following fixed structure:
   - Info panel;
   - Content Properties macro;
   - Pair Results table;
   - Attachments/Notes section;
   - Pre-publication checklist.
7. Add the `dtrack-run-report` label to the template.
8. Save the template.

In the future, select this template when creating a page to prevent column names and macro IDs from drifting.

---

## 9. Recommended Minimum Rollout Sequence

### Phase 1: Can Be Completed Within One Day

1. Create the root page, Latest, and History.
2. Create one report page for a real run.
3. Use a standard Pair table and Status elements.
4. Upload `report.xlsx`.
5. Link the existing run-level `index.html`.
6. Manually maintain one History row and one link on Latest.

### Phase 2: After the Report Structure Stabilizes

1. Create a Space Template.
2. Use Content Properties + Content Properties Report to summarize history automatically.
3. Establish permanent internal static URLs for HTML reports.
4. If users frequently need to navigate directly from the table to a specific pair, implement per-pair HTML.

### Phase 3: When Automation Is Needed

Use the Confluence REST API to automate the following:

- Create a run child page;
- Write the summary and pair table;
- Upload `report.xlsx` / CSV files;
- Update the Latest link;
- Add the shared label.

Before automating, stabilize the page fields, status rules, link strategy, and permission model. Otherwise, automation will only amplify the cost of structural changes.

---

## 10. Mapping Current dtrack Outputs to Confluence

| dtrack artifact | Confluence location |
|---|---|
| `summary.json` | Run-level summary and History row |
| `<pair>_compare_row.csv` | Optional Row CSV link in the Pair row |
| `<pair>_compare_col.csv` | Optional Col CSV link in the Pair row |
| `index.html` | `View run HTML` link in the Pair table |
| `report.xlsx` | Workbook link in the Pair table, with the worksheet noted beside it |
| `latest/pointer.json` | Used by automation to locate the latest run; not intended for general readers |

The current report consists of run-level single-page HTML, a run-level Excel workbook, and per-pair CSV files. The initial Confluence version must not imply that per-pair HTML already exists. Until per-pair HTML is actually generated, display `View run HTML` explicitly.

---
