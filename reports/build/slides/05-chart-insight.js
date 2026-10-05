const { txt, badge, label, chartBase, M, W, TOP } = require("../common");

const theme = {
  name: "Forest",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: "1C2B1D", lt1: "FFFFFF", dk2: "5F6F60", lt2: "F1F5EC", accent1: "238636", accent2: "97BC62", accent3: "2C5F2D", accent4: "C8DBB0", accent5: "3F7A40", accent6: "A96E2B", hlink: "238636", folHlink: "5F6F60" },
};

const quarters = ["Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"];
const digital = [61.2, 64.8, 67.5, 71.0, 74.3];
const branch = [24.1, 23.0, 22.4, 21.9, 21.4];

const takeaways = [
  "Digital share reached 78% in Q3 (72% a year ago); app logins per active customer are up 9%.",
  "Branch volumes fell 11% YoY while footfall-based staffing stayed flat — the consolidation case is stronger than when it was approved.",
  "Cash and cheque deposits are the remaining branch-only tasks; ITM upgrades in 22 sites would cover 85% of that volume.",
];

module.exports = {
  file: "05-chart-insight.pptx",
  section: "Chart-led insight",
  theme,
  title: "Digital now handles three of every four everyday transactions; branch volumes fell 11% in a year",
  meta: "Transaction channel mix, Q3 2025 – Q3 2026  ·  Monthly business review  ·  Source: Channel MI (illustrative)  ·  Transactions = payments, transfers, deposits",
  notes: "Chart-led insight (consulting style). One chart, one message. The series that carries the message is coloured; the comparison series is grey. Three takeaways on the right say what the chart means, not what it shows, and the last line names the next step.",
  // >>> one emphasised two-series chart on the left, three takeaways and a next step on the right <<< //
  build({ pres, slide, C, T }) {
    slide.addChart(pres.ChartType.bar, [
      { name: "Digital (app + web)", labels: quarters, values: digital },
      { name: "Branch", labels: quarters, values: branch },
    ], Object.assign(chartBase(T), {
      x: M, y: TOP, w: 7.6, h: 4.75,
      title: "Transactions per quarter, millions — digital share 72% → 78%",
      barDir: "col",
      barGrouping: "clustered",
      barGapWidthPct: 60,
      chartColors: [T.colors.accent1, "B0B7B0"],
      showLegend: true,
      legendPos: "b",
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0.0",
      valAxisMinVal: 0,
      valAxisMaxVal: 80,
      valAxisMajorUnit: 20,
    }));
    const rx = M + 7.6 + 0.35;
    const rw = W - M - rx;
    label(slide, "What this means", { x: rx, y: TOP, w: rw, h: 0.25, color: C.accent3 });
    takeaways.forEach((t, i) => {
      const y = TOP + 0.45 + i * 1.25;
      badge(pres, slide, String(i + 1), { x: rx, y, d: 0.4, fill: C.accent2, color: C.text1, fontSize: 13 });
      txt(slide, t, { x: rx + 0.55, y: y - 0.02, w: rw - 0.55, h: 1.1, fontSize: 13, color: C.text1 });
    });
    txt(slide, [
      { text: "Next step: ", options: { bold: true, color: C.accent3 } },
      { text: "bring the ITM business case to the November investment committee.", options: { color: C.text1 } },
    ], { x: rx, y: TOP + 4.3, w: rw, h: 0.5, fontSize: 13 });
  },
};
