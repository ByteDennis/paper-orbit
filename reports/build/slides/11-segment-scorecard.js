const { txt, card, statusRuns, cell, headerRow, rowBorders, STATUS, M, CW, TOP } = require("../common");

const theme = {
  name: "Slate and Amber",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: { dk1: "1F2937", lt1: "FFFFFF", dk2: "4B5563", lt2: "F3F4F6", accent1: "0E7490", accent2: "B45309", accent3: "64748B", accent4: "CBD5E1", accent5: "155E75", accent6: "7C3AED", hlink: "0E7490", folHlink: "4B5563" },
};

const MARK = {
  u: { glyph: "▲", color: STATUS.goodText, tint: STATUS.goodTint },
  n: { glyph: "●", color: STATUS.neutral, tint: null },
  d: { glyph: "▼", color: STATUS.badText, tint: STATUS.badTint },
};

const OVERALL = {
  ok: { text: "On track", color: STATUS.good, tint: STATUS.goodTint },
  watch: { text: "Watch", color: STATUS.warn, tint: STATUS.warnTint },
  act: { text: "Action", color: STATUS.bad, tint: STATUS.badTint },
};

const products = [
  ["Checking", "21.4", ["+2.8%", "u"], ["+26.1", "u"], ["41", "u"], ["9.8% churn", "n"], ["71%", "u"], "ok"],
  ["Savings & CDs", "26.8", ["+6.9%", "u"], ["+18.4", "u"], ["38", "n"], ["7.1% churn", "u"], ["64%", "n"], "ok"],
  ["Credit cards", "6.2", ["+4.1%", "n"], ["+9.7", "n"], ["29", "d"], ["1.42% DPD", "d"], ["58%", "n"], "watch"],
  ["Mortgages", "19.8", ["+1.2%", "n"], ["+1.1", "n"], ["46", "u"], ["0.61% DPD", "u"], ["22%", "d"], "ok"],
  ["Auto loans", "3.9", ["−3.5%", "d"], ["−0.6", "d"], ["35", "n"], ["0.98% DPD", "n"], ["31%", "n"], "watch"],
  ["Personal loans", "1.7", ["+11.2%", "u"], ["+4.2", "u"], ["33", "n"], ["2.35% DPD", "d"], ["83%", "u"], "act"],
];

const highlights = [
  ["Deposits", "+$2.1bn YoY, 78% of it from savings; the $3.2bn of Q4 CD maturities is the retention test."],
  ["Credit cards", "Delinquency +18 bps QoQ and NPS −3; line-increase pause in place, collections hiring behind plan."],
  ["Personal loans", "Growth of 11% but 30+ DPD at 2.35% against a 1.90% target; tighten the DTI cut-off below 680 FICO."],
];

// >>> table cell showing a value with its direction marker and a performance tint <<< //
function metric([value, m], dk1) {
  const mk = MARK[m];
  const o = mk.tint ? { fill: { color: mk.tint } } : {};
  return cell([{ text: value + "  ", options: { color: dk1 } }, { text: mk.glyph, options: { color: mk.color, fontSize: 9 } }], Object.assign({ align: "right" }, o));
}

module.exports = {
  file: "11-segment-scorecard.pptx",
  section: "Segment scorecard",
  theme,
  title: "Product scorecard, September 2026: deposits and mortgages healthy; cards and personal loans flagged on credit",
  meta: "Six products × six measures vs target  ·  Monthly business review  ·  ▲ ahead of target   ● on target   ▼ behind  ·  Source: Product MI (illustrative)",
  notes: "Segment scorecard (heat table). One row per product, one column per measure, each cell carrying the value, a direction marker and a tint for ahead or behind target. The overall column is a word plus a colour. Three highlight cards below say what to do about the cells that are not green.",
  // >>> product × measure heat table, three highlight cards below <<< //
  build({ pres, slide, C, T }) {
    const body = products.map((p) => {
      const ov = OVERALL[p[7]];
      return [
        cell(p[0], { bold: true, color: T.colors.dk1 }),
        cell(p[1], { align: "right", color: T.colors.dk1 }),
        metric(p[2], T.colors.dk1), metric(p[3], T.colors.dk1), metric(p[4], T.colors.dk1), metric(p[5], T.colors.dk1), metric(p[6], T.colors.dk1),
        cell(statusRuns(ov.color, ov.text, T.colors.dk1), { fill: { color: ov.tint } }),
      ];
    });
    const heads = headerRow(["Product", "Balances $bn", "Growth YoY", "Net new customers, k", "NPS", "30+ DPD / churn", "Digital sales share", "Overall"], { color: T.colors.dk2, aligns: ["left", "right", "right", "right", "right", "right", "right", "left"] });
    slide.addTable([heads, ...body], {
      x: M, y: TOP, w: CW, colW: [1.9, 1.45, 1.45, 1.65, 1.05, 1.75, 1.6, 1.48], rowH: [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      fontSize: 12, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });
    const hy = TOP + 3.65;
    const hw = (CW - 0.5) / 3;
    highlights.forEach(([h, t], i) => {
      const x = M + i * (hw + 0.25);
      card(pres, slide, { x, y: hy, w: hw, h: 1.2, fill: { color: C.background2 } });
      txt(slide, h, { x: x + 0.2, y: hy + 0.12, w: hw - 0.4, h: 0.3, fontSize: 12, bold: true, color: C.accent1 });
      txt(slide, t, { x: x + 0.2, y: hy + 0.42, w: hw - 0.4, h: 0.7, fontSize: 11, color: C.text1 });
    });
  },
};
