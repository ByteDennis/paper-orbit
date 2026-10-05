const path = require("path");
const pptxgen = require("pptxgenjs");

const SKILL_DIR = process.env.PPTX_SKILL_DIR || "/home/dalab2/.claude/skills/synced/1ad1e4b3-bf48-4580-8400-27bfdcb84c34_3d5be4fc-82e3-4996-b7e7-f0d315ee9119/pptx";
const { applyTheme } = require(path.join(SKILL_DIR, "scripts", "apply_theme.js"));

const W = 13.333;
const H = 7.5;
const M = 0.5;
const CW = W - 2 * M;
const TOP = 1.95;
const BOTTOM = 6.95;
const GRID = "E1E0D9";
const AXIS = "C3C2B7";
const FOOTER = "All figures are illustrative and for template use only  ·  Consumer Banking  ·  Replace with actuals before distribution";
const STATUS = {
  good: "0CA30C",
  goodText: "006300",
  goodTint: "E6F4EA",
  warn: "FAB219",
  warnText: "8A5A00",
  warnTint: "FFF3D6",
  bad: "D03B3B",
  badText: "B3261E",
  badTint: "FDECEA",
  neutral: "898781",
  neutralTint: "F0EFEC",
};

// >>> create a one-slide wide deck with theme fonts, the ONE_PAGER layout and the footer <<< //
function makeDeck(spec) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: spec.theme.headFontFace, bodyFontFace: spec.theme.bodyFontFace };
  pres.title = spec.title;
  pres.subject = "One-slide manager report template";
  pres.author = "Consumer Banking";
  pres.company = "Consumer Banking";
  const C = pres.SchemeColor;
  pres.defineSlideMaster({
    title: "ONE_PAGER",
    background: { color: spec.theme.colors.lt1 },
    margin: [M, M, M, M],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: CW, h: 1.0, fontSize: 28, bold: true, color: C.text1, align: "left", valign: "bottom", margin: 0 }, text: "Action title: the one sentence you want remembered" } },
      { placeholder: { options: { name: "meta", type: "body", x: M, y: 1.4, w: CW, h: 0.35, fontSize: 12, color: C.text2, align: "left", valign: "top", margin: 0 }, text: "Period · audience · owner · date" } },
      { text: { text: FOOTER, options: { x: M, y: H - 0.45, w: CW, h: 0.28, fontSize: 10, color: C.text2, align: "left", valign: "middle", margin: 0, isTextBox: true } } },
    ],
  });
  pres.addSection({ title: spec.section });
  const slide = pres.addSlide({ masterName: "ONE_PAGER", sectionTitle: spec.section });
  slide.addText(spec.title, { placeholder: "title" });
  slide.addText(spec.meta, { placeholder: "meta" });
  if (spec.notes) slide.addNotes(spec.notes);
  return { pres, slide, C };
}

// >>> build one spec into reports/<file> and write the theme colours into it <<< //
async function buildSpec(spec, outDir) {
  const { pres, slide, C } = makeDeck(spec);
  spec.build({ pres, slide, C, T: spec.theme });
  const out = path.join(outDir, spec.file);
  await pres.writeFile({ fileName: out });
  await applyTheme(out, spec.theme);
  return out;
}

// >>> text box with zero inset <<< //
function txt(slide, text, o) {
  slide.addText(text, Object.assign({ margin: 0, isTextBox: true, valign: "top", align: "left" }, o));
}

// >>> filled rounded card with no outline <<< //
function card(pres, slide, o) {
  slide.addShape(pres.ShapeType.roundRect, Object.assign({ rectRadius: 0.08 }, o));
}

// >>> plain rectangle <<< //
function rect(pres, slide, o) {
  slide.addShape(pres.ShapeType.rect, o);
}

// >>> straight line between two points <<< //
function line(pres, slide, x1, y1, x2, y2, o) {
  slide.addShape(pres.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: Object.assign({ color: GRID, width: 0.75 }, o) });
}

// >>> circle with a short label centred inside <<< //
function badge(pres, slide, label, o) {
  slide.addShape(pres.ShapeType.ellipse, { x: o.x, y: o.y, w: o.d, h: o.d, fill: { color: o.fill }, line: o.line || { color: o.fill, width: 0 } });
  txt(slide, label, { x: o.x, y: o.y, w: o.d, h: o.d, fontSize: o.fontSize || 12, bold: true, color: o.color, align: "center", valign: "middle" });
}

// >>> small coloured dot shape <<< //
function dot(pres, slide, x, y, d, color) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 } });
}

// >>> text runs: coloured dot glyph followed by its label <<< //
function statusRuns(color, label, textColor) {
  return [{ text: "● ", options: { color, bold: true } }, { text: label, options: { color: textColor } }];
}

// >>> text runs: coloured arrow glyph followed by a label <<< //
function deltaRuns(glyph, color, label, textColor) {
  return [{ text: glyph + " ", options: { color, bold: true } }, { text: label, options: { color: textColor } }];
}

// >>> small uppercase section label <<< //
function label(slide, text, o) {
  txt(slide, text.toUpperCase(), Object.assign({ fontSize: 10, bold: true, charSpacing: 2 }, o));
}

// >>> small rounded pill with centred text <<< //
function pill(pres, slide, text, o) {
  slide.addShape(pres.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.h / 2, fill: { color: o.fill }, line: { color: o.fill, width: 0 } });
  txt(slide, text, { x: o.x, y: o.y, w: o.w, h: o.h, fontSize: o.fontSize || 9, bold: true, color: o.color, align: "center", valign: "middle" });
}

// >>> horizontal progress bar: track plus filled portion <<< //
function progress(pres, slide, o) {
  slide.addShape(pres.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.h / 2, fill: { color: o.track }, line: { color: o.track, width: 0 } });
  const fw = Math.max(o.h, o.w * Math.min(o.pct, 100) / 100);
  slide.addShape(pres.ShapeType.roundRect, { x: o.x, y: o.y, w: fw, h: o.h, rectRadius: o.h / 2, fill: { color: o.fill }, line: { color: o.fill, width: 0 } });
}

// >>> fresh soft shadow object for cards <<< //
function shadow() {
  return { type: "outer", blur: 6, offset: 2, angle: 90, color: "000000", opacity: 0.1 };
}

// >>> table cell with per-cell overrides <<< //
function cell(text, o) {
  return { text, options: Object.assign({ valign: "middle", margin: [0.04, 0.08, 0.04, 0.08] }, o || {}) };
}

// >>> header row cells: small uppercase labels on a tinted band <<< //
function headerRow(labels, o) {
  return labels.map((t, i) => cell(t.toUpperCase(), Object.assign({ bold: true, fontSize: 9, charSpacing: 1, valign: "bottom" }, o, o.aligns ? { align: o.aligns[i] } : {})));
}

// >>> hairline horizontal borders only <<< //
function rowBorders(color) {
  const c = color || GRID;
  return [{ type: "solid", pt: 0.5, color: c }, { type: "none" }, { type: "solid", pt: 0.5, color: c }, { type: "none" }];
}

// >>> quiet chart chrome shared by every native chart <<< //
function chartBase(T) {
  return {
    catAxisLabelColor: T.colors.dk2,
    valAxisLabelColor: T.colors.dk2,
    catAxisLabelFontFace: "+mn-lt",
    valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    dataLabelFontFace: "+mn-lt",
    dataLabelFontSize: 10,
    dataLabelColor: T.colors.dk2,
    titleFontFace: "+mn-lt",
    titleFontSize: 11,
    titleColor: T.colors.dk1,
    titleAlign: "left",
    legendFontFace: "+mn-lt",
    legendFontSize: 10,
    legendColor: T.colors.dk2,
    valGridLine: { color: GRID, size: 0.5 },
    catGridLine: { style: "none" },
    valAxisLineShow: false,
    catAxisLineShow: true,
    catAxisLineColor: AXIS,
    showLegend: false,
    showTitle: true,
  };
}

module.exports = { W, H, M, CW, TOP, BOTTOM, GRID, AXIS, STATUS, makeDeck, buildSpec, txt, card, rect, line, badge, dot, statusRuns, deltaRuns, label, pill, progress, shadow, cell, headerRow, rowBorders, chartBase };
