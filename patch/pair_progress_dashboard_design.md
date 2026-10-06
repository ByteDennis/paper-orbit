# Pair 进度 Dashboard：表设计

状态：**设计稿**（2026-10-06），未实施。实施时参照 `build_count_watch_dashboard.py` 的写法生成 `.lvdash.json`。

目标：一个 Databricks AI/BI dashboard，两页。
- **Executive Summary**：每个 pair 一行，只放最关键的：什么时候开始、进度、ETA、状态，外加最重要的 blocker。
- **Detailed**：row check、col check、blocker 以及历史趋势的全部细节，用于排查问题。

---

## 0. 核心决定

| 决定 | 选择 | 理由 |
| --- | --- | --- |
| 数据从哪来 | **采集器只读 run store**，定时写快照 | dtrack 已经把所有状态写进了 run store（`_STATUS.json`、`row_check/`、`manifest/`、`_INDEX/`、`results/`、`dead/`、`_HEARTBEAT`）。采集器不改 pipeline，可以重复跑，也不需要 Left 机器有写库权限 |
| 快照还是事件 | **append-only 快照**（每 15 分钟一行 / run / pair） | 算 ETA 需要"单位时间完成多少"，用两次快照相减就能得到；事件流需要在 pipeline 的每个地方埋点，漏一处数据就错 |
| 人工信息 | 单独两张表：`pair_plan`、`pair_blocker` | 计划日期、负责人、手工 blocker 这些不是机器能推出来的；和机器数据分开，采集器永远不会覆盖人工输入 |
| 页面读什么 | **只读视图**（`v_pair_status`、`v_pair_daily`） | 状态规则、ETA 公式只在一处定义，两个页面口径一致 |
| 与 count watch（`table_list`）的关系 | 独立的表，用 `pair_name` 关联 | count watch 是每天数分区行数；这里是一次 run 的执行进度。Detailed 页可以 join 进来显示最近一次 count 状态 |

## 1. 一个 pair 的生命周期（状态从哪里来）

```
NOT_STARTED → ROW_CHECK → COL_CHECK → REPORTING → DONE
                  │            │
                  └── 任一阶段有 open 的 P1/P2 blocker → BLOCKED
                      心跳超时或长时间没有进展        → STALLED
                      gate 没通过 / 致命错误          → FAILED
```

| 阶段 | run store 里的信号 | 进度怎么算 |
| --- | --- | --- |
| ROW_CHECK 开始 | `row_check/<pair>.left.json` 出现（左侧数完） | — |
| ROW_CHECK 完成 | `row_check/<pair>.json` 出现，里面有逐天的 verdict + `gate_decision` | 0 → 1 |
| COL_CHECK | `manifest/<pair>.json` 里的 `expected_units`；`_INDEX/*-<pair>--*` = 已发布的单元；`results/<pair>--*` = 已比对的单元；`dead/<pair>--*` = 失败的单元 | `(results + dead) / expected_units` |
| REPORTING / DONE | `_STATUS.json` 的 `state == "complete"`、`report/index.html` 存在 | 0 / 1 |

unit_id 的格式是 `<slug(pair)>--<window>--<column>--<hash>`，所以用前缀就能把单元按 pair 计数，不用读每个文件的内容。

## 2. 表

所有表都放在 `<catalog>.<schema>` 下，Delta 格式。

### 2.1 `dtrack_pair_plan` —— 人工维护的计划（一个 pair 一行）

```sql
CREATE TABLE IF NOT EXISTS <catalog>.<schema>.dtrack_pair_plan (
  pair_name          STRING  NOT NULL,   -- 和 dtrack config 里的 pair 名一致，主键
  display_name       STRING,             -- 给管理层看的名字
  wave               STRING,             -- 批次 / 里程碑，例如 "W1"
  priority           INT,                -- 1 = 最高
  owner              STRING,             -- 负责人邮箱
  planned_start_date DATE,
  target_done_date   DATE,               -- 判断 ON_TRACK / AT_RISK / LATE 的依据
  active             BOOLEAN NOT NULL,   -- false = 不在 dashboard 上显示
  notes              STRING,
  updated_by         STRING,
  updated_at         TIMESTAMP
) TBLPROPERTIES (delta.enableChangeDataFeed = true);
```

谁来写：项目负责人（手工编辑，或者用一个小 notebook 从 dtrack config 导入 pair 列表）。没有计划日期也能显示，只是 schedule health 显示 `NO_TARGET`。

### 2.2 `dtrack_progress_snapshot` —— 采集器写入，append-only

一次采集 × 每个 run × 每个 pair 一行，从不更新也从不删除；ETA、趋势图、"多久没进展"都从这里算。

```sql
CREATE TABLE IF NOT EXISTS <catalog>.<schema>.dtrack_progress_snapshot (
  snapshot_ts            TIMESTAMP NOT NULL,  -- 这次采集的时间（同一批次相同）
  run_id                 STRING    NOT NULL,
  pair_name              STRING    NOT NULL,
  run_root               STRING,              -- s3://… 或 /Volumes/…，方便在 Detailed 页跳转
  run_mode               STRING,              -- distributed | local
  run_state              STRING,              -- _STATUS.json 的 state 原样（left_row_check, right_col_check, complete …）
  -- row check
  row_left_done_at       TIMESTAMP,           -- row_check/<pair>.left.json 的修改时间
  row_done_at            TIMESTAMP,           -- row_check/<pair>.json 的修改时间
  row_days_total         INT,
  row_days_match         INT,
  row_days_count_diff    INT,
  row_days_left_only     INT,
  row_days_right_only    INT,
  gate_policy            STRING,
  gate_passed            BOOLEAN,
  gate_excluded_ratio    DOUBLE,
  -- col check
  units_expected         INT,                 -- manifest/<pair>.json expected_units
  units_published        INT,                 -- _INDEX 里属于这个 pair 的条目数
  units_compared         INT,                 -- results/<pair>--*
  units_dead             INT,                 -- dead/<pair>--*
  units_diff             INT,                 -- results 里 verdict != match 的数（需要读 result，见 §5 成本）
  first_unit_at          TIMESTAMP,           -- 最早一个 _INDEX 条目的时间（col check 真正开始）
  last_result_at         TIMESTAMP,           -- 最新一个 result 的时间
  -- run 健康
  heartbeat_at           TIMESTAMP,           -- _HEARTBEAT.epoch_s
  report_published       BOOLEAN,
  collector_error        STRING               -- 采集这个 run/pair 时出错（不影响其他行）
)
CLUSTER BY (pair_name, snapshot_ts);
```

说明：
- **时间字段用对象的修改时间**，不用 `snapshot_ts`，这样采集间隔不影响"什么时候开始 / 完成"的精度。
- 同一个 pair 可能有多个 run（重跑、回滚后重开）。**当前 run** = 这个 pair 最近有活动的那一个（见 §3.1）。
- 保留期：按天聚合后，原始快照可以只留 90 天（`DELETE WHERE snapshot_ts < …` + `VACUUM`）；也可以不删，数据量很小（pair 数 × 96 行/天）。

### 2.3 `dtrack_pair_blocker` —— 阻塞项（人工 + 自动）

```sql
CREATE TABLE IF NOT EXISTS <catalog>.<schema>.dtrack_pair_blocker (
  blocker_id   STRING    NOT NULL,  -- 自动的 = sha1(pair|run|rule)，手工的 = uuid
  pair_name    STRING    NOT NULL,
  run_id       STRING,               -- 手工的、和 run 无关的为 NULL
  stage        STRING    NOT NULL,   -- ACCESS | CONFIG | ROW_CHECK | COL_CHECK | REPORT | OTHER
  category     STRING,               -- 见下面的自动规则；手工随意
  severity     STRING    NOT NULL,   -- P1 阻塞 | P2 严重拖慢 | P3 只是提醒
  title        STRING    NOT NULL,   -- 一行，executive 页显示这个
  detail       STRING,
  source       STRING    NOT NULL,   -- AUTO | MANUAL
  owner        STRING,
  opened_at    TIMESTAMP NOT NULL,
  resolved_at  TIMESTAMP,            -- NULL = 仍然 open
  resolution   STRING,
  updated_at   TIMESTAMP
);
```

自动规则（采集器每次 MERGE：条件成立就打开，不成立就填 `resolved_at` 关掉；`blocker_id` 是确定性的，所以重复跑不会重复建）：

| rule / category | 条件 | severity | stage |
| --- | --- | --- | --- |
| `GATE_FAILED` | `gate_passed = false` | P1 | ROW_CHECK |
| `ROW_COUNT_DIFF` | `row_days_count_diff + left_only + right_only > 0`（gate 仍然通过） | P3 | ROW_CHECK |
| `DEAD_UNITS` | `units_dead > 0` | P2（> 5% 时 P1） | COL_CHECK |
| `STALE_HEARTBEAT` | 状态不是 complete，并且 `now - heartbeat_at > 30 min` | P2 | 当前阶段 |
| `NO_PROGRESS` | 处在 COL_CHECK，`units_compared` 已经 2 小时没涨 | P2 | COL_CHECK |
| `COLLECTOR_ERROR` | `collector_error IS NOT NULL` | P3 | OTHER |

手工 blocker（权限、等上游、列名问题等）由负责人直接 INSERT，或者在 notebook 里调用一个小函数。**自动规则永远不会关闭 `source = 'MANUAL'` 的行。**

## 3. 视图（dashboard 只读这些）

### 3.1 `v_pair_status` —— 每个 active pair 一行，两页都用

逻辑（伪 SQL，实施时写完整）：

```sql
CREATE OR REPLACE VIEW <catalog>.<schema>.v_pair_status AS
WITH latest_snap AS (          -- 每个 (run, pair) 最新一次快照
  SELECT * FROM dtrack_progress_snapshot
  QUALIFY row_number() OVER (PARTITION BY run_id, pair_name ORDER BY snapshot_ts DESC) = 1
),
current_run AS (               -- 每个 pair 的当前 run：最近有活动的那一个
  SELECT * FROM latest_snap
  QUALIFY row_number() OVER (
    PARTITION BY pair_name
    ORDER BY greatest(heartbeat_at, last_result_at, row_done_at, row_left_done_at) DESC NULLS LAST
  ) = 1
),
rate AS (                      -- 最近 6 小时完成单元的速度（单元 / 小时）
  SELECT run_id, pair_name,
         (max(units_compared + units_dead) - min(units_compared + units_dead))
           / nullif(timestampdiff(SECOND, min(snapshot_ts), max(snapshot_ts)) / 3600.0, 0) AS units_per_hour
  FROM dtrack_progress_snapshot
  WHERE snapshot_ts >= current_timestamp() - INTERVAL 6 HOURS
  GROUP BY run_id, pair_name
),
blockers AS (
  SELECT pair_name,
         count_if(resolved_at IS NULL) AS open_blockers,
         count_if(resolved_at IS NULL AND severity = 'P1') AS open_p1,
         max_by(title, struct(severity = 'P1', opened_at)) FILTER (WHERE resolved_at IS NULL) AS top_blocker
  FROM dtrack_pair_blocker GROUP BY pair_name
)
SELECT p.pair_name, p.display_name, p.wave, p.priority, p.owner,
       p.planned_start_date, p.target_done_date,
       c.run_id, c.run_mode,
       coalesce(c.row_left_done_at, c.first_unit_at)              AS started_at,      -- 实际开始时间
       timestampdiff(HOUR, started_at, coalesce(done_at, now()))  AS elapsed_hours,   -- 已经做了多久
       <stage>        AS stage,         -- 见 §1
       <status>       AS status,        -- 见 §3.2
       <progress_pct> AS progress_pct,  -- 见 §3.3
       <eta_ts>       AS eta_ts,        -- 见 §3.4
       <eta_confidence>, <schedule_health>,
       b.open_blockers, b.open_p1, b.top_blocker,
       c.* EXCEPT (...)                  -- Detailed 页需要的原始计数
FROM dtrack_pair_plan p
LEFT JOIN current_run c USING (pair_name)
LEFT JOIN rate r USING (run_id, pair_name)
LEFT JOIN blockers b USING (pair_name)
WHERE p.active;
```

`dtrack_pair_plan` 放在 FROM 最前面并 LEFT JOIN，**这样还没开始的 pair 也会显示**（status = NOT_STARTED），executive 页能看到整个范围，而不只是已经在跑的。

### 3.2 status（按顺序判断，先命中的生效）

| status | 条件 | 颜色 |
| --- | --- | --- |
| `DONE` | `run_state = 'complete'` 且 `units_dead = 0` | 绿 |
| `FAILED` | `gate_passed = false`，或者 complete 但 `units_dead > 0` | 红 |
| `BLOCKED` | `open_p1 > 0` | 红 |
| `STALLED` | 不是 complete，心跳超过 30 分钟或 2 小时没进展 | 橙 |
| `COL_CHECK` / `ROW_CHECK` / `REPORTING` | 按 §1 的信号 | 蓝 |
| `NOT_STARTED` | 没有任何快照 | 灰 |

### 3.3 进度百分比（一个数字给 executive 看）

```
progress = 0.15 × row_check_done
         + 0.80 × (units_compared + units_dead) / units_expected
         + 0.05 × report_published
```

权重是默认值：col check 通常占绝大部分时间。上线两周后用 §3.4 里的历史阶段耗时重新估一下，写成视图里的常量。

### 3.4 ETA

```
remaining_units = units_expected - units_compared - units_dead
col_eta_hours   = remaining_units / units_per_hour                  -- 用最近 6 小时的速度
row_eta_hours   = 其它 pair 的 row check 耗时中位数（按 left source 分组）   -- row check 只有一步，没有"速度"
eta_ts          = now + 当前阶段剩余 + 后面阶段的预计耗时
```

- **ROW_CHECK 阶段**：`now + row_eta_hours + (该 pair 的 expected_units 未知，用同 wave 的 pair 的 col check 中位耗时)`
- **COL_CHECK 阶段**：`now + col_eta_hours + report 中位耗时（通常几分钟）`
- **没有速度时**（刚开始、STALLED、BLOCKED）：`eta_ts = NULL`，显示 "unknown"，不显示一个误导性的数字。
- `eta_confidence`：`HIGH`（有 ≥ 3 次快照的速度且没有 blocker）/ `LOW`（用中位数估的）/ `NONE`（NULL）。
- `schedule_health`：`LATE`（now > target 且没完成）/ `AT_RISK`（eta_ts > target）/ `ON_TRACK` / `NO_TARGET`。

"距离开始多久" = `elapsed_hours`；"预计还要多久" = `eta_ts - now`。两个都在 executive 页显示，格式化成 `3d 4h`（沿用 count watch 里的 `AGE_SQL`）。

### 3.5 `v_pair_daily` —— 趋势图用

```sql
-- 每个 pair 每天最后一次快照：units 完成数、阶段、状态
SELECT pair_name, run_id, date(snapshot_ts) AS day,
       max_by(units_compared + units_dead, snapshot_ts) AS units_done,
       max_by(units_expected, snapshot_ts)              AS units_expected,
       max_by(run_state, snapshot_ts)                   AS run_state
FROM dtrack_progress_snapshot
GROUP BY ALL;
```

## 4. Dashboard 页面

### 4.1 Executive Summary（默认页）

筛选：`wave`、`owner`（默认全部）。

| 位置 | 组件 | 数据 |
| --- | --- | --- |
| 第一行 | 5 个计数 | pair 总数 / DONE / 进行中（ROW+COL+REPORTING）/ BLOCKED+STALLED+FAILED / NOT_STARTED |
| 第一行 | 2 个计数 | 整体进度 = `sum(progress × units_expected) / sum(units_expected)`；预计全部完成 = `max(eta_ts)`（有 NULL 时显示 "unknown"） |
| 第二行 | 主表（按 status 严重程度 → priority 排序） | `display_name`、`status`（着色）、`started_at`、`elapsed`、`progress_pct`（进度条）、`eta`、`target_done_date`、`schedule_health`（着色）、`top_blocker` |
| 第三行 | 堆叠条形图 | 每个 wave 的 status 分布 |
| 第三行 | burn-up 折线 | 所有 pair 合计 `units_done` vs `units_expected`，按天 |

不在这页显示：run_id、单元数、分区明细、连接信息。

### 4.2 Detailed

筛选：`pair_name`、`wave`、`status`、日期范围（作用于历史图）。

| 区块 | 内容 |
| --- | --- |
| Pair 明细表 | `v_pair_status` 的全部列：run_id、run_mode、run_state、阶段时间戳、row check 各类天数、gate 策略/结果/排除比例、units expected/published/compared/dead/diff、速度、心跳时间 |
| Row check | 每个 pair 的 match / count_diff / left_only / right_only 天数（堆叠条形图）+ gate 结果 |
| Col check | published vs compared vs dead 的进度（每个 pair 一行的进度条或分组条形图）；`units_diff` 是有差异的单元数（真实发现的问题，不是阻塞） |
| Blocker 表 | 所有 open 的 blocker：severity、stage、title、owner、已经开了多久、source；下面放最近 30 天已经关掉的 |
| 历史 | `v_pair_daily` 每个 pair 的 units_done 折线；切换 run 时能看到重跑 |
| Count watch（可选） | join `table_list` 显示最近一次 count_state，保持和现有 dashboard 一致 |

## 5. 采集器（写 `dtrack_progress_snapshot` 和自动 blocker）

- **形式**：Databricks job（notebook），每 15 分钟一次，单任务，`max_concurrent_runs = 1`。
- **输入**：runs root 列表（S3 前缀或 Volume 路径，job 参数）。对每个 root 用 `dtrack_right.backends.store.open_store` 打开，列出 run 文件夹。只看 **最近 N 天有活动** 的 run（看 `_HEARTBEAT` / `_STATUS.json` 的修改时间），已经 complete 超过 1 天的 run 不再采集（最后一次快照会一直作为它的状态）。
- **每个 run 做的事**：
  1. 读 `_STATUS.json`、`_HEARTBEAT`、`row_check/_CLOSED`、`manifest/_CLOSED`。
  2. 每个 pair：读 `row_check/<pair>.json`（几 KB），读 `manifest/<pair>.json` 的 `expected_units`。
  3. **只列 key，不读内容**：`_INDEX/`、`results/`、`dead/`，按 pair 的 slug 前缀计数，并取最早/最新的 LastModified。
  4. `units_diff` 需要读 result 的 verdict。成本：每个 result 一个 GET。默认做**增量**：只读上次快照之后新出现的 result（`start_after` 上次见到的最大 key），把累计值存到快照里。
- **输出**：一次 `INSERT INTO dtrack_progress_snapshot`（一批），然后一次 `MERGE INTO dtrack_pair_blocker`（自动规则）。
- **出错**：某个 run / pair 出错时，写一行带 `collector_error` 的快照继续采集下一个；不让一个坏 run 停掉整个采集。
- **dtrack_local 的 run**（在本地机器上，Databricks 看不到）：两个办法，选其一。
  - a. 在本地 notebook `03_report_and_backup` 之后（或者用 cron）调用同一个采集函数，指向本地 run 文件夹，通过 SQL warehouse 写入（`run_mode = 'local'`）。
  - b. 依赖已有的 `pipeline.backup(run, s3_root)` 把 run 备份到 S3，再让采集器扫描那个前缀。延迟等于备份频率。
  - 建议 a：实时；b 作为兜底。
- **代码放在哪里**：`src/dtrack_right/progress.py`（采集逻辑，只依赖 store），这样在 Databricks job 和本地都能 import；job notebook 只是调用它。

## 6. 权限

| 对象 | 读 | 写 |
| --- | --- | --- |
| `dtrack_progress_snapshot` | dashboard 查看者 | 只有采集器的 service principal |
| `dtrack_pair_plan` | dashboard 查看者 | 项目负责人 |
| `dtrack_pair_blocker` | dashboard 查看者 | 负责人（手工行）+ 采集器（AUTO 行） |
| 视图 | dashboard 查看者 | — |

Executive 页没有连接信息，可以发给管理层；Detailed 页显示 run_root（S3 路径），如果不应该让所有人看到，就把 Detailed 拆成另一个 dashboard，或者去掉这一列。

## 7. 实施顺序

1. 建三张表 + 两个视图（一个 SQL 文件，参照 `count_watch_validate.sql`）。
2. 写 `dtrack_right/progress.py`：`snapshot(store) -> list[row]`、`auto_blockers(rows) -> list[row]`；单元测试用 `MemoryStore`，覆盖 §1 每一个阶段和 §2.3 每一条规则。
3. 采集 job notebook + 一个创建 job 的 notebook（照 `nbs/03_dbx_job_setup.ipynb`）。
4. 用现有测试的 e2e run（moto / live）跑出几个状态各不相同的 run，确认视图里的 status、进度、ETA 都对。
5. 写 `build_pair_progress_dashboard.py` 生成 `.lvdash.json`（照 `build_count_watch_dashboard.py`），上传到 workspace。
6. 从 dtrack config 导入 `dtrack_pair_plan`，负责人补上 `target_done_date` / `owner`。

## 8. 默认值（可以改）

| 项 | 默认 |
| --- | --- |
| 采集间隔 | 15 分钟 |
| 速度窗口 | 最近 6 小时 |
| STALE_HEARTBEAT 阈值 | 30 分钟 |
| NO_PROGRESS 阈值 | 2 小时 |
| 进度权重 | row 0.15 / col 0.80 / report 0.05 |
| DEAD_UNITS 升级为 P1 | dead > 5% 的 expected |
| 快照保留 | 不删（数据量小）；需要时 90 天 |
