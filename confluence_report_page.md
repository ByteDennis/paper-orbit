# Confluence row/col check report page

- 日期: 2026-10-01
- 分支: pkg/distributed
- 状态: 设计已定稿，未实现
- 范围: dtrack report 产物拆分到 pair 级 + 新子命令 `dtrack publish-confluence` 生成/更新 Confluence 页面

## 0. 已定决策 (2026-10-01)

| 问题 | 决定 | 影响 |
|---|---|---|
| Confluence 版本 | **Cloud (atlassian.net)** | basic auth = email + API token；HTML 附件强制下载，不内联渲染 |
| 链接方案 | **附件 (方案 B)**，report bucket 没有稳定 HTTP 入口 | 四类文件全部作为页面附件；HTML 链接是“下载后本地打开” |
| 页面结构 | **latest 父页 + 每 run 子页** | 附件只传子页（不可变），父页用跨页附件引用，不重传 |
| 页内明细 | **只放链接** | 不做 expand 折叠块，页面保持轻 |

## 1. 目标

每次 run 结束后，在 Confluence 上得到一张 per-pair 表：一行一个 pair，一眼看出 row check / col check 的结论，
每行带 HTML 和 XLSX 两个链接直达该 pair 的明细。页面由 `summary.json` 机械生成，幂等，可重复发布。

设计原则:

1. 链接列放 **两个独立链接（HTML、XLSX）**，不做“一个链接既可 HTML 又可 Excel”。HTML 可以用 `#anchor` 定位，
   Excel 无法通过 URL 定位 sheet，所以两种格式各自需要 pair 级的目标文件。
2. 链接指向 **永久有效的目标**（Confluence 附件），不用 presigned（最多 7 天失效，页面会烂）。
3. Confluence 页面只读 `summary.json`，不碰 work store，不重新解析 row_check / results。
4. 页面是导航层，明细留在 HTML/XLSX 里。页面本身保持轻。
5. 文件只上传一次：附件挂在不可变的 run 子页上，latest 父页只是指针。

## 2. 页面设计

### 2.1 布局

```
latest 父页  "dtrack · latest"（每次 run 覆盖）
  [panel]  Run 2026-10-01T08  STATUS: DONE   units 412/412   findings 5   generated_at 2026-10-01 08:12 EDT
           全量 HTML · 全量 XLSX · summary.json          ← 跨页附件引用，指向本 run 子页
  [table]  per-pair 表（见 2.2）                         ← 链接同样是跨页附件引用
  [table]  最近 N 次 run: run_id · status · findings · 子页链接   (N 默认 10)

run 子页  "dtrack · <run_id>"（创建一次，不可变）
  同样的 panel + per-pair 表，链接是本页附件
  附件: index.html, report.xlsx, summary.json, 每 pair 4 个文件
```

父页和子页用同一个渲染函数，只是附件引用多一层 `ri:page`。

### 2.2 表格列

| 列 | 内容 | 来源 (summary.json → pair_reports[i]) |
|---|---|---|
| Pair | pair 名 | `pair` |
| Sources | `oracle / databricks` | `left.source`, `right.source` |
| Window | `2026-01-01..06-30 (month)` | `bounds.from`, `bounds.to`, `vintage` |
| Row check | status chip + `match/count_diff/left_only/right_only` 计数 | `row.*` |
| Col check | status chip + `diff/columns cols`，有 dead 时追加 `N dead` | `col.*` |
| Sample | `all` / `10%` / `50k` | `sample.mode/rate/count` |
| Report | `HTML · XLSX · CSV` 三个附件链接 | `files.*` → 附件名 |

示意:

```
| Pair   | Sources            | Window                   | Row check                    | Col check          | Sample | Report            |
|--------|--------------------|--------------------------|------------------------------|--------------------|--------|-------------------|
| events | trino / databricks | 2026-03-01..06-30 (week) | MATCH  17/17                 | PARTIAL 2 dead     | 50k    | HTML · XLSX · CSV |
| orders | oracle / databricks| 2026-01-01..06-30 (month)| MATCH  181/181               | DIFF  3/42 cols    | 10%    | HTML · XLSX · CSV |
| users  | hive / databricks  | 2026-01-01..06-30 (month)| DIFF  2 count_diff 1 left    | NOT_RELEASED       | all    | HTML · XLSX       |
```

Report 列的用户体验（Cloud）: XLSX / CSV 点开有 Confluence 自带预览，也可下载；HTML 点开直接下载，
本地双击用浏览器打开。per-pair HTML 已是自包含（内联 CSS，无外部资源），离线可看。

### 2.3 状态推导与排序

row status（来自 row_check document 的 `summary` 与 `gate_decision`）:

| 条件 | status | 颜色 |
|---|---|---|
| `left_only + right_only > 0` | MISSING | Red |
| 否则 `count_diff > 0` | DIFF | Yellow |
| 否则 | MATCH | Green |

col status（来自 manifest + results + dead）:

| 条件 | status | 颜色 |
|---|---|---|
| 该 pair 无 manifest（gate 没过） | NOT_RELEASED | Grey |
| `dead > 0` 或 `units_completed < units_expected` | PARTIAL | Red |
| 任一 result `verdict == "diff"` | DIFF | Yellow |
| 否则 | PASS | Green |

排序: 严重度降序，同级按 pair 名。严重度 = max(row, col)，Red=0, Yellow=1, Grey=2, Green=3。
要处理的 pair 永远在最上面。

## 3. 产物改动 (`src/dtrack_right/report/build.py`)

现在 `build_report` 只产全 pair 的 `index.html` / `report.xlsx`，per-pair 链接需要先把产物拆开。
`build.py` 已经按 document 循环，每轮多调一次 `wrap_document` 和 `build_workbook` 即可。

### 3.1 新目录布局

```
history/<run_id>/
  index.html, report.xlsx, summary.json          现有，保留
  pairs/<pair>/index.html                        新增: 只含该 pair 的 Stage 1 + Stage 2 两段
  pairs/<pair>/report.xlsx                       新增: build_workbook([document], {pair: rows})
  pairs/<pair>/compare_row.csv                   现有 <pair>_compare_row.csv 挪到这里
  pairs/<pair>/compare_col.csv                   现有 <pair>_compare_col.csv 挪到这里
```

`files` 字典的 key 改成相对路径（`pairs/orders/index.html`），`publish_report` 的 `key = base + name` 自然成立。
注意 `fetch_report`（`dtrack_left/backends/store.py`）写 `out / name` 前要 `target.parent.mkdir(parents=True)`，
否则嵌套路径会炸。

兼容: 顶层 `<pair>_compare_*.csv` 不再产出；`dtrack fetch-report` 的使用者如果靠文件名，改用 `summary.json["pair_reports"][i]["files"]`。

### 3.2 summary.json 扩展

保留现有字段（`pairs` 仍是整数，`summary_section` 在用），新增 `pair_reports` 列表:

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

字段来源:

- `bounds` / `vintage` / `sample`: `document["pair_config"]`（左侧 row_check 已带 `bounds`，右侧合并后的 document 需确认是否保留，否则从 `pair_config` 取 `fromDate/toDate`）
- `row.*`: `document["summary"]`（`summarize_partitions` 的四个计数）+ `document["gate_decision"]["passed"]`
- `col.columns` / `units_expected`: `manifests[pair]["columns"]`, `["expected_units"]`
- `col.diff` / `units_completed` / `dead`: `results_by_pair[pair]`, `dead` 按 `unit_id` 前缀归到 pair
- `files`: 3.1 写文件时顺手记

`latest/pointer.json` 不变。

## 4. 链接解析: Confluence 附件

### 4.1 为什么是附件

| 方案 | HTML | XLSX / CSV | 有效期 | 代价 | 结论 |
|---|---|---|---|---|---|
| A. 稳定 HTTP 入口（CloudFront 等） | 浏览器直接渲染 | 下载 | 永久 | 需要基建，目前没有 | 以后有入口再加 `--base-url` 切回 |
| B. Confluence 附件 | Cloud 强制下载，本地打开 | 预览 + 下载，权限跟页面走 | 永久 | 每 run 传 3 + 4N 个文件 | **采用** |
| C. presigned URL | 渲染 | 下载 | ≤ 7 天 | 无 | 否决 |

### 4.2 附件命名与归属

- 附件全部挂在 **run 子页** `dtrack · <run_id>` 上，子页不可变，所以每个文件只上传一次，不存在附件版本堆积。
- 文件名页内唯一，加 pair 前缀，去掉目录: 

```
index.html, report.xlsx, summary.json
<pair>_report.html, <pair>_report.xlsx, <pair>_compare_row.csv, <pair>_compare_col.csv
```

- 父页 `dtrack · latest` 不传附件，用跨页引用链到子页附件:

```xml
<ac:link>
  <ri:attachment ri:filename="orders_report.xlsx">
    <ri:page ri:content-title="dtrack · 2026-10-01T08" ri:space-key="DT"/>
  </ri:attachment>
  <ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body>
</ac:link>
```

- 子页自己的链接省略 `ri:page`。

### 4.3 体积与限额

- per-pair HTML / XLSX 通常几十 KB 到几 MB；Cloud 默认单附件上限由站点管理员设定（常见 100 MB），
  实现时对单文件 > 50 MB 打 warning 并跳过，表格里该链接显示为灰色文字而不是断链。
- 附件上传一次一个文件，N 个 pair 约 4N 次请求，串行即可，不需要并发。

## 5. 发布流程: `dtrack publish-confluence`

按惯例新开子命令，不往 `report` / `fetch-report` 上堆 flag。

### 5.1 CLI 契约

```
dtrack publish-confluence
    [--report-s3 s3://bucket/prefix | --report-dir PATH]   二选一；s3 走现有 fetch_report 拉整个 history/<run_id>/
    [--run-id ID]                                           缺省读 latest/pointer.json
    --space KEY                                             DTRACK_CONFLUENCE_SPACE
    [--parent "dtrack reports"]                             父页面标题，缺省 space 根
    [--title-prefix "dtrack"]                               页面标题前缀，默认 dtrack
    [--history-n 10]                                        父页「最近 N 次 run」表长度
    [--force]                                               子页已存在时重传附件并覆盖正文
    [--dry-run]                                             打印两份 storage XHTML，不调 API、不上传
    [--json]
```

环境变量: `DTRACK_CONFLUENCE_URL`（`https://<site>.atlassian.net/wiki`，含 `/wiki`，代码不猜）、
`DTRACK_CONFLUENCE_USER`（email）、`DTRACK_CONFLUENCE_TOKEN`（API token）、`DTRACK_CONFLUENCE_SPACE`。

### 5.2 执行顺序与幂等

```
1. 取 summary.json（本地或 fetch_report）
2. 子页 "dtrack · <run_id>":
     不存在 → POST 创建（正文先占位）→ 逐个上传附件 → PUT 正文（附件链接是本页的）
     已存在且无 --force → 跳过 2，直接到 3
     已存在且 --force   → 对每个附件名: 存在则走 update-data 端点，否则新建；PUT 正文 version+1
3. 父页 "dtrack · latest":
     列 history/ 取最近 N 个 run_id，渲染正文（附件链接带 ri:page 指向子页）
     不存在 → POST；存在 → PUT version+1
4. --json 输出: 两个 page id、url、上传附件数、跳过数
```

与 S3 的 `history/<run_id>/` + `latest/pointer.json` 语义一致。Confluence 自带版本历史，父页覆盖也可回看。

### 5.3 storage format 片段

```xml
<!-- status chip -->
<ac:structured-macro ac:name="status">
  <ac:parameter ac:name="colour">Green</ac:parameter>
  <ac:parameter ac:name="title">MATCH</ac:parameter>
</ac:structured-macro>

<!-- 本页附件链 (子页) -->
<ac:link><ri:attachment ri:filename="orders_report.xlsx"/>
  <ac:plain-text-link-body><![CDATA[XLSX]]></ac:plain-text-link-body></ac:link>

<!-- 跨页附件链 (父页) 见 4.2 -->

<!-- 子页链 (父页「最近 N 次 run」表) -->
<ac:link><ri:page ri:content-title="dtrack · 2026-10-01T08" ri:space-key="DT"/>
  <ac:plain-text-link-body><![CDATA[2026-10-01T08]]></ac:plain-text-link-body></ac:link>
```

不用 `html` 宏（Cloud 默认禁用），不用 `expand`。颜色映射: Green=MATCH/PASS, Yellow=DIFF, Red=MISSING/PARTIAL, Grey=NOT_RELEASED。

### 5.4 REST 端点 (Cloud)

| 操作 | 端点 | 备注 |
|---|---|---|
| 查页面 | `GET /wiki/api/v2/pages?space-id=&title=` | v2；space key → space id 先查一次 `GET /wiki/api/v2/spaces?keys=` |
| 建页面 | `POST /wiki/api/v2/pages` | body `{"spaceId","status":"current","title","parentId","body":{"representation":"storage","value":...}}` |
| 改页面 | `PUT /wiki/api/v2/pages/{id}` | 带 `version.number + 1` |
| 列附件 | `GET /wiki/api/v2/pages/{id}/attachments` | 用于 `--force` 判断新建还是更新 |
| 传附件 | `POST /wiki/rest/api/content/{id}/child/attachment` | v2 无上传端点，沿用 v1；header `X-Atlassian-Token: nocheck`，multipart `file` |
| 更新附件 | `POST /wiki/rest/api/content/{id}/child/attachment/{attachmentId}/data` | 仅 `--force` |

auth: `requests.auth.HTTPBasicAuth(email, token)`。实现时对照当时的 Atlassian 文档确认 v1 附件端点未下线。

## 6. 代码改动清单

| 文件 | 改动 |
|---|---|
| `src/dtrack_right/report/build.py` | per-pair html/xlsx/csv 写入 `pairs/<pair>/`；`files` key 改相对路径；`_summary` 增 `pair_reports`（状态推导放 `_pair_report(document, manifest, rows, dead)`） |
| `src/dtrack_right/report/html.py` | 无改动；per-pair 页复用 `wrap_document(title=pair, sections=[row_section, col_section], subtitle=run_id)` |
| `src/dtrack_right/report/excel.py` | 无改动 |
| `src/dtrack_left/backends/store.py` | `fetch_report` 建父目录 |
| `src/dtrack_left/report/__init__.py` | 新包 |
| `src/dtrack_left/report/confluence.py` | `render_page(summary, *, attachments_on: str \| None, recent_runs)` 产 storage XHTML；`attachment_name(pair, kind)`；`ConfluenceClient`（space_id / find_page / create_page / update_page / list_attachments / upload / update_attachment，`requests`）；`publish(...)` 按 5.2 编排 |
| `src/dtrack_left/cli/tools.py` | `publish_confluence_command` |
| `src/dtrack_left/cli/__init__.py` | 注册子命令 + 配置参考加一行 |
| `src/dtrack_left/__main__.py` | distributed workflow 步骤表加 step 8 |
| `src/dtrack_local/pipeline.py` | `report()` 返回值不变；新增 `publish_confluence(run, space)` 薄封装调 `dtrack_left.report.confluence.publish` |
| `src/dtrack_local/notebooks/03_report_and_backup.ipynb` | 末尾加一个 publish cell，参数 `CONFLUENCE_SPACE`，缺省读 env |

约束: `dtrack_right` 不得 import `dtrack_left`；`dtrack_left/report/confluence.py` 只依赖 `summary.json` 与文件路径，不 import `dtrack_right`。
`requests` 作为 dtrack_left 的依赖加到 pyproject（dtrack_right 的 `requirements.txt` 不动）。
`dtrack_left/report/` 新目录 2 个文件，满足 ≤ 5 文件/目录。

## 7. 测试

- `tests/unit`: `build_report` 产出 `pairs/<pair>/` 四个文件；`pair_reports` 四种 row status × 四种 col status 推导；排序。
- `tests/unit`: `render_page` 的 XHTML 含每个 pair 的 status 宏、三个 `ri:attachment` 链接、按严重度排序；父页模式每个 `ri:attachment` 内含 `ri:page`，子页模式不含。
- `tests/unit`: `ConfluenceClient` 用 mock 覆盖 create 与 update（version+1）、附件新建 vs `--force` 更新、`X-Atlassian-Token` header。
- `tests/unit`: `publish` 编排：子页已存在时不上传附件；`--dry-run` 零 HTTP 调用。
- `tests/unit`: `fetch_report` 嵌套路径落盘。
- packaging 测试: `dtrack_right` 不引用 `dtrack_left`。
- 手动: `--dry-run` 把 XHTML 贴进 Confluence「插入标记」校验渲染，确认跨页附件链接在父页能点开。

## 8. 不做

- 不生成 presigned URL。
- 不改 `latest/pointer.json` 结构。
- 不在 Confluence 里渲染明细表或 expand 折叠块；明细归 HTML / XLSX。
- 不做 pair 级 Excel 跨 sheet 深链接。
- 不支持 Data Center（auth 和端点不同）；需要时再加 `DTRACK_CONFLUENCE_FLAVOR`。
- 父页不挂附件，不做附件清理任务。

## 9. 以后可能

- 有稳定 HTTP 入口后加 `--base-url`，Report 列改为外链，HTML 可在浏览器内直接渲染。
- 父页加一个 run 间趋势小表（findings 随时间）。
