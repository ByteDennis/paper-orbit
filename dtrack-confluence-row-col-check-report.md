# DTrack Row/Col Check Report：Confluence 实施方案

## 1. 目标与推荐结论

在 Confluence 中建立一个面向读者的检查报告页：

- 一次 dtrack run 对应一个历史报告页；
- 报告页的核心是一张表，一行对应一个 pair；
- Confluence 保存摘要、状态、责任人和链接；
- 大量 row/col 明细保留在 HTML、Excel 或 CSV artifact 中；
- HTML 用于在线阅读，Excel 用于下载、筛选和进一步分析；
- 历史报告页发布后不再覆盖，便于审计。

首版推荐使用“普通 Confluence 表格 + Status 元素 + 附件/外部链接”。不要一开始就引入复杂宏或插件。运行数量增多后，再增加 Content Properties Report 自动生成历史索引。

---

## 2. 建议的页面树

在目标 Space 中建立以下结构：

```text
DTrack Reconciliation Reports
├── Latest Report
└── Report History
    ├── 2026-10-01 — <run_id>
    ├── 2026-09-30 — <run_id>
    └── ...
```

页面职责：

| 页面 | 职责 |
|---|---|
| `DTrack Reconciliation Reports` | 入口、说明、Latest/History 导航 |
| `Latest Report` | 指向或展示当前最新一次 run，不保存唯一历史证据 |
| `Report History` | 历史 run 的索引表 |
| `<date> — <run_id>` | 一次 run 的完整 pair 摘要和 artifact 链接 |

---

## 3. 第一次在 Confluence 中搭建

以下步骤以 Confluence Cloud 当前编辑器为准。Data Center 的按钮名称可能略有不同，但页面结构和字段可以保持一致。

### 3.1 创建根页面

1. 进入准备保存报告的 Confluence Space。
2. 点击顶部或侧边栏的 **Create**。
3. 选择 **Blank page**。
4. 页面标题填写：

   ```text
   DTrack Reconciliation Reports
   ```

5. 在页面中加入以下说明：

   ```text
   本区域保存 DTrack row-check 和 col-check 的运行结果。
   Confluence 页面提供摘要和导航；HTML、Excel 和 CSV 保存详细检查结果。
   ```

6. 加入两个二级标题：

   ```text
   Latest Report
   Report History
   ```

7. 点击 **Publish**。

### 3.2 创建 Report History 子页面

1. 打开刚发布的 `DTrack Reconciliation Reports`。
2. 选择 **More actions (...) → Create child page**；如果界面没有该入口，也可以点击 **Create** 后在页面位置中选择父页面。
3. 标题填写：

   ```text
   Report History
   ```

4. 插入一张普通表格，列定义为：

| Run Date | Run ID | Environment | Status | Pairs | Passed | Failed | Partial | Report |
|---|---|---|---|---:|---:|---:|---:|---|
| 2026-10-01 | `<run_id>` | PROD | DONE | 25 | 21 | 4 | 0 | View report |

5. 暂时保留示例行，搭建完成后可以删除。
6. 发布页面。

首版中，这张 History 表每次增加一行即可。后续可以用 Content Properties Report 替代手工维护，见第 8 节。

### 3.3 创建 Latest Report 子页面

1. 在根页面下创建另一个子页面。
2. 标题填写：

   ```text
   Latest Report
   ```

3. 页面正文先写：

   ```text
   Current report: <粘贴最新历史报告页链接>
   ```

4. 将历史报告页 URL 粘贴进来。
5. 点击链接并把显示方式改为普通链接或卡片；推荐普通链接，页面最稳定、最简洁。
6. 发布页面。

不要复制大量 pair 表到 `Latest Report`，否则会产生两个需要同步的数据源。这里应只保留指向最新历史页的链接。

---

## 4. 为一次 run 创建报告页

### 4.1 创建页面

1. 打开 `Report History` 页面。
2. 创建其子页面。
3. 使用以下标题格式：

   ```text
   YYYY-MM-DD — <run_id>
   ```

   示例：

   ```text
   2026-10-01 — 20261001T123000Z-a3f9c1
   ```

4. 在页面标题下添加一个 Info panel：输入 `/info`，选择 **Info panel**。
5. 在 panel 中填写：

   ```text
   Row check compares exact counts by date partition.
   Col check compares sampled, key-aligned column statistics after the row gate passes.
   ```

这段说明能够防止读者把 row finding 和 col finding 当成同一种错误。

### 4.2 添加运行级摘要

在 Info panel 下插入一张 2 列表格，并设置第一列为 header column：

| Field | Value |
|---|---|
| Run ID | `<run_id>` |
| Environment | `DEV` / `UAT` / `PROD` |
| Overall Status | Status 元素：`DONE` / `PARTIAL` / `FAILED` |
| Date Window | `YYYY-MM-DD → YYYY-MM-DD` |
| Generated At | `YYYY-MM-DD HH:mm ET` |
| Pair Count | `25` |
| Passed | `21` |
| Failed | `3` |
| Partial | `1` |
| Owner | `@person` 或团队名称 |
| Source Report | `summary.json` 或 run artifact 根目录链接 |

插入 Status 元素的方法：

1. 点击 `Overall Status` 对应的 Value 单元格。
2. 输入 `/status`。
3. 选择 **Status**。
4. 输入文本并设置颜色：
   - `DONE`：绿色；
   - `PARTIAL`：黄色；
   - `FAILED`：红色；
   - `RUNNING`：蓝色。

### 4.3 插入核心 Pair 表

1. 在摘要下面添加标题：

   ```text
   Pair Results
   ```

2. 输入 `/table`，插入一张 9 列表格。
3. 第一行填写以下固定表头：

| Pair | Row Check | Row Findings | Col Check | Col Findings | Coverage | HTML Details | Excel / CSV | Owner / Note |
|---|---|---:|---|---:|---|---|---|---|

4. 每个 pair 填一行，例如：

| Pair | Row Check | Row Findings | Col Check | Col Findings | Coverage | HTML Details | Excel / CSV | Owner / Note |
|---|---|---:|---|---:|---|---|---|---|
| `orders` | PASS | 0 dates | FAIL | 3 columns | 30/30 dates; 1,000 samples | View HTML | Workbook (`orders_col`) | Investigate `RISK_SCORE` |
| `customers` | FAIL | 2 dates | SKIPPED | — | 28/30 dates | View HTML | Workbook (`customers_row`) | Row population mismatch |
| `products` | PASS | 0 dates | PASS | 0 columns | 30/30 dates; 500 samples | View HTML | Workbook | — |

5. 把 `Row Check` 和 `Col Check` 单元格中的普通文字替换成 Status 元素。

推荐状态规则：

| 状态 | 颜色 | 含义 |
|---|---|---|
| `PASS` | 绿色 | 对应检查已完成且无 finding |
| `FAIL` | 红色 | 检查完成并发现差异 |
| `PARTIAL` | 黄色 | 结果不完整，不能视为通过 |
| `SKIPPED` | 灰色 | 上游 gate 未通过或配置明确跳过 |
| `RUNNING` | 蓝色 | 仍在执行，不是最终结论 |

注意：Row Check 失败导致 Col Check 没有执行时，Col Check 必须写 `SKIPPED`，不能留空，也不能写 `PASS`。

### 4.4 调整表格显示

1. 选中表格。
2. 在表格工具栏中确认启用 **Header row**。
3. 如果页面正文宽度太窄，使用页面右上角的宽度设置，选择 **Full width**。
4. 推荐列宽：
   - `Pair`：中等；
   - 两个 Check 状态：窄；
   - 两个 Findings：窄；
   - `Coverage`：中等；
   - 两个链接列：中等；
   - `Owner / Note`：较宽。
5. 不要直接把所有日期差异或列差异塞进表格；详情应该留在 HTML/Excel 中。

---

## 5. 添加 Excel、CSV 和 HTML 链接

### 5.1 Excel 作为 Confluence 附件

适用于内部报告、需要 Confluence 权限保护和附件版本记录的场景。

1. 编辑 run 报告页。
2. 将 `report.xlsx` 直接拖入页面底部，或选择工具栏中的 **Add image, video, or file**。
3. 等待文件上传完成。
4. 发布页面。
5. 打开已发布页面。
6. 打开 **Show details / More → Attachments**。
7. 在 `report.xlsx` 上复制链接地址。
8. 再次编辑页面。
9. 选中 Pair 表中对应的 `Workbook` 文本。
10. 按 `Ctrl+K` 或 `Cmd+K`，粘贴附件链接并确认。
11. 在链接后标注 worksheet 名称：

    ```text
    Workbook (`orders_row`, `orders_col`)
    ```

不要依赖“链接直接打开某个 Excel worksheet”。Confluence 附件链接应指向 workbook，worksheet 名由表格明确告诉读者。

如果以后更新同一个页面的 Excel，应继续使用完全相同的文件名 `report.xlsx` 上传。Confluence 会为附件保留新版本；源文件变化不会自动同步到 Confluence。

### 5.2 Pair CSV 作为附件

如果使用当前 dtrack 的 per-pair CSV：

1. 将 `<pair>_compare_row.csv` 和 `<pair>_compare_col.csv` 上传到对应 run 页面。
2. 从 Attachments 页面复制每个文件的链接。
3. Pair 表中的 `Excel / CSV` 单元格写成：

   ```text
   Workbook · Row CSV · Col CSV
   ```

4. 分别添加链接。
5. 如果 pair 数量很多，首版可以只链接 workbook，CSV 放在页面底部统一列出，避免表格过宽。

### 5.3 HTML 使用外部永久链接

HTML 推荐部署在公司内部静态站点或对象存储前端，而不是作为普通附件依赖 Confluence 在线渲染。

1. 确认 HTML 已上传到一个稳定地址，例如：

   ```text
   https://reports.example.internal/dtrack/history/<run_id>/index.html
   ```

2. 编辑 Confluence run 页面。
3. 在 `HTML Details` 单元格输入 `View HTML`。
4. 选中文字，按 `Ctrl+K` 或 `Cmd+K`。
5. 粘贴 URL。
6. 将 Smart Link 显示方式调整为普通 inline link，避免每行出现大卡片。

链接必须满足：

- 使用稳定 URL，不使用会过期的短期 presigned URL；
- 读者权限与 Confluence 页面读者范围一致；
- 浏览器能够打开 HTML；
- 历史 run 的 URL 不被新 run 覆盖。

当前 dtrack 只有 run 级 `index.html` 时，每一行可以先链接同一个 HTML。建议链接文字写成：

```text
View run HTML
```

不要让读者误以为它会直接打开该 pair。未来生成 `pairs/<pair>/index.html` 后，再改成真正的 pair 链接：

```text
https://reports.example.internal/dtrack/history/<run_id>/pairs/<pair>/index.html
```

### 5.4 如果只能把 HTML 上传为附件

可以把 HTML 上传到 run 页面并提供下载链接，但应把链接文字写清楚：

```text
Download HTML
```

不要承诺它一定能在 Confluence 内部直接运行。Confluence、浏览器和企业安全策略可能将 HTML 作为下载文件，或禁止脚本执行。自包含 HTML 仍可供用户下载后在浏览器打开。

---

## 6. 发布前检查

在点击 Publish 前逐项核对：

- [ ] 页面标题同时包含日期和唯一 `run_id`。
- [ ] Overall Status 与 `summary.json` 一致。
- [ ] Pair 数量与 summary 一致。
- [ ] 每个 active pair 恰好有一行。
- [ ] Row Check 和 Col Check 没有被合并成一个含糊状态。
- [ ] Row Check 失败时，未执行的 Col Check 标为 `SKIPPED`。
- [ ] `PARTIAL` 没有被显示成绿色。
- [ ] HTML、Excel/CSV 链接至少各抽查一个。
- [ ] 链接使用稳定地址，不是短期 presigned URL。
- [ ] 页面权限不会让无权访问源数据的人看到报告。
- [ ] 页面已设为 Full width，表格无需频繁横向滚动。

发布后再以普通读者身份打开页面，验证链接权限。编辑者能访问，不代表所有读者都能访问外部 HTML 或附件。

---

## 7. 每次新 run 的日常更新步骤

### 7.1 新建历史页

1. 复制上一份 run 报告页，或从模板创建。
2. 把页面放在 `Report History` 下。
3. 修改标题中的日期和 `run_id`。
4. 清除上一轮所有 pair 状态、finding、coverage、owner note 和链接。
5. 填写新 run 的摘要。
6. 填写 Pair Results 表。
7. 上传新的 `report.xlsx` 和需要保留的 CSV。
8. 替换 HTML 链接。
9. 完成发布前检查并发布。

复制页面后最容易发生的错误是保留旧附件链接。即使链接文本相同，也必须确认 URL 指向新页面或新 run 路径。

### 7.2 更新 History

1. 编辑 `Report History`。
2. 在表格顶部增加一行。
3. 填写 run date、run ID、environment、状态和统计数量。
4. `Report` 列链接到刚发布的历史页。
5. 发布。

### 7.3 更新 Latest Report

1. 编辑 `Latest Report`。
2. 替换唯一的当前报告链接。
3. 确认链接指向刚发布的历史页。
4. 发布。

### 7.4 不要修改旧历史页

除以下情况外，不覆盖旧页：

- 修正拼写；
- 修复失效链接；
- 添加明确标注的补充说明。

如果检查重新运行，应创建新的 run 页面，而不是把旧页改成新结果。

---

## 8. 可选：用 Content Properties 自动生成历史索引

当历史 run 较多、手工维护 `Report History` 开始出错时，再启用本节。

### 8.1 在每个 run 页面加入 Content Properties

1. 编辑一个 run 页面。
2. 在运行级摘要外层或附近输入 `/properties`。
3. 选择 **Content Properties**。
4. 在宏内部创建一张两列表格。
5. 开启 Header column。
6. 使用完全一致的字段名：

| Field | Value |
|---|---|
| Run Date | `2026-10-01` |
| Run ID | `<run_id>` |
| Environment | `PROD` |
| Status | Status 元素 |
| Pairs | `25` |
| Passed | `21` |
| Failed | `3` |
| Partial | `1` |

7. 编辑宏设置，把 Content Properties ID 设为：

   ```text
   dtrack-run-report
   ```

8. 给页面添加统一 label：

   ```text
   dtrack-run-report
   ```

9. 发布。

字段名必须完全一致；Content Properties Report 依赖表头读取数据。宏中的表格必须存在 header row 或 header column。

### 8.2 在 History 页面加入自动汇总

1. 编辑 `Report History`。
2. 输入 `/contentpropertiesreport`。
3. 选择 **Content Properties Report**。
4. Label 填写：

   ```text
   dtrack-run-report
   ```

5. 展开 Options。
6. Content Properties ID 填写：

   ```text
   dtrack-run-report
   ```

7. Columns to show 填写：

   ```text
   Run Date, Run ID, Environment, Status, Pairs, Passed, Failed, Partial
   ```

8. 如果界面提供 `With ancestor`，将范围限制为 `Report History` 页面树，避免其他 Space 页面误入。
9. 按修改时间或 Run Date 排序；如果宏不能可靠按日期字段排序，确保页面标题以 `YYYY-MM-DD` 开头。
10. 保存宏并发布页面。

该宏会自动带出页面标题链接，因此不需要再维护单独的 `Report` 列。

### 8.3 建立 Space Template

如果团队成员经常手工建报告页：

1. 打开 Space。
2. 选择 Space 名称旁的 **More actions (...) → Space settings**。
3. 打开 **Look and Feel → Templates**。
4. 选择 **Create a new template**。
5. 模板名填写：

   ```text
   DTrack Run Report
   ```

6. 放入以下固定结构：
   - Info panel；
   - Content Properties 宏；
   - Pair Results 表；
   - Attachments/Notes 区域；
   - 发布前 checklist。
7. 在模板中加入 `dtrack-run-report` label。
8. 保存模板。

以后使用 Create 创建页面时直接选择该模板，避免列名和宏 ID 漂移。

---

## 9. 推荐的最小落地顺序

### Phase 1：一天内可以完成

1. 建立根页面、Latest 和 History。
2. 建立一个真实 run 页面。
3. 使用普通 Pair 表和 Status 元素。
4. 上传 `report.xlsx`。
5. 链接现有 run 级 `index.html`。
6. 手工维护 History 一行和 Latest 一个链接。

### Phase 2：报告稳定后

1. 建立 Space Template。
2. 使用 Content Properties + Content Properties Report 自动汇总历史。
3. 为 HTML 建立公司内部永久静态 URL。
4. 如果用户经常需要从表格直接进入某个 pair，再实现 per-pair HTML。

### Phase 3：需要自动化时

使用 Confluence REST API 自动完成：

- 创建 run 子页面；
- 写入摘要和 pair 表；
- 上传 `report.xlsx` / CSV；
- 更新 Latest 链接；
- 添加统一 label。

自动化之前先稳定页面字段、状态规则、链接策略和权限模型，否则脚本只会放大结构变更成本。

---

## 10. 当前 dtrack 输出与 Confluence 的映射

| dtrack artifact | Confluence 展示位置 |
|---|---|
| `summary.json` | 运行级摘要、History 行 |
| `<pair>_compare_row.csv` | Pair 行的 Row CSV 链接，可选 |
| `<pair>_compare_col.csv` | Pair 行的 Col CSV 链接，可选 |
| `index.html` | Pair 表的 `View run HTML` 链接 |
| `report.xlsx` | Pair 表的 Workbook 链接，旁边注明 worksheet |
| `latest/pointer.json` | 用于自动化定位最新 run；不直接给普通读者阅读 |

当前报告是 run 级单页 HTML、run 级 Excel 和 per-pair CSV。第一版 Confluence 不应假装已有 per-pair HTML；在 per-pair HTML 真正生成前，应明确显示 `View run HTML`。

---

## 11. 官方参考

- Atlassian：上传文件与附件版本  
  <https://support.atlassian.com/confluence-cloud/docs/upload-a-file/>
- Atlassian：插入链接、附件链接和锚点  
  <https://support.atlassian.com/confluence-cloud/docs/insert-links-and-anchors/>
- Atlassian：Content Properties Report macro  
  <https://support.atlassian.com/confluence-cloud/docs/insert-the-page-properties-report-macro/>
- Atlassian：用模板和 Content Properties 创建自定义报告  
  <https://support.atlassian.com/confluence-cloud/docs/create-a-custom-report/>

