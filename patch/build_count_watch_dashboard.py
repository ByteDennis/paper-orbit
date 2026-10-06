import argparse
import json
import re
from pathlib import Path

RED, YELLOW, BLUE, GREEN, GRAY = "red", "yellow", "blue", "green", "gray"
TINT = {
    RED: ("#FDE2E1", "#A4161A"), YELLOW: ("#FFF3CD", "#7A5B00"), BLUE: ("#DCEEF6", "#075A73"),
    GREEN: ("#D4EDDA", "#155724"), GRAY: ("#ECEEF0", "#4A5560"),
}
SOLID = {RED: "#E5484D", YELLOW: "#FFB224", BLUE: "#0B7FA8", GREEN: "#30A46C", GRAY: "#9BA1A6"}
STATES = [
    ("ERROR", "🔴", "Error", RED),
    ("FAIL", "🔴", "Mismatch", RED),
    ("WAITING_RIGHT", "🟡", "Right not loaded", YELLOW),
    ("PENDING_RIGHT", "🔵", "Awaiting Right", BLUE),
    ("NOT_RUN", "⚪", "Not run", GRAY),
    ("SUCCESS", "🟢", "Matched", GREEN),
]
REVIEWS = [
    ("CHECKED_FAILED", "Reviewed · failed", RED),
    ("NOT_CHECKED", "Not reviewed", GRAY),
    ("CHECKED_SUCCEEDED", "Reviewed · OK", GREEN),
]
STATE_TINTS = {state: color for state, _, _, color in STATES}
REVIEW_TINTS = {state: color for state, _, color in REVIEWS}
REQUIRED_COLUMNS = [
    "check_id", "pair_name", "config_version", "query_date", "timezone", "review_status", "offset_days", "aws_name",
    "left_query_variable", "right_query_variable", "left_conn_detail", "right_conn_detail", "left_partition",
    "right_partition", "left_count", "right_count", "count_state", "left_checked_at", "right_checked_at",
    "error_message", "created_at", "updated_at",
]
AGE_SQL = """CASE
    WHEN age_minutes < 60 THEN concat(age_minutes, 'm')
    WHEN age_minutes < 1440 THEN concat(floor(age_minutes / 60), 'h ', age_minutes % 60, 'm')
    ELSE concat(floor(age_minutes / 1440), 'd ', floor((age_minutes % 1440) / 60), 'h')
  END"""
TARGET_SQL = "concat_ws(' · ', get_json_object({c}, '$.source'), get_json_object({c}, '$.conn_name'), get_json_object({c}, '$.server_name'), concat_ws('.', get_json_object({c}, '$.catalog'), get_json_object({c}, '$.schema'), get_json_object({c}, '$.table')))"


# >>> date-range default covering the last n days <<< #
def last_days(n):
    return {"range": {"dataType": "DATE", "min": {"value": f"now-{n}d/d"}, "max": {"value": "now/d"}}}


# >>> sql CASE mapping a column through (value, label) pairs <<< #
def case(column, pairs, default):
    whens = "\n".join(f"    WHEN '{value}' THEN '{label}'" for value, label in pairs)
    return f"CASE {column}\n{whens}\n    ELSE {default}\n  END"


# >>> sql rendering a count as 950 / 12.3K / 4.5M / 1.2B <<< #
def compact(column):
    return (f"CASE WHEN {column} IS NULL THEN '–' "
            f"WHEN abs({column}) >= 1000000000 THEN concat(round({column} / 1e9, 1), 'B') "
            f"WHEN abs({column}) >= 1000000 THEN concat(round({column} / 1e6, 1), 'M') "
            f"WHEN abs({column}) >= 1000 THEN concat(round({column} / 1e3, 1), 'K') "
            f"ELSE CAST({column} AS STRING) END")


# >>> dataset sql keyed by dataset name <<< #
def dataset_sql(table):
    status = case("count_state", [(s, f"{i} {l}") for s, i, l, _ in STATES], "count_state")
    icon = case("count_state", [(s, i) for s, i, _, _ in STATES], "'❔'")
    severity = case("count_state", [(s, str(n)) for n, (s, _, _, _) in enumerate(STATES)], str(len(STATES)))
    review = case("review_status", [(s, l) for s, l, _ in REVIEWS], "review_status")
    current = f"""WITH ranked AS (
  SELECT *,
    row_number() OVER (PARTITION BY pair_name ORDER BY query_date DESC NULLS LAST, created_at DESC, check_id DESC) AS check_rank,
    row_number() OVER (PARTITION BY pair_name ORDER BY config_version DESC, created_at DESC, check_id DESC) AS config_rank
  FROM {table}
),
latest AS (
  SELECT r.* EXCEPT (review_status), v.review_status,
    CAST(timestampdiff(MINUTE, r.created_at, current_timestamp()) AS BIGINT) AS age_minutes
  FROM ranked r
  JOIN (SELECT pair_name, review_status FROM ranked WHERE config_rank = 1) v ON r.pair_name = v.pair_name
  WHERE r.check_rank = 1
)
SELECT
  pair_name,
  count_state,
  {status} AS status,
  CAST({severity} AS INT) AS severity,
  review_status,
  {review} AS review,
  query_date,
  left_count,
  right_count,
  right_count - left_count AS count_diff,
  error_message,
  created_at,
  age_minutes,
  {AGE_SQL} AS age,
  CASE WHEN count_state <> 'SUCCESS' THEN round(age_minutes / 1440.0, 1) END AS open_age_days,
  CAST(count_state = 'SUCCESS' AS INT) AS is_success,
  CAST(count_state IN ('FAIL', 'ERROR') AS INT) AS is_failed,
  CAST(count_state IN ('PENDING_RIGHT', 'WAITING_RIGHT') AS INT) AS is_waiting
FROM latest"""
    history = f"""WITH base AS (
  SELECT *,
    CAST(timestampdiff(MINUTE, created_at, current_timestamp()) AS BIGINT) AS age_minutes,
    row_number() OVER (PARTITION BY pair_name, query_date ORDER BY created_at DESC, check_id DESC) AS day_rank
  FROM {table}
  WHERE query_date IS NOT NULL
)
SELECT
  query_date,
  pair_name,
  count_state,
  {status} AS status,
  concat({icon}, ' ', CASE
    WHEN count_state = 'SUCCESS' THEN {compact("left_count")}
    WHEN count_state = 'ERROR' THEN 'error'
    ELSE concat({compact("left_count")}, ' → ', {compact("right_count")})
  END) AS grid_cell,
  day_rank,
  review_status,
  left_count,
  right_count,
  right_count - left_count AS count_diff,
  left_partition,
  right_partition,
  error_message,
  coalesce(error_message, '(none)') AS error_text,
  {AGE_SQL} AS age,
  left_checked_at,
  right_checked_at,
  aws_name,
  config_version,
  offset_days,
  timezone,
  {TARGET_SQL.format(c="left_conn_detail")} AS left_target,
  {TARGET_SQL.format(c="right_conn_detail")} AS right_target,
  left_query_variable,
  right_query_variable,
  left_conn_detail,
  right_conn_detail,
  created_at,
  updated_at,
  check_id
FROM base"""
    config = f"""SELECT
  pair_name,
  config_version,
  review_status,
  aws_name,
  offset_days,
  timezone,
  {TARGET_SQL.format(c="left_conn_detail")} AS left_target,
  {TARGET_SQL.format(c="right_conn_detail")} AS right_target,
  left_query_variable,
  right_query_variable,
  left_conn_detail,
  right_conn_detail,
  created_at,
  check_id
FROM {table}
WHERE query_date IS NULL"""
    return {"ds_current": current, "ds_history": history, "ds_config": config}


# >>> lvdash dataset entry <<< #
def dataset(name, display, sql):
    lines = sql.split("\n")
    return {"name": name, "displayName": display, "queryLines": [line + "\n" for line in lines[:-1]] + [lines[-1]]}


# >>> frame block for widget title and description <<< #
def frame(title, description=""):
    return {"showTitle": True, "title": title, "showDescription": bool(description), "description": description}


# >>> v2 style rules tinting a cell by another field's exact value <<< #
def tint_rules(field, tints):
    return {"type": "basic", "rules": [
        {"condition": {"operand": {"type": "data-value", "value": value}, "operator": "=", "fieldName": field},
         "backgroundColor": TINT[color][0], "foregroundColor": TINT[color][1]}
        for value, color in tints.items()
    ]}


# >>> v2 style rules coloring any nonzero number red <<< #
def nonzero_rules(field):
    return {"type": "basic", "rules": [
        {"condition": {"operand": {"type": "data-value", "value": "0"}, "operator": op, "fieldName": field},
         "foregroundColor": TINT[RED][1]}
        for op in (">", "<")
    ]}


# >>> table v2 column encoding <<< #
def column(field, title, kind="string", style=None, width=None):
    spec = {"fieldName": field, "displayName": title, "useForSearch": kind == "string"}
    if kind == "integer":
        spec["format"] = {"type": "number-plain", "abbreviation": "none", "decimalPlaces": {"type": "exact", "places": 0}}
        spec["contentAlignment"] = "right"
    elif kind == "date":
        spec["format"] = {"type": "moment.js", "format": "YYYY-MM-DD"}
    elif kind == "datetime":
        spec["format"] = {"type": "moment.js", "format": "YYYY-MM-DD HH:mm"}
    if kind == "long":
        spec["actions"] = {"hover": {"type": "tooltip", "tooltipTemplate": "{{ @ }}"}}
    if style:
        spec["style"] = style
    if width:
        spec["columnWidth"] = width
    return spec


# >>> table v2 widget; extra fields feed style rules and sort keys <<< #
def table(name, ds, title, cols, orders, extra=(), filters=None, description="", rows=25):
    fields = [c["fieldName"] for c in cols] + [f for f in extra if f not in {c["fieldName"] for c in cols}]
    query = {
        "datasetName": ds,
        "fields": [{"name": f, "expression": f"`{f}`"} for f in fields],
        "disaggregated": True,
        "orders": [{"direction": direction, "expression": f"`{field}`"} for field, direction in orders],
    }
    if filters:
        query["filters"] = [{"expression": f} for f in filters]
    return {
        "name": name,
        "queries": [{"name": "main_query", "query": query}],
        "spec": {
            "version": 2, "widgetType": "table", "rowsPerPage": rows, "displayRowNumbers": False,
            "encodings": {"columns": cols}, "data": {"queryName": "main_query"}, "frame": frame(title, description),
        },
    }


# >>> counter widget aggregating one field <<< #
def counter(name, ds, title, agg, field, description=""):
    alias = f"{agg.lower()}({field})"
    return {
        "name": name,
        "queries": [{"name": "main_query", "query": {
            "datasetName": ds, "fields": [{"name": alias, "expression": f"{agg}(`{field}`)"}], "disaggregated": False}}],
        "spec": {
            "version": 2, "widgetType": "counter", "encodings": {"value": {"fieldName": alias, "displayName": title}},
            "data": {"queryName": "main_query"}, "frame": frame(title, description),
        },
    }


# >>> stacked bar of checks per day colored by status <<< #
def daily_bar(name, ds, title):
    return {
        "name": name,
        "queries": [{"name": "main_query", "query": {"datasetName": ds, "fields": [
            {"name": "query_date", "expression": "`query_date`"},
            {"name": "count_state", "expression": "`count_state`"},
            {"name": "count(pair_name)", "expression": "COUNT(`pair_name`)"},
        ], "disaggregated": False}}],
        "spec": {
            "version": 3, "widgetType": "bar",
            "encodings": {
                "x": {"fieldName": "query_date", "scale": {"type": "temporal"}, "displayName": "Query date"},
                "y": {"fieldName": "count(pair_name)", "scale": {"type": "quantitative"}, "displayName": "Checks"},
                "color": {"fieldName": "count_state", "displayName": "Status", "scale": {
                    "type": "categorical", "mappings": [{"value": s, "color": SOLID[c]} for s, c in STATE_TINTS.items()]}},
            },
            "frame": frame(title),
        },
    }


# >>> pivot of pairs by query date showing each day's status cell <<< #
def status_grid(name, ds, title, description=""):
    return {
        "name": name,
        "queries": [{"name": "main_query", "query": {
            "datasetName": ds,
            "fields": [
                {"name": "pair_name", "expression": "`pair_name`"},
                {"name": "query_date", "expression": "`query_date`"},
                {"name": "max(grid_cell)", "expression": "MAX(`grid_cell`)"},
            ],
            "filters": [{"expression": "`day_rank` = 1"}],
            "disaggregated": False,
            "orders": [{"direction": "ASC", "expression": "`pair_name`"}, {"direction": "DESC", "expression": "`query_date`"}]}}],
        "spec": {
            "version": 3, "widgetType": "pivot",
            "encodings": {
                "rows": [{"fieldName": "pair_name", "displayName": "Pair"}],
                "columns": [{"fieldName": "query_date", "displayName": "Query date"}],
                "cell": {"type": "multi-cell", "fields": [
                    {"fieldName": "max(grid_cell)", "cellType": "text", "displayName": "Status · Left → Right"}]},
            },
            "frame": frame(title, description),
        },
    }


# >>> pivot with expand and collapse per row level <<< #
def error_tree(name, ds, title, description=""):
    rows = [("count_state", "Status"), ("pair_name", "Pair"), ("error_text", "Error message")]
    names = [r for r, _ in rows]
    return {
        "name": name,
        "queries": [{"name": "main_query", "query": {
            "datasetName": ds,
            "fields": [{"name": r, "expression": f"`{r}`"} for r in names] + [
                {"name": "count(pair_name)", "expression": "COUNT(`pair_name`)"},
                {"name": "max(query_date)", "expression": "MAX(`query_date`)"}],
            "filters": [{"expression": "`error_message` IS NOT NULL"}],
            "cubeGroupingSets": {"sets": [{"fieldNames": names[:i]} if i else {} for i in range(len(names), -1, -1)]},
            "disaggregated": False,
            "orders": [{"direction": "ASC", "expression": f"`{r}`"} for r in names]}}],
        "spec": {
            "version": 3, "widgetType": "pivot",
            "encodings": {
                "rows": [{"fieldName": r, "displayTotal": True, "displayName": label} for r, label in rows],
                "cell": {"type": "multi-cell", "fields": [
                    {"fieldName": "count(pair_name)", "cellType": "text", "displayName": "Checks"},
                    {"fieldName": "max(query_date)", "cellType": "text", "displayName": "Latest"},
                ]},
            },
            "frame": frame(title, description),
        },
    }


# >>> filter widget bound to a field on one or more datasets <<< #
def field_filter(name, kind, title, field, datasets, default=None):
    queries, fields = [], []
    for ds in datasets:
        qname = f"filter_{name}_{ds}"
        queries.append({"name": qname, "query": {"datasetName": ds, "fields": [
            {"name": field, "expression": f"`{field}`"},
            {"name": f"{field}_associativity", "expression": "COUNT_IF(`associative_filter_predicate_group`)"},
        ], "disaggregated": False}})
        fields.append({"fieldName": field, "displayName": field, "queryName": qname})
    spec = {"version": 2, "widgetType": kind, "encodings": {"fields": fields}, "frame": {"showTitle": True, "title": title}}
    if default:
        spec["selection"] = {"defaultSelection": default}
    return {"name": name, "queries": queries, "spec": spec}


# >>> markdown text widget <<< #
def text(name, markdown):
    return {"name": name, "multilineTextboxSpec": {"lines": [line + "\n" for line in markdown.strip().split("\n")]}}


# >>> place a widget on the 12-column grid <<< #
def at(widget, x, y, w, h):
    return {"widget": widget, "position": {"x": x, "y": y, "width": w, "height": h}}


# >>> canvas page on the 12-column grid <<< #
def page(name, display, layout):
    return {"name": name, "displayName": display, "pageType": "PAGE_TYPE_CANVAS", "layoutVersion": "GRID_V1", "layout": layout}


# >>> executive page: latest status per pair plus day-by-day history <<< #
def executive_page():
    status_cols = [
        column("status", "Status", style=tint_rules("count_state", STATE_TINTS), width=170),
        column("pair_name", "Pair", width=160),
        column("query_date", "Query date", "date"),
        column("left_count", "Left count", "integer"),
        column("right_count", "Right count", "integer"),
        column("count_diff", "Right − Left", "integer", nonzero_rules("count_diff")),
        column("age", "Age", width=90),
        column("review", "Review", style=tint_rules("review_status", REVIEW_TINTS), width=150),
        column("error_message", "Error (hover for full text)", "long", width=420),
    ]
    note = ("**Pair status** = latest check per pair, most urgent first · **Age** = time since `created_at` · "
            "**Status history** = one cell per pair per query date (🟢 matched count, 🔴/🟡 Left → Right)")
    layout = [
        at(text("exec_note", note), 0, 0, 9, 1),
        at(field_filter("exec_history_range", "filter-date-range-picker", "History range", "query_date",
                        ["ds_history"], last_days(14)), 9, 0, 3, 1),
        at(counter("kpi_failed", "ds_current", "🔴 Needs attention", "SUM", "is_failed", "Mismatch or error"), 0, 1, 3, 2),
        at(counter("kpi_waiting", "ds_current", "🟡 Waiting", "SUM", "is_waiting", "Right side not ready"), 3, 1, 3, 2),
        at(counter("kpi_success", "ds_current", "🟢 Matched", "SUM", "is_success", "Left = Right"), 6, 1, 3, 2),
        at(counter("kpi_oldest", "ds_current", "Oldest open issue (days)", "MAX", "open_age_days",
                   "Age of the oldest pair not matched"), 9, 1, 3, 2),
        at(table("exec_status", "ds_current", "Pair status", status_cols,
                 [("severity", "ASC"), ("age_minutes", "DESC"), ("pair_name", "ASC")],
                 extra=("count_state", "review_status")), 0, 3, 12, 7),
        at(status_grid("exec_history", "ds_history", "Status history",
                       "Latest check per pair and query date; range set by History range above"), 0, 10, 12, 7),
    ]
    return page("executive", "Executive overview", layout)


# >>> analyst page: filters, trend, collapsible errors, full history <<< #
def analyst_page():
    history_cols = [
        column("query_date", "Query date", "date"),
        column("pair_name", "Pair", width=150),
        column("status", "Status", style=tint_rules("count_state", STATE_TINTS), width=170),
        column("left_count", "Left count", "integer"),
        column("right_count", "Right count", "integer"),
        column("count_diff", "Right − Left", "integer", nonzero_rules("count_diff")),
        column("left_partition", "Left partition"),
        column("right_partition", "Right partition"),
        column("error_message", "Error (hover)", "long", width=320),
        column("review_status", "Review", style=tint_rules("review_status", REVIEW_TINTS)),
        column("age", "Age"),
        column("left_checked_at", "Left checked", "datetime"),
        column("right_checked_at", "Right checked", "datetime"),
        column("aws_name", "AWS name"),
        column("config_version", "Config v", "integer"),
        column("offset_days", "Offset", "integer"),
        column("left_target", "Left target", "long", width=260),
        column("right_target", "Right target", "long", width=260),
        column("left_query_variable", "Left var"),
        column("right_query_variable", "Right var"),
        column("left_conn_detail", "Left conn JSON", "long", width=260),
        column("right_conn_detail", "Right conn JSON", "long", width=260),
        column("timezone", "Timezone"),
        column("created_at", "Created", "datetime"),
        column("updated_at", "Updated", "datetime"),
        column("check_id", "check_id", "long"),
    ]
    config_cols = [
        column("pair_name", "Pair", width=150),
        column("config_version", "Config v", "integer"),
        column("review_status", "Review", style=tint_rules("review_status", REVIEW_TINTS)),
        column("aws_name", "AWS name"),
        column("offset_days", "Offset", "integer"),
        column("left_target", "Left target", "long", width=260),
        column("right_target", "Right target", "long", width=260),
        column("left_query_variable", "Left var"),
        column("right_query_variable", "Right var"),
        column("left_conn_detail", "Left conn JSON", "long", width=260),
        column("right_conn_detail", "Right conn JSON", "long", width=260),
        column("timezone", "Timezone"),
        column("created_at", "Created", "datetime"),
        column("check_id", "check_id", "long"),
    ]
    both = ["ds_history", "ds_config"]
    layout = [
        at(field_filter("f_query_date", "filter-date-range-picker", "Query date", "query_date", ["ds_history"], last_days(7)), 0, 0, 4, 1),
        at(field_filter("f_pair", "filter-multi-select", "Pair", "pair_name", both), 4, 0, 2, 1),
        at(field_filter("f_state", "filter-multi-select", "Status", "count_state", ["ds_history"]), 6, 0, 2, 1),
        at(field_filter("f_review", "filter-multi-select", "Review", "review_status", both), 8, 0, 2, 1),
        at(field_filter("f_aws", "filter-multi-select", "AWS name", "aws_name", both), 10, 0, 2, 1),
        at(daily_bar("an_daily", "ds_history", "Checks per day by status"), 0, 1, 6, 5),
        at(error_tree("an_errors", "ds_history", "Errors · click ▸ to expand"), 6, 1, 6, 5),
        at(table("an_history", "ds_history", "Check history", history_cols,
                 [("query_date", "DESC"), ("pair_name", "ASC"), ("created_at", "DESC")],
                 extra=("count_state",), description="Widget menu ⋮ → Download exports the filtered rows.", rows=50),
           0, 6, 12, 10),
        at(table("an_config", "ds_config", "Configuration snapshots", config_cols,
                 [("pair_name", "ASC"), ("config_version", "DESC")],
                 description="Rows with no query_date; date and status filters do not apply."), 0, 16, 12, 5),
    ]
    return page("analyst", "Analyst details", layout)


# >>> full serialized dashboard <<< #
def build(table_name):
    sql = dataset_sql(table_name)
    return {
        "datasets": [
            dataset("ds_current", "pair_current_status", sql["ds_current"]),
            dataset("ds_history", "pair_check_history", sql["ds_history"]),
            dataset("ds_config", "pair_config_snapshots", sql["ds_config"]),
        ],
        "pages": [executive_page(), analyst_page()],
        "uiSettings": {"theme": {"widgetHeaderAlignment": "ALIGNMENT_UNSPECIFIED"}, "applyModeEnabled": False},
    }


# >>> standalone sql that reproduces every dataset plus sanity checks <<< #
def validation_sql(table_name):
    sql = dataset_sql(table_name)
    catalog, schema, name = table_name.split(".")
    required = ", ".join(f"('{c}')" for c in REQUIRED_COLUMNS)
    states = ", ".join(f"'{s}'" for s, _, _, _ in STATES)
    reviews = ", ".join(f"'{s}'" for s, _, _ in REVIEWS)
    checks = f"""SELECT 'missing_column' AS problem, r.col AS detail
FROM VALUES {required} AS r(col)
LEFT JOIN {catalog}.information_schema.columns c
  ON lower(c.table_schema) = lower('{schema}') AND lower(c.table_name) = lower('{name}') AND lower(c.column_name) = r.col
WHERE c.column_name IS NULL
UNION ALL
SELECT 'unknown_count_state', count_state FROM {table_name}
WHERE count_state NOT IN ({states})
UNION ALL
SELECT 'unknown_review_status', review_status FROM {table_name}
WHERE review_status NOT IN ({reviews})
UNION ALL
SELECT 'unparseable_conn_json', check_id FROM {table_name}
WHERE get_json_object(left_conn_detail, '$') IS NULL OR get_json_object(right_conn_detail, '$') IS NULL;
"""
    return "\n".join([checks] + [f"{body};\n" for body in sql.values()])


# >>> cli entry <<< #
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", default="CATALOG.SCHEMA.table_list")
    parser.add_argument("--out", default=str(Path(__file__).with_name("count_watch.lvdash.json")))
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z_][\w]*\.[A-Za-z_][\w]*\.[A-Za-z_][\w]*", args.table):
        raise SystemExit("--table must be catalog.schema.table")
    out = Path(args.out)
    out.write_text(json.dumps(build(args.table), indent=2, ensure_ascii=False) + "\n")
    out.with_name(out.name.replace(".lvdash.json", "_validate.sql")).write_text(validation_sql(args.table))
    print(out)


if __name__ == "__main__":
    main()
