SELECT 'missing_column' AS problem, r.col AS detail
FROM VALUES ('check_id'), ('pair_name'), ('config_version'), ('query_date'), ('timezone'), ('review_status'), ('offset_days'), ('aws_name'), ('left_query_variable'), ('right_query_variable'), ('left_conn_detail'), ('right_conn_detail'), ('left_partition'), ('right_partition'), ('left_count'), ('right_count'), ('count_state'), ('left_checked_at'), ('right_checked_at'), ('error_message'), ('created_at'), ('updated_at') AS r(col)
LEFT JOIN CATALOG.information_schema.columns c
  ON lower(c.table_schema) = lower('SCHEMA') AND lower(c.table_name) = lower('table_list') AND lower(c.column_name) = r.col
WHERE c.column_name IS NULL
UNION ALL
SELECT 'unknown_count_state', count_state FROM CATALOG.SCHEMA.table_list
WHERE count_state NOT IN ('ERROR', 'FAIL', 'WAITING_RIGHT', 'PENDING_RIGHT', 'NOT_RUN', 'SUCCESS')
UNION ALL
SELECT 'unknown_review_status', review_status FROM CATALOG.SCHEMA.table_list
WHERE review_status NOT IN ('CHECKED_FAILED', 'NOT_CHECKED', 'CHECKED_SUCCEEDED')
UNION ALL
SELECT 'unparseable_conn_json', check_id FROM CATALOG.SCHEMA.table_list
WHERE get_json_object(left_conn_detail, '$') IS NULL OR get_json_object(right_conn_detail, '$') IS NULL;

WITH ranked AS (
  SELECT *,
    row_number() OVER (PARTITION BY pair_name ORDER BY query_date DESC NULLS LAST, created_at DESC, check_id DESC) AS check_rank,
    row_number() OVER (PARTITION BY pair_name ORDER BY config_version DESC, created_at DESC, check_id DESC) AS config_rank
  FROM CATALOG.SCHEMA.table_list
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
  CASE count_state
    WHEN 'ERROR' THEN '🔴 Error'
    WHEN 'FAIL' THEN '🔴 Mismatch'
    WHEN 'WAITING_RIGHT' THEN '🟡 Right not loaded'
    WHEN 'PENDING_RIGHT' THEN '🔵 Awaiting Right'
    WHEN 'NOT_RUN' THEN '⚪ Not run'
    WHEN 'SUCCESS' THEN '🟢 Matched'
    ELSE count_state
  END AS status,
  CAST(CASE count_state
    WHEN 'ERROR' THEN '0'
    WHEN 'FAIL' THEN '1'
    WHEN 'WAITING_RIGHT' THEN '2'
    WHEN 'PENDING_RIGHT' THEN '3'
    WHEN 'NOT_RUN' THEN '4'
    WHEN 'SUCCESS' THEN '5'
    ELSE 6
  END AS INT) AS severity,
  review_status,
  CASE review_status
    WHEN 'CHECKED_FAILED' THEN 'Reviewed · failed'
    WHEN 'NOT_CHECKED' THEN 'Not reviewed'
    WHEN 'CHECKED_SUCCEEDED' THEN 'Reviewed · OK'
    ELSE review_status
  END AS review,
  query_date,
  left_count,
  right_count,
  right_count - left_count AS count_diff,
  error_message,
  created_at,
  age_minutes,
  CASE
    WHEN age_minutes < 60 THEN concat(age_minutes, 'm')
    WHEN age_minutes < 1440 THEN concat(floor(age_minutes / 60), 'h ', age_minutes % 60, 'm')
    ELSE concat(floor(age_minutes / 1440), 'd ', floor((age_minutes % 1440) / 60), 'h')
  END AS age,
  CASE WHEN count_state <> 'SUCCESS' THEN round(age_minutes / 1440.0, 1) END AS open_age_days,
  CAST(count_state = 'SUCCESS' AS INT) AS is_success,
  CAST(count_state IN ('FAIL', 'ERROR') AS INT) AS is_failed,
  CAST(count_state IN ('PENDING_RIGHT', 'WAITING_RIGHT') AS INT) AS is_waiting
FROM latest;

WITH base AS (
  SELECT *,
    CAST(timestampdiff(MINUTE, created_at, current_timestamp()) AS BIGINT) AS age_minutes,
    row_number() OVER (PARTITION BY pair_name, query_date ORDER BY created_at DESC, check_id DESC) AS day_rank
  FROM CATALOG.SCHEMA.table_list
  WHERE query_date IS NOT NULL
)
SELECT
  query_date,
  pair_name,
  count_state,
  CASE count_state
    WHEN 'ERROR' THEN '🔴 Error'
    WHEN 'FAIL' THEN '🔴 Mismatch'
    WHEN 'WAITING_RIGHT' THEN '🟡 Right not loaded'
    WHEN 'PENDING_RIGHT' THEN '🔵 Awaiting Right'
    WHEN 'NOT_RUN' THEN '⚪ Not run'
    WHEN 'SUCCESS' THEN '🟢 Matched'
    ELSE count_state
  END AS status,
  concat(CASE count_state
    WHEN 'ERROR' THEN '🔴'
    WHEN 'FAIL' THEN '🔴'
    WHEN 'WAITING_RIGHT' THEN '🟡'
    WHEN 'PENDING_RIGHT' THEN '🔵'
    WHEN 'NOT_RUN' THEN '⚪'
    WHEN 'SUCCESS' THEN '🟢'
    ELSE '❔'
  END, ' ', CASE
    WHEN count_state = 'SUCCESS' THEN CASE WHEN left_count IS NULL THEN '–' WHEN abs(left_count) >= 1000000000 THEN concat(round(left_count / 1e9, 1), 'B') WHEN abs(left_count) >= 1000000 THEN concat(round(left_count / 1e6, 1), 'M') WHEN abs(left_count) >= 1000 THEN concat(round(left_count / 1e3, 1), 'K') ELSE CAST(left_count AS STRING) END
    WHEN count_state = 'ERROR' THEN 'error'
    ELSE concat(CASE WHEN left_count IS NULL THEN '–' WHEN abs(left_count) >= 1000000000 THEN concat(round(left_count / 1e9, 1), 'B') WHEN abs(left_count) >= 1000000 THEN concat(round(left_count / 1e6, 1), 'M') WHEN abs(left_count) >= 1000 THEN concat(round(left_count / 1e3, 1), 'K') ELSE CAST(left_count AS STRING) END, ' → ', CASE WHEN right_count IS NULL THEN '–' WHEN abs(right_count) >= 1000000000 THEN concat(round(right_count / 1e9, 1), 'B') WHEN abs(right_count) >= 1000000 THEN concat(round(right_count / 1e6, 1), 'M') WHEN abs(right_count) >= 1000 THEN concat(round(right_count / 1e3, 1), 'K') ELSE CAST(right_count AS STRING) END)
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
  CASE
    WHEN age_minutes < 60 THEN concat(age_minutes, 'm')
    WHEN age_minutes < 1440 THEN concat(floor(age_minutes / 60), 'h ', age_minutes % 60, 'm')
    ELSE concat(floor(age_minutes / 1440), 'd ', floor((age_minutes % 1440) / 60), 'h')
  END AS age,
  left_checked_at,
  right_checked_at,
  aws_name,
  config_version,
  offset_days,
  timezone,
  concat_ws(' · ', get_json_object(left_conn_detail, '$.source'), get_json_object(left_conn_detail, '$.conn_name'), get_json_object(left_conn_detail, '$.server_name'), concat_ws('.', get_json_object(left_conn_detail, '$.catalog'), get_json_object(left_conn_detail, '$.schema'), get_json_object(left_conn_detail, '$.table'))) AS left_target,
  concat_ws(' · ', get_json_object(right_conn_detail, '$.source'), get_json_object(right_conn_detail, '$.conn_name'), get_json_object(right_conn_detail, '$.server_name'), concat_ws('.', get_json_object(right_conn_detail, '$.catalog'), get_json_object(right_conn_detail, '$.schema'), get_json_object(right_conn_detail, '$.table'))) AS right_target,
  left_query_variable,
  right_query_variable,
  left_conn_detail,
  right_conn_detail,
  created_at,
  updated_at,
  check_id
FROM base;

SELECT
  pair_name,
  config_version,
  review_status,
  aws_name,
  offset_days,
  timezone,
  concat_ws(' · ', get_json_object(left_conn_detail, '$.source'), get_json_object(left_conn_detail, '$.conn_name'), get_json_object(left_conn_detail, '$.server_name'), concat_ws('.', get_json_object(left_conn_detail, '$.catalog'), get_json_object(left_conn_detail, '$.schema'), get_json_object(left_conn_detail, '$.table'))) AS left_target,
  concat_ws(' · ', get_json_object(right_conn_detail, '$.source'), get_json_object(right_conn_detail, '$.conn_name'), get_json_object(right_conn_detail, '$.server_name'), concat_ws('.', get_json_object(right_conn_detail, '$.catalog'), get_json_object(right_conn_detail, '$.schema'), get_json_object(right_conn_detail, '$.table'))) AS right_target,
  left_query_variable,
  right_query_variable,
  left_conn_detail,
  right_conn_detail,
  created_at,
  check_id
FROM CATALOG.SCHEMA.table_list
WHERE query_date IS NULL;
