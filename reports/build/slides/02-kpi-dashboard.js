const { txt, card, deltaRuns, chartBase, STATUS, M, CW, TOP } = require("../common");

const theme = {
  name: "Teal Trust",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: { dk1: "102A2B", lt1: "FFFFFF", dk2: "5A7273", lt2: "EAF6F5", accent1: "028090", accent2: "00A896", accent3: "02C39A", accent4: "05668D", accent5: "7FB7BE", accent6: "F0A202", hlink: "028090", folHlink: "5A7273" },
};

const tiles = [
  { label: "Total deposits", value: "$48.2bn", glyph: "▲", delta: "1.1% vs Aug", good: true },
  { label: "Consumer loans", value: "$31.6bn", glyph: "▲", delta: "0.6% vs Aug", good: true },
  { label: "Net interest margin", value: "3.18%", glyph: "▼", delta: "3 bps vs Aug", good: false },
  { label: "Cost-to-income", value: "58.4%", glyph: "▼", delta: "0.9 pts vs Aug", good: true },
  { label: "Digital active customers", value: "68%", glyph: "▲", delta: "1 pt vs Aug", good: true },
  { label: "Card 30+ DPD", value: "1.42%", glyph: "▲", delta: "6 bps vs Aug", good: false },
];

const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const deposits = [46.3, 46.5, 46.9, 47.0, 47.2, 47.1, 47.4, 47.6, 47.5, 47.8, 47.7, 48.2];
const accounts = [18.2, 16.9, 21.4, 19.8, 20.6, 22.1, 23.4, 21.9, 24.0, 25.2, 23.7, 26.1];

module.exports = {
  file: "02-kpi-dashboard.pptx",
  section: "KPI dashboard",
  theme,
  title: "Consumer Banking scorecard — September 2026",
  meta: "Month-end view vs August  ·  Prepared for: Head of Consumer Banking  ·  Source: Finance MI (illustrative)  ·  Colour = good / bad, not up / down",
  notes: "KPI dashboard. Six tiles, two trend charts, one so-what line. Tile colour shows whether the move is good or bad for the business, never simply up or down (a falling cost ratio is green). Keep the charts to one series each; the title of the chart carries the latest value so nothing needs a label on every point.",
  // >>> six KPI tiles, two single-series trend charts, one so-what line <<< //
  build({ pres, slide, C, T }) {
    const gap = 0.25;
    const tw = (CW - gap * 5) / 6;
    tiles.forEach((t, i) => {
      const x = M + i * (tw + gap);
      card(pres, slide, { x, y: TOP, w: tw, h: 1.35, fill: { color: C.background2 } });
      txt(slide, t.label, { x: x + 0.15, y: TOP + 0.12, w: tw - 0.3, h: 0.3, fontSize: 11, color: C.text2 });
      txt(slide, t.value, { x: x + 0.15, y: TOP + 0.42, w: tw - 0.3, h: 0.5, fontSize: 24, bold: true, color: C.text1 });
      txt(slide, deltaRuns(t.glyph, t.good ? STATUS.goodText : STATUS.badText, t.delta, T.colors.dk2), { x: x + 0.15, y: TOP + 0.95, w: tw - 0.3, h: 0.3, fontSize: 11 });
    });
    const cy = TOP + 1.6;
    const ch = 2.7;
    const cw = (CW - 0.33) / 2;
    slide.addChart(pres.ChartType.line, [{ name: "Total deposits", labels: months, values: deposits }], Object.assign(chartBase(T), {
      x: M, y: cy, w: cw, h: ch,
      title: "Total deposits, $bn — Sep: 48.2 (+4.1% YoY)",
      chartColors: [T.colors.accent1],
      lineSize: 2,
      lineDataSymbol: "none",
      valAxisMinVal: 45,
      valAxisMaxVal: 49,
      valAxisMajorUnit: 1,
      valAxisLabelFormatCode: "0.0",
    }));
    slide.addChart(pres.ChartType.bar, [{ name: "Net new checking accounts", labels: months, values: accounts }], Object.assign(chartBase(T), {
      x: M + cw + 0.33, y: cy, w: cw, h: ch,
      title: "Net new checking accounts, thousands — Sep: 26.1 (12-month high)",
      barDir: "col",
      barGapWidthPct: 70,
      chartColors: [T.colors.accent1],
      valAxisMinVal: 0,
      valAxisMaxVal: 30,
      valAxisMajorUnit: 10,
    }));
    txt(slide, [
      { text: "So what: ", options: { bold: true, color: C.accent1 } },
      { text: "balance growth is intact and acquisition is at a 12-month high; margin compression (−3 bps) and card delinquency (+6 bps) are the two items for discussion.", options: { color: C.text1 } },
    ], { x: M, y: cy + ch + 0.15, w: CW, h: 0.55, fontSize: 14 });
  },
};
