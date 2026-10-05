const { txt, label, cell, headerRow, rowBorders, chartBase, STATUS, M, W, TOP } = require("../common");

const theme = {
  name: "Coral",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: { dk1: "1F2340", lt1: "FFFFFF", dk2: "5F6480", lt2: "FFF1F0", accent1: "2F3C7E", accent2: "F96167", accent3: "F9E795", accent4: "8C94C9", accent5: "C94A50", accent6: "3F8F7B", hlink: "2F3C7E", folHlink: "5F6480" },
};

const stages = ["Landing page visits", "Application started", "Identity verified", "Application submitted", "Approved", "Funded (first deposit)"];
const values = [412.0, 96.3, 51.2, 38.9, 32.1, 29.8];

const steps = [
  ["Visit → Start", "23.4%", "20–25%", "In range", "ok"],
  ["Start → ID verified", "53.2%", "70%+", "−17 pts", "bad"],
  ["ID verified → Submitted", "76.0%", "80%", "−4 pts", "warn"],
  ["Submitted → Approved", "82.5%", "80–85%", "In range", "ok"],
  ["Approved → Funded", "92.8%", "90%", "In range", "ok"],
  ["Start → Funded (end to end)", "30.9%", "45%", "−14 pts", "bad"],
];

const GAP = { ok: STATUS.goodText, warn: STATUS.warnText, bad: STATUS.badText };

const actions = [
  "Ship in-app document capture with live guidance (November)",
  "Add save-and-resume with an SMS link (October)",
  "Expected uplift: +6.1k funded accounts a month at current traffic",
];

module.exports = {
  file: "10-customer-funnel.pptx",
  section: "Customer funnel",
  theme,
  title: "Digital account opening converts 31% of started applications to funded accounts; identity verification is the biggest leak",
  meta: "Digital checking acquisition funnel, September 2026  ·  Monthly growth review  ·  Source: Digital analytics (illustrative)",
  notes: "Customer funnel. Left: one bar per stage, same colour, values labelled. Right: step-by-step conversion against benchmark, with the weakest step highlighted. Below: where the leak is in one sentence, then the actions with dates and the expected uplift.",
  // >>> funnel bar chart on the left, conversion table, leak diagnosis and actions on the right <<< //
  build({ pres, slide, C, T }) {
    slide.addChart(pres.ChartType.bar, [{ name: "Customers", labels: stages, values }], Object.assign(chartBase(T), {
      x: M, y: TOP, w: 6.9, h: 4.6,
      title: "Customers at each stage, thousands — September 2026",
      barDir: "bar",
      barGapWidthPct: 45,
      chartColors: [T.colors.accent1],
      catAxisOrientation: "maxMin",
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFormatCode: '#,##0.0"k"',
      valAxisMinVal: 0,
      valAxisMaxVal: 450,
      valAxisMajorUnit: 100,
      valAxisLabelFormatCode: '0"k"',
    }));
    const tx = M + 6.9 + 0.35;
    const tw = W - M - tx;
    const body = steps.map((s) => {
      const hot = s[4] === "bad" && s[0].startsWith("Start → ID");
      const fill = hot ? { fill: { color: STATUS.badTint } } : {};
      return [
        cell(s[0], Object.assign({ bold: hot, color: T.colors.dk1 }, fill)),
        cell(s[1], Object.assign({ align: "right", bold: hot, color: T.colors.dk1 }, fill)),
        cell(s[2], Object.assign({ align: "right", color: T.colors.dk2 }, fill)),
        cell(s[3], Object.assign({ align: "right", bold: true, color: GAP[s[4]] }, fill)),
      ];
    });
    slide.addTable([headerRow(["Step", "Conversion", "Benchmark", "Gap"], { color: T.colors.dk2, aligns: ["left", "right", "right", "right"] }), ...body], {
      x: tx, y: TOP, w: tw, colW: [2.1, 0.95, 1.0, tw - 4.05], rowH: [0.3, 0.37, 0.37, 0.37, 0.37, 0.37, 0.37],
      fontSize: 11, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });
    label(slide, "Where the leak is", { x: tx, y: TOP + 2.75, w: tw, h: 0.25, color: C.accent2 });
    txt(slide, "47% of applicants drop at identity verification; 61% of those fail document photo capture on the first attempt, with Android failing at twice the iOS rate.", { x: tx, y: TOP + 3.02, w: tw, h: 0.85, fontSize: 12, color: C.text1 });
    label(slide, "Actions", { x: tx, y: TOP + 3.9, w: tw, h: 0.25, color: C.accent2 });
    txt(slide, actions.map((a, i) => ({ text: a, options: { bullet: { indent: 12 }, breakLine: i < actions.length - 1, paraSpaceAfter: 3 } })), { x: tx, y: TOP + 4.17, w: tw, h: 0.85, fontSize: 12, color: C.text1 });
  },
};
