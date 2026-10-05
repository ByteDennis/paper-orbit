const { txt, label, cell, headerRow, rowBorders, chartBase, STATUS, M, W, TOP } = require("../common");

const theme = {
  name: "Ocean",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: { dk1: "14213D", lt1: "FFFFFF", dk2: "5C6B7A", lt2: "EDF3F8", accent1: "065A82", accent2: "1C7293", accent3: "21295C", accent4: "9EC5D8", accent5: "4B86A6", accent6: "E09F3E", hlink: "065A82", folHlink: "5C6B7A" },
};

const lines = [
  { name: "Net interest income", plan: "198.4", actual: "202.6", v: 4.2, pct: "+2.1%" },
  { name: "Card interchange & fees", plan: "31.0", actual: "29.9", v: -1.1, pct: "−3.5%" },
  { name: "Deposit service charges", plan: "12.6", actual: "12.2", v: -0.4, pct: "−3.2%" },
  { name: "Mortgage banking income", plan: "9.4", actual: "10.2", v: 0.8, pct: "+8.5%" },
  { name: "Total revenue", plan: "251.4", actual: "254.9", v: 3.5, pct: "+1.4%", total: true },
  { name: "Operating expense", plan: "(132.0)", actual: "(133.9)", v: -1.9, pct: "−1.4%" },
  { name: "Provision for credit losses", plan: "(11.6)", actual: "(12.2)", v: -0.6, pct: "−5.2%" },
  { name: "Pre-tax profit", plan: "107.8", actual: "108.8", v: 1.0, pct: "+0.9%", total: true },
];

const drivers = [
  "Volume: average deposits $0.9bn above plan and rate paid 2 bps better than modelled",
  "Fees: interchange volumes −3% on lower travel spend; the fee-waiver programme cost $0.3m",
  "Costs: $1.2m of severance pulled forward from Q4 — timing, not run-rate",
];

// >>> signed one-decimal string with a true minus sign <<< //
function signed(v) {
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1);
}

module.exports = {
  file: "07-plan-vs-actual.pptx",
  section: "Plan vs actual",
  theme,
  title: "September pre-tax profit landed $1.0m (0.9%) above plan: a deposit volume beat offset by costs and card fees",
  meta: "Plan vs actual, September 2026, $m  ·  Monthly finance review  ·  Source: Management P&L (illustrative)  ·  Favourable variance = positive",
  notes: "Plan-vs-actual variance. Left: one bar per P&L line, favourable variance positive, unfavourable negative, so the eye finds the problem lines at once. Right: the numbers behind the bars plus three drivers written as cause, not restatement. Costs and provisions are shown as negatives in the table to keep the arithmetic visible.",
  // >>> variance bar chart on the left, P&L table and drivers on the right <<< //
  build({ pres, slide, C, T }) {
    const chartItems = lines.filter((l) => !l.total || l.name === "Pre-tax profit");
    slide.addChart(pres.ChartType.bar, [{ name: "Variance to plan", labels: chartItems.map((l) => l.name), values: chartItems.map((l) => l.v) }], Object.assign(chartBase(T), {
      x: M, y: TOP, w: 6.5, h: 4.7,
      title: "Variance to plan by line, $m",
      barDir: "bar",
      barGapWidthPct: 60,
      chartColors: [STATUS.good],
      invertedColors: [STATUS.bad],
      catAxisOrientation: "maxMin",
      catAxisLabelPos: "low",
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFormatCode: "+0.0;-0.0;0.0",
      valAxisMinVal: -3,
      valAxisMaxVal: 5,
      valAxisMajorUnit: 1,
      valAxisLabelFormatCode: "+0;-0;0",
      catAxisLabelFontSize: 10,
    }));
    const tx = M + 6.5 + 0.35;
    const tw = W - M - tx;
    const body = lines.map((l) => [
      cell(l.name, { bold: !!l.total, color: T.colors.dk1 }),
      cell(l.plan, { align: "right", bold: !!l.total, color: T.colors.dk2 }),
      cell(l.actual, { align: "right", bold: !!l.total, color: T.colors.dk1 }),
      cell(signed(l.v), { align: "right", bold: true, color: l.v >= 0 ? STATUS.goodText : STATUS.badText }),
      cell(l.pct, { align: "right", bold: !!l.total, color: l.v >= 0 ? STATUS.goodText : STATUS.badText }),
    ]);
    slide.addTable([headerRow(["$m", "Plan", "Actual", "Var", "Var %"], { color: T.colors.dk2, aligns: ["left", "right", "right", "right", "right"] }), ...body], {
      x: tx, y: TOP, w: tw, colW: [2.33, 0.85, 0.85, 0.75, 0.8], rowH: 0.3,
      fontSize: 11, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });
    label(slide, "Drivers", { x: tx, y: TOP + 3.0, w: tw, h: 0.25, color: C.text2 });
    txt(slide, drivers.map((d, i) => ({ text: d, options: { bullet: { indent: 12 }, breakLine: i < drivers.length - 1, paraSpaceAfter: 4 } })), { x: tx, y: TOP + 3.3, w: tw, h: 1.6, fontSize: 12, color: C.text1 });
  },
};
