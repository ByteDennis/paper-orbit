from __future__ import annotations

import html
import json
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from IPython.display import HTML, display

try:
    from pygments import highlight
    from pygments.formatters import HtmlFormatter
    from pygments.lexers import TextLexer, get_lexer_by_name
    from pygments.util import ClassNotFound
except ImportError:
    highlight = HtmlFormatter = get_lexer_by_name = TextLexer = None
    ClassNotFound = ValueError


Tone = Literal["neutral", "info", "success", "warning", "danger", "accent"]
GOOD = {"ok", "pass", "passed", "success", "succeeded", "done", "match", "true", "healthy"}
BAD = {"error", "failed", "fail", "danger", "diff", "mismatch", "false", "unhealthy"}
WARN = {"warning", "warn", "partial", "pending", "skipped", "unknown"}


@dataclass(frozen=True)
class Fragment:
    html: str

    def _repr_html_(self) -> str:
        return CSS + self.html

    def __str__(self) -> str:
        return self.html


CSS = r"""
<style>
:root {
  --nbk-radius: 10px;
  --nbk-radius-sm: 6px;
  --nbk-space: 12px;
  --nbk-font: var(--vscode-font-family, Inter, ui-sans-serif, system-ui, sans-serif);
  --nbk-mono: var(--vscode-editor-font-family, "SFMono-Regular", Consolas, monospace);
  --nbk-fg: var(--vscode-foreground, #24292f);
  --nbk-muted: var(--vscode-descriptionForeground, #66707b);
  --nbk-bg: var(--vscode-editor-background, #fff);
  --nbk-panel: var(--vscode-editorWidget-background, rgba(127,127,127,.075));
  --nbk-panel-strong: var(--vscode-sideBar-background, rgba(127,127,127,.12));
  --nbk-border: var(--vscode-panel-border, rgba(127,127,127,.28));
  --nbk-accent: var(--vscode-focusBorder, #4776d0);
  --nbk-blue: var(--vscode-charts-blue, #3794ff);
  --nbk-green: var(--vscode-testing-iconPassed, #2ea043);
  --nbk-yellow: var(--vscode-editorWarning-foreground, #bf8700);
  --nbk-red: var(--vscode-testing-iconFailed, #d1242f);
  --nbk-purple: var(--vscode-charts-purple, #8957e5);
}
.nbk { box-sizing: border-box; color: var(--nbk-fg); font-family: var(--nbk-font); }
.nbk *, .nbk *::before, .nbk *::after { box-sizing: inherit; }
.nbk-panel { margin: 10px 0; border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius);
  background: var(--nbk-panel); overflow: hidden; }
.nbk-pad { padding: 14px 16px; }
.nbk-title { margin: 0; font-size: 15px; font-weight: 650; letter-spacing: -.01em; }
.nbk-subtitle { margin: 4px 0 0; color: var(--nbk-muted); font-size: 12.5px; line-height: 1.45; }
.nbk-label { margin: 10px 0 4px; color: var(--nbk-muted); font-size: 10.5px; font-weight: 650;
  letter-spacing: .075em; text-transform: uppercase; }
.nbk-prose { font-size: 13px; line-height: 1.58; }
.nbk-prose p:first-child { margin-top: 0; } .nbk-prose p:last-child { margin-bottom: 0; }
.nbk-hero { position: relative; margin: 10px 0 16px; padding: 22px 24px; border: 1px solid var(--nbk-border);
  border-radius: 14px; overflow: hidden; background: linear-gradient(135deg, color-mix(in srgb, var(--nbk-blue) 15%, var(--nbk-bg)),
  color-mix(in srgb, var(--nbk-purple) 11%, var(--nbk-bg))); }
.nbk-hero::after { content: ""; position: absolute; width: 150px; height: 150px; right: -55px; top: -70px;
  border-radius: 50%; background: color-mix(in srgb, var(--nbk-accent) 18%, transparent); }
.nbk-hero h1 { position: relative; z-index: 1; margin: 0; font-size: 24px; letter-spacing: -.025em; }
.nbk-hero p { position: relative; z-index: 1; max-width: 720px; margin: 7px 0 0; color: var(--nbk-muted); font-size: 13.5px; }
.nbk-grid { display: grid; gap: 10px; margin: 10px 0; grid-template-columns: repeat(var(--nbk-cols, 2), minmax(0, 1fr)); }
@media (max-width: 700px) { .nbk-grid { grid-template-columns: 1fr; } }
.nbk-card { min-width: 0; padding: 14px 16px; border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius);
  background: var(--nbk-panel); }
.nbk-card-accent { border-top: 3px solid var(--nbk-accent); }
.nbk-table-wrap { margin: 8px 0; max-width: 100%; overflow: auto; border: 1px solid var(--nbk-border);
  border-radius: var(--nbk-radius); background: var(--nbk-bg); }
.nbk-table-wrap.scroll { max-height: var(--nbk-max-height, 380px); }
.nbk-table { width: 100%; border-collapse: separate; border-spacing: 0; font-family: var(--nbk-mono); font-size: 12px; }
.nbk-table caption { padding: 10px 12px; text-align: left; color: var(--nbk-muted); font-family: var(--nbk-font); font-size: 11.5px; }
.nbk-table th { position: sticky; top: 0; z-index: 1; padding: 7px 10px; text-align: left; white-space: nowrap;
  font-family: var(--nbk-font); font-weight: 650; background: var(--nbk-panel-strong); border-bottom: 1px solid var(--nbk-border); }
.nbk-table td { padding: 6px 10px; border-bottom: 1px solid var(--nbk-border); vertical-align: top; }
.nbk-table tr:last-child td { border-bottom: 0; }
.nbk-table.striped tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--nbk-panel) 62%, transparent); }
.nbk-table tbody tr:hover td { background: color-mix(in srgb, var(--nbk-blue) 8%, transparent); }
.nbk-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.nbk-table td.none { color: var(--nbk-muted); opacity: .65; }
.nbk-table td.good { color: var(--nbk-green); font-weight: 650; }
.nbk-table td.bad { color: var(--nbk-red); font-weight: 650; }
.nbk-table td.warn { color: var(--nbk-yellow); font-weight: 650; }
.nbk-code { margin: 8px 0; border: 1px solid var(--nbk-border); border-left: 3px solid var(--nbk-accent);
  border-radius: var(--nbk-radius-sm); background: var(--vscode-textCodeBlock-background, rgba(127,127,127,.1)); overflow: auto; }
.nbk-code-head { display: flex; justify-content: space-between; gap: 10px; padding: 6px 10px; color: var(--nbk-muted);
  border-bottom: 1px solid var(--nbk-border); font: 10.5px var(--nbk-font); text-transform: uppercase; letter-spacing: .06em; }
.nbk-code pre { margin: 0; padding: 10px 12px; white-space: pre-wrap; overflow-wrap: anywhere;
  color: var(--nbk-fg); background: transparent !important; font: 12.5px/1.5 var(--nbk-mono); }
.nbk-details { margin: 8px 0; border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius); background: var(--nbk-panel); overflow: hidden; }
.nbk-details > summary { display: flex; align-items: center; gap: 9px; padding: 10px 13px; cursor: pointer;
  list-style: none; font-size: 12.5px; font-weight: 650; user-select: none; }
.nbk-details > summary::-webkit-details-marker { display: none; }
.nbk-details > summary::before { content: "›"; color: var(--nbk-accent); font-size: 18px; line-height: 12px; transition: transform .15s ease; }
.nbk-details[open] > summary::before { transform: rotate(90deg); }
.nbk-details[open] > summary { border-bottom: 1px solid var(--nbk-border); }
.nbk-details-body { padding: 12px 14px; }
.nbk-details-body > :first-child { margin-top: 0; } .nbk-details-body > :last-child { margin-bottom: 0; }
.nbk-callout { display: grid; grid-template-columns: auto 1fr; gap: 10px; margin: 9px 0; padding: 11px 13px;
  border: 1px solid var(--nbk-border); border-left: 4px solid var(--tone); border-radius: var(--nbk-radius-sm);
  background: color-mix(in srgb, var(--tone) 8%, var(--nbk-bg)); }
.nbk-callout-icon { color: var(--tone); font-size: 16px; line-height: 1.2; }
.nbk-callout strong { display: block; margin-bottom: 2px; font-size: 12.5px; }
.nbk-callout div:last-child { font-size: 12.5px; line-height: 1.48; }
.nbk-neutral { --tone: var(--nbk-muted); } .nbk-info { --tone: var(--nbk-blue); }
.nbk-success { --tone: var(--nbk-green); } .nbk-warning { --tone: var(--nbk-yellow); }
.nbk-danger { --tone: var(--nbk-red); } .nbk-accent { --tone: var(--nbk-purple); }
.nbk-badge { display: inline-flex; align-items: center; gap: 5px; margin: 1px 3px 1px 0; padding: 2px 8px;
  color: var(--tone); border: 1px solid color-mix(in srgb, var(--tone) 45%, transparent); border-radius: 999px;
  background: color-mix(in srgb, var(--tone) 9%, transparent); font-size: 10.5px; font-weight: 650; white-space: nowrap; }
.nbk-badge::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.nbk-metric { padding: 13px 15px; border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius); background: var(--nbk-panel); }
.nbk-metric-label { color: var(--nbk-muted); font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: .055em; }
.nbk-metric-value { margin-top: 3px; font-size: 22px; font-weight: 720; letter-spacing: -.025em; font-variant-numeric: tabular-nums; }
.nbk-metric-note { margin-top: 3px; color: var(--nbk-muted); font-size: 11px; }
.nbk-kv { display: grid; grid-template-columns: minmax(110px, .35fr) 1fr; margin: 8px 0; overflow: hidden;
  border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius); font-size: 12px; }
.nbk-kv dt, .nbk-kv dd { margin: 0; padding: 7px 10px; border-bottom: 1px solid var(--nbk-border); }
.nbk-kv dt { color: var(--nbk-muted); background: var(--nbk-panel); font-weight: 650; }
.nbk-kv dd { font-family: var(--nbk-mono); overflow-wrap: anywhere; }
.nbk-kv > :nth-last-child(-n+2) { border-bottom: 0; }
.nbk-progress { margin: 9px 0; }
.nbk-progress-head { display: flex; justify-content: space-between; margin-bottom: 5px; color: var(--nbk-muted); font-size: 11px; }
.nbk-progress-track { height: 8px; overflow: hidden; border-radius: 999px; background: var(--nbk-panel-strong); }
.nbk-progress-bar { width: var(--nbk-value); height: 100%; border-radius: inherit; background: var(--tone); }
.nbk-steps { margin: 10px 0; padding: 0; list-style: none; counter-reset: nbk-step; }
.nbk-steps li { position: relative; min-height: 34px; margin-left: 14px; padding: 0 0 15px 25px; border-left: 1px solid var(--nbk-border); }
.nbk-steps li:last-child { padding-bottom: 0; border-left-color: transparent; }
.nbk-steps li::before { counter-increment: nbk-step; content: counter(nbk-step); position: absolute; left: -12px; top: -2px;
  width: 23px; height: 23px; display: grid; place-items: center; border: 1px solid var(--nbk-accent); border-radius: 50%;
  color: var(--nbk-accent); background: var(--nbk-bg); font-size: 10px; font-weight: 700; }
.nbk-step-title { font-size: 12.5px; font-weight: 650; } .nbk-step-text { margin-top: 2px; color: var(--nbk-muted); font-size: 11.5px; }
.nbk-quote { margin: 10px 0; padding: 10px 14px; border-left: 3px solid var(--nbk-purple);
  background: color-mix(in srgb, var(--nbk-purple) 7%, transparent); font-size: 13px; font-style: italic; line-height: 1.55; }
.nbk-quote footer { margin-top: 5px; color: var(--nbk-muted); font-size: 11px; font-style: normal; }
.nbk-divider { display: flex; align-items: center; gap: 10px; margin: 15px 0; color: var(--nbk-muted); font-size: 10.5px;
  font-weight: 650; text-transform: uppercase; letter-spacing: .07em; }
.nbk-divider::before, .nbk-divider::after { content: ""; height: 1px; flex: 1; background: var(--nbk-border); }
.nbk-tree { margin: 8px 0; padding: 10px 12px; border: 1px solid var(--nbk-border); border-radius: var(--nbk-radius-sm);
  background: var(--nbk-panel); white-space: pre; overflow: auto; font: 12px/1.55 var(--nbk-mono); }
.nbk-empty { padding: 18px; color: var(--nbk-muted); text-align: center; font-size: 12px; }
</style>
"""

if HtmlFormatter:
    CSS += "<style>" + HtmlFormatter(style="friendly").get_style_defs(".vscode-light .nbk-code")
    CSS += HtmlFormatter(style="github-dark").get_style_defs(".vscode-dark .nbk-code") + "</style>"


def _escape(value: Any) -> str:
    return html.escape(str(value), quote=True)


def _tone(value: str) -> Tone:
    normalized = str(value).strip().lower()
    if normalized in GOOD:
        return "success"
    if normalized in BAD:
        return "danger"
    if normalized in WARN:
        return "warning"
    return (
        normalized
        if normalized in {"neutral", "info", "success", "warning", "danger", "accent"}
        else "neutral"
    )


def _fragment(value: Any) -> str:
    if isinstance(value, Fragment):
        return value.html
    if isinstance(value, Sequence) and not isinstance(value, str | bytes):
        return "".join(_fragment(item) for item in value)
    return f'<div class="nbk-prose">{_escape(value)}</div>'


def _out(body: str, display_output: bool) -> Fragment:
    result = Fragment(f'<div class="nbk">{body}</div>')
    if display_output:
        display(HTML(CSS + result.html))
    return result


def raw(markup: str) -> Fragment:
    return Fragment(str(markup))


def hero(title: str, subtitle: str = "", *, display_output: bool = True) -> Fragment:
    body = f'<section class="nbk-hero"><h1>{_escape(title)}</h1>'
    body += f"<p>{_escape(subtitle)}</p>" if subtitle else ""
    return _out(body + "</section>", display_output)


def card(
    title: str,
    content: Any = "",
    *,
    subtitle: str = "",
    accent: bool = False,
    display_output: bool = True,
) -> Fragment:
    cls = "nbk-card nbk-card-accent" if accent else "nbk-card"
    head = f'<h3 class="nbk-title">{_escape(title)}</h3>'
    head += f'<p class="nbk-subtitle">{_escape(subtitle)}</p>' if subtitle else ""
    body = f'<section class="{cls}">{head}<div style="margin-top:10px">{_fragment(content)}</div></section>'
    return _out(body, display_output)


def grid(*items: Any, columns: int = 2, display_output: bool = True) -> Fragment:
    body = "".join(_fragment(item) for item in items)
    return _out(
        f'<div class="nbk-grid" style="--nbk-cols:{max(1, columns)}">{body}</div>', display_output
    )


def badge(text: str, tone: Tone = "neutral", *, display_output: bool = True) -> Fragment:
    body = f'<span class="nbk-badge nbk-{_tone(tone)}">{_escape(text)}</span>'
    return _out(body, display_output)


def callout(
    text: str,
    *,
    title: str = "",
    tone: Tone = "info",
    icon: str | None = None,
    display_output: bool = True,
) -> Fragment:
    icons = {
        "info": "ⓘ",
        "success": "✓",
        "warning": "△",
        "danger": "!",
        "accent": "◆",
        "neutral": "•",
    }
    actual = _tone(tone)
    heading = f"<strong>{_escape(title)}</strong>" if title else ""
    body = (
        f'<aside class="nbk-callout nbk-{actual}"><span class="nbk-callout-icon">'
        f"{_escape(icon or icons[actual])}</span><div>{heading}{_escape(text)}</div></aside>"
    )
    return _out(body, display_output)


def details(
    summary: str,
    content: Any,
    *,
    open: bool = False,
    tone: Tone = "neutral",
    display_output: bool = True,
) -> Fragment:
    opened = " open" if open else ""
    body = (
        f'<details class="nbk-details nbk-{_tone(tone)}"{opened}><summary>{_escape(summary)}</summary>'
        f'<div class="nbk-details-body">{_fragment(content)}</div></details>'
    )
    return _out(body, display_output)


collapse = details


def metric(
    label: str, value: Any, *, note: str = "", tone: Tone = "accent", display_output: bool = True
) -> Fragment:
    body = (
        f'<section class="nbk-metric nbk-{_tone(tone)}"><div class="nbk-metric-label">{_escape(label)}</div>'
        f'<div class="nbk-metric-value">{_escape(value)}</div>'
    )
    body += f'<div class="nbk-metric-note">{_escape(note)}</div>' if note else ""
    return _out(body + "</section>", display_output)


def metrics(
    items: Mapping[str, Any] | Sequence[tuple[str, Any]],
    *,
    columns: int = 4,
    display_output: bool = True,
) -> Fragment:
    pairs = items.items() if isinstance(items, Mapping) else items
    cards = [metric(label, value, display_output=False) for label, value in pairs]
    return grid(*cards, columns=columns, display_output=display_output)


def progress(
    value: float,
    *,
    label: str = "",
    total: float = 100,
    tone: Tone = "success",
    display_output: bool = True,
) -> Fragment:
    percent = 0 if total == 0 else max(0, min(100, 100 * float(value) / float(total)))
    head = f'<div class="nbk-progress-head"><span>{_escape(label)}</span><span>{percent:.0f}%</span></div>'
    bar = f'<div class="nbk-progress-track"><div class="nbk-progress-bar" style="--nbk-value:{percent:.2f}%"></div></div>'
    return _out(f'<div class="nbk-progress nbk-{_tone(tone)}">{head}{bar}</div>', display_output)


def kv(
    items: Mapping[str, Any] | Sequence[tuple[str, Any]], *, display_output: bool = True
) -> Fragment:
    pairs = items.items() if isinstance(items, Mapping) else items
    rows = "".join(f"<dt>{_escape(key)}</dt><dd>{_escape(value)}</dd>" for key, value in pairs)
    return _out(f'<dl class="nbk-kv">{rows}</dl>', display_output)


def steps(items: Sequence[str | tuple[str, str]], *, display_output: bool = True) -> Fragment:
    rows = []
    for item in items:
        title, text = (item, "") if isinstance(item, str) else item
        extra = f'<div class="nbk-step-text">{_escape(text)}</div>' if text else ""
        rows.append(f'<li><div class="nbk-step-title">{_escape(title)}</div>{extra}</li>')
    return _out(f'<ol class="nbk-steps">{"".join(rows)}</ol>', display_output)


def quote(text: str, author: str = "", *, display_output: bool = True) -> Fragment:
    footer = f"<footer>— {_escape(author)}</footer>" if author else ""
    return _out(
        f'<blockquote class="nbk-quote">{_escape(text)}{footer}</blockquote>', display_output
    )


def divider(label: str = "", *, display_output: bool = True) -> Fragment:
    return _out(f'<div class="nbk-divider">{_escape(label)}</div>', display_output)


def table(
    data: Any,
    index: bool = False,
    *,
    caption: str = "",
    striped: bool = True,
    max_height: int | None = None,
    display_output: bool = True,
) -> Fragment:
    if hasattr(data, "columns") and hasattr(data, "itertuples"):
        frame = data.reset_index() if index else data
        columns = [str(column) for column in frame.columns]
        rows = [list(values) for values in frame.itertuples(index=False, name=None)]
    else:
        source = list(data)
        if not source:
            return _out('<div class="nbk-panel nbk-empty">No rows</div>', display_output)
        if isinstance(source[0], Mapping):
            columns = list(dict.fromkeys(key for row in source for key in row))
            rows = [[row.get(column) for column in columns] for row in source]
        else:
            rows = [
                list(row)
                if isinstance(row, Sequence) and not isinstance(row, str | bytes)
                else [row]
                for row in source
            ]
            columns = [f"column_{number + 1}" for number in range(max(map(len, rows)))]
    head = "".join(f"<th>{_escape(column)}</th>" for column in columns)
    body_rows = []
    for row in rows:
        cells = []
        for value in [*row, *([None] * (len(columns) - len(row)))]:
            missing = value is None or (isinstance(value, float) and math.isnan(value))
            text = "" if missing else str(value)
            normalized = text.strip().lower()
            kind = (
                "none"
                if missing
                else "good"
                if normalized in GOOD
                else "bad"
                if normalized in BAD
                else "warn"
                if normalized in WARN
                else ""
            )
            if not kind and isinstance(value, int | float) and not isinstance(value, bool):
                kind = "num"
            cells.append(f'<td class="{kind}">{_escape(text)}</td>')
        body_rows.append("<tr>" + "".join(cells) + "</tr>")
    classes = "nbk-table striped" if striped else "nbk-table"
    wrapper = "nbk-table-wrap scroll" if max_height else "nbk-table-wrap"
    style = f' style="--nbk-max-height:{int(max_height)}px"' if max_height else ""
    cap = f"<caption>{_escape(caption)}</caption>" if caption else ""
    markup = f'<div class="{wrapper}"{style}><table class="{classes}">{cap}<thead><tr>{head}</tr></thead><tbody>{"".join(body_rows)}</tbody></table></div>'
    return _out(markup, display_output)


def code(
    text: str, lang: str = "text", label: str | None = None, *, display_output: bool = True
) -> Fragment:
    source = str(text).rstrip("\n")
    if highlight:
        try:
            lexer = get_lexer_by_name(lang)
        except ClassNotFound:
            lexer = TextLexer()
        body = highlight(source, lexer, HtmlFormatter(nowrap=True))
    else:
        body = _escape(source)
    head = ""
    if label or lang != "text":
        head = f'<div class="nbk-code-head"><span>{_escape(label or "code")}</span><span>{_escape(lang)}</span></div>'
    return _out(f'<div class="nbk-code">{head}<pre>{body}</pre></div>', display_output)


def show(value: Any, label: str | None = None, *, display_output: bool = True) -> Fragment:
    text = json.dumps(value, indent=2, sort_keys=True, default=str, ensure_ascii=False)
    return code(text, "json", label, display_output=display_output)


def tree(root: str | Path, prefix: str = "", *, display_output: bool = True) -> Fragment:
    root = Path(root)
    files = [path for path in sorted(root.rglob("*")) if path.is_file()]
    files = [path for path in files if path.relative_to(root).as_posix().startswith(prefix)]
    lines = []
    for path in files:
        relative = path.relative_to(root)
        branch = "  " * (len(relative.parts) - 1) + "└─ "
        lines.append(f"{branch}{relative.name:<32} {path.stat().st_size:>8,} B")
    label = f'<div class="nbk-label">{_escape(root)} · {_escape(prefix or "/")}</div>'
    return _out(
        label + f'<div class="nbk-tree">{_escape(chr(10).join(lines) or "(empty)")}</div>',
        display_output,
    )


def panel(
    content: Any, *, title: str = "", subtitle: str = "", display_output: bool = True
) -> Fragment:
    head = ""
    if title:
        head = f'<h3 class="nbk-title">{_escape(title)}</h3>'
        head += f'<p class="nbk-subtitle">{_escape(subtitle)}</p>' if subtitle else ""
    return _out(
        f'<section class="nbk-panel nbk-pad">{head}{_fragment(content)}</section>', display_output
    )


PAIR_LEVELS = ("minimal", "typical", "advanced", "complex")

PAIR_EXAMPLES: dict[str, dict[str, Any]] = {
    "minimal": {
        "pairs": {
            "orders": {
                "left": {
                    "source": "oracle",
                    "conn_macro": "pcds",
                    "schema": "FINANCE",
                    "table": "ORDERS",
                    "date_col": "BUSINESS_DATE",
                    "date_type": "date",
                },
                "right": {
                    "source": "databricks",
                    "catalog": "main",
                    "schema": "finance",
                    "table": "orders",
                    "date_col": "business_date",
                    "date_type": "date",
                },
                "fromDate": "2026-09-01",
                "toDate": "2026-09-30",
                "col_map": {"ORDER_ID": "order_id", "AMOUNT": "amount", "STATUS": "status"},
            }
        }
    },
    "typical": {
        "pairs": {
            "accounts": {
                "left": {
                    "source": "oracle",
                    "conn_macro": "pcds",
                    "service": "PCDSPRD",
                    "schema": "OWNER",
                    "table": "ACCT_CURR",
                    "where": "STATUS <> 'X'",
                    "date_col": "EFF_DT",
                    "date_type": "date",
                },
                "right": {
                    "source": "databricks",
                    "table": "main.curated.accounts",
                    "where": "src_sys = 'ACCOUNTS'",
                    "date_col": "dw_bus_dt",
                    "date_type": "date",
                },
                "fromDate": "2026-07-01",
                "toDate": "2026-09-30",
                "vintage": "month",
                "key": "ACCT_ID",
                "key_families": {"ACCT_ID": "numeric"},
                "sample": 0.1,
                "col_map": {
                    "ACCT_ID": "acct_id",
                    "BRANCH_CD": "branch_cd",
                    "BALANCE": "balance",
                    "OPEN_DT": "open_dt",
                    "PRODUCT": "product",
                },
                "col_type_overrides": {"BRANCH_CD": "categorical"},
            }
        }
    },
    "advanced": {
        "pairs": {
            "card_txn": {
                "left": {
                    "source": "oracle",
                    "conn_macro": "edw",
                    "query": "SELECT t.*, c.CARD_TYPE FROM EDW.CARD_TXN t JOIN EDW.CARD c ON c.CARD_NO = t.CARD_NO",
                    "date_col": "POST_DT",
                    "date_type": "int",
                },
                "right": {
                    "source": "databricks",
                    "kind": "query",
                    "query": "SELECT * FROM main.cards.txn WHERE is_current",
                    "date_col": "post_dt",
                    "date_type": "int",
                },
                "fromDate": "2026-09-01",
                "toDate": "2026-09-30",
                "vintage": "week",
                "date_synonyms": {"3000-01-01": "2026-09-30"},
                "key": "CARD_NO,TXN_SEQ",
                "key_families": {"CARD_NO": "string", "TXN_SEQ": "numeric"},
                "sample": 500,
                "strict": True,
                "col_map": {
                    "CARD_NO": "card_no",
                    "TXN_SEQ": "txn_seq",
                    "TXN_AMT": "txn_amt",
                    "MCC": "mcc",
                    "CARD_TYPE": "card_type",
                    "AUTH_CD": "auth_cd",
                },
                "col_type_overrides": {"MCC": "categorical", "AUTH_CD": "categorical"},
            }
        }
    },
    "complex": {
        "connections": {
            "pcds": {"source": "oracle", "service": "PCDSPRD"},
            "edw": {"source": "oracle", "user_env": "EDW_USER", "password_env": "EDW_PASSWORD", "dsn_env": "EDW_DSN"},
            "curated": {"source": "databricks", "catalog": "main", "schema": "curated"},
        },
        "pairs": {
            "accounts": {
                "left": {"conn_macro": "pcds", "table": "OWNER.ACCT_CURR", "date_col": "EFF_DT", "date_type": "date"},
                "right": {"conn_macro": "curated", "table": "accounts", "date_col": "dw_bus_dt", "date_type": "date"},
                "fromDate": "2026-09-01",
                "toDate": "2026-09-30",
                "vintage": "month",
                "key": "ACCT_ID",
                "key_families": {"ACCT_ID": "numeric"},
                "sample": 0.05,
                "col_map": "maps/accounts.csv",
            },
            "claims": {
                "left": {
                    "source": "athena",
                    "database": "claims_raw",
                    "table": "claim_line",
                    "s3_staging_dir": "s3://<bucket>/athena-results/",
                    "region": "us-east-1",
                    "date_col": "svc_date",
                    "date_type": "string",
                },
                "right": {"conn_macro": "curated", "table": "claim_line", "date_col": "svc_date", "date_type": "string"},
                "fromDate": "2026-09-01",
                "toDate": "2026-09-14",
                "key": "claim_id,line_no",
                "key_families": {"claim_id": "string", "line_no": "numeric"},
                "sample": 200,
                "col_map": {"claim_id": "claim_id", "line_no": "line_no", "paid_amt": "paid_amt", "dx_code": "dx_code"},
            },
            "feeds": {
                "left": {
                    "source": "file",
                    "path": "C:/work/feeds/branch_*.csv",
                    "options": {"delim": "|", "header": True},
                    "date_col": "AS_OF",
                    "date_format": "%m/%d/%Y",
                },
                "right": {
                    "source": "databricks",
                    "kind": "files",
                    "path": "/Volumes/main/raw/feeds/branch/",
                    "format": "csv",
                    "options": {"sep": "|", "header": "true"},
                    "schema_hints": "AS_OF STRING, BALANCE DECIMAL(18,2)",
                    "query": "SELECT *, to_date(AS_OF, 'MM/dd/yyyy') AS as_of_day FROM {src}",
                    "date_col": "as_of_day",
                    "date_type": "date",
                },
                "fromDate": "2026-09-01",
                "toDate": "2026-09-30",
                "col_map": {"BRANCH_ID": "BRANCH_ID", "BALANCE": "BALANCE", "REGION": "REGION"},
                "col_type_overrides": {"BRANCH_ID": "categorical"},
            },
            "ledger_local": {
                "left": {
                    "source": "duckdb",
                    "path": "C:/work/ledger.duckdb",
                    "snapshot": True,
                    "table": "main.ledger",
                    "date_col": "post_date",
                    "date_type": "date",
                },
                "right": {"conn_macro": "curated", "table": "ledger", "date_col": "post_date", "date_type": "date"},
                "fromDate": "2026-09-01",
                "toDate": "2026-09-30",
                "key": "entry_id",
                "strict": True,
                "col_map": {"entry_id": "entry_id", "amount": "amount", "gl_acct": "gl_acct"},
            },
            "legacy_hive": {
                "skip": True,
                "left": {"source": "hadoop", "host": "hive.example.com", "table": "legacy.positions", "date_col": "dt"},
                "right": {"conn_macro": "curated", "table": "positions", "date_col": "dt"},
                "col_map": {"pos_id": "pos_id"},
            },
        },
    },
}

PAIR_COL_MAPS = {
    "complex": {
        "maps/accounts.csv": "left,right,type\n"
        "ACCT_ID,acct_id,\n"
        "BRANCH_CD,branch_cd,categorical\n"
        "BALANCE,balance,numeric\n"
        "OPEN_DT,open_dt,\n"
        "PRODUCT,product,categorical\n"
    }
}


# >>> a deep copy of one example config: minimal | typical | advanced | complex <<< #
def pair_example(level: str = "minimal") -> dict[str, Any]:
    if level not in PAIR_EXAMPLES:
        raise ValueError(f"level must be one of {', '.join(PAIR_LEVELS)}")
    return json.loads(json.dumps(PAIR_EXAMPLES[level]))


# >>> write pair.<level>.json (plus its col_map files) into folder; validated by load_config when dtrack_left is installed <<< #
def write_pair_examples(
    folder: str | Path = "pairs", levels: Sequence[str] = PAIR_LEVELS, *, validate: bool = True
) -> dict[str, Path]:
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    written = {}
    for level in levels:
        for relative, text in PAIR_COL_MAPS.get(level, {}).items():
            target = folder / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
        path = folder / f"pair.{level}.json"
        path.write_text(json.dumps(pair_example(level), indent=2) + "\n", encoding="utf-8")
        written[level] = path
    if validate:
        try:
            from dtrack_left.cli.config import load_config
        except ImportError:
            return written
        for path in written.values():
            load_config(path)
    return written


# >>> one table row per pair of every level: sources, kinds, sampling and the features each one exercises <<< #
def pair_overview(levels: Sequence[str] = PAIR_LEVELS, *, display_output: bool = True) -> Fragment:
    rows = []
    for level in levels:
        config = pair_example(level)
        profiles = config.get("connections") or {}
        for name, pair in config["pairs"].items():
            left, right = pair["left"], pair["right"]
            left_source = left.get("source") or profiles.get(left.get("conn_macro"), {}).get("source")
            features = [
                key
                for key in ("where", "query", "date_synonyms", "strict", "col_type_overrides", "skip")
                if key in pair or key in left or key in right
            ]
            if isinstance(pair["col_map"], str):
                features.append("col_map file")
            if left.get("conn_macro") in profiles or right.get("conn_macro") in profiles:
                features.append("connections")
            rows.append(
                {
                    "level": level,
                    "pair": name,
                    "left": left_source,
                    "right kind": right.get("kind", "table"),
                    "date_type": f"{left.get('date_type', '-')} / {right.get('date_type', '-')}",
                    "vintage": pair.get("vintage", "day"),
                    "key": pair.get("key", "-"),
                    "sample": pair.get("sample", "all"),
                    "features": ", ".join(features) or "-",
                }
            )
    return table(rows, caption="pair.<level>.json examples", display_output=display_output)


__all__ = [
    "CSS",
    "PAIR_EXAMPLES",
    "PAIR_LEVELS",
    "Fragment",
    "badge",
    "callout",
    "card",
    "code",
    "collapse",
    "details",
    "divider",
    "grid",
    "hero",
    "kv",
    "metric",
    "metrics",
    "pair_example",
    "pair_overview",
    "panel",
    "progress",
    "quote",
    "raw",
    "show",
    "steps",
    "table",
    "tree",
    "write_pair_examples",
]
