const { txt, card, label, pill, progress, STATUS, M, CW, TOP } = require("../common");

const theme = {
  name: "Indigo",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: { dk1: "111827", lt1: "FFFFFF", dk2: "6B7280", lt2: "EEF2FF", accent1: "4F46E5", accent2: "818CF8", accent3: "C7D2FE", accent4: "A5B4FC", accent5: "3730A3", accent6: "F59E0B", hlink: "4F46E5", folHlink: "6B7280" },
};

const CONF = {
  achieved: ["Achieved", STATUS.goodTint, STATUS.goodText],
  ontrack: ["On track", STATUS.goodTint, STATUS.goodText],
  atrisk: ["At risk", STATUS.warnTint, STATUS.warnText],
  offtrack: ["Off track", STATUS.badTint, STATUS.badText],
};

const objectives = [
  { id: "O1", text: "Grow primary relationships profitably", krs: [
    ["Net new primary checking customers", "212k of 240k target", 88, "ontrack"],
    ["Deposit growth year on year", "4.1% vs 4.0% target", 100, "achieved"],
    ["Cost of funds at or below 2.10%", "2.18% at quarter end", 60, "atrisk"],
  ] },
  { id: "O2", text: "Make digital the default channel", krs: [
    ["Digital active customers", "68% vs 70% target", 97, "ontrack"],
    ["Digital share of sales", "54% vs 55% target", 98, "ontrack"],
    ["App store rating at or above 4.6", "4.5 on both stores", 80, "atrisk"],
  ] },
  { id: "O3", text: "Keep credit quality inside appetite", krs: [
    ["Card 30+ day delinquency at or below 1.25%", "1.42% at quarter end", 35, "offtrack"],
    ["Collections contact rate at or above 45%", "31%; dialer not yet live", 45, "offtrack"],
    ["Full-year charge-offs at or below 3.1%", "tracking 3.1%, no headroom", 75, "atrisk"],
  ] },
];

module.exports = {
  file: "14-okr-scorecard.pptx",
  section: "OKR scorecard",
  theme,
  title: "Q3 OKR scorecard: two of three objectives on track; card-risk key results are behind and need a Q4 reset",
  meta: "Q3 2026 quarter-end  ·  Consumer Banking leadership team  ·  Bar = progress to target  ·  Pill = confidence of hitting target by year-end",
  notes: "OKR scorecard. One column per objective, three key results each, with a progress bar and a confidence pill that carries a word as well as a colour. The bottom line is the change you want agreed, with a date.",
  // >>> three objective columns with key results, progress bars and confidence pills; reset line below <<< //
  build({ pres, slide, C, T }) {
    const cw = (CW - 0.5) / 3;
    objectives.forEach((o, i) => {
      const x = M + i * (cw + 0.25);
      card(pres, slide, { x, y: TOP, w: cw, h: 0.95, fill: { color: C.background2 } });
      label(slide, o.id + " · Objective", { x: x + 0.2, y: TOP + 0.12, w: cw - 0.4, h: 0.25, color: C.accent1 });
      txt(slide, o.text, { x: x + 0.2, y: TOP + 0.38, w: cw - 0.4, h: 0.5, fontSize: 14, bold: true, color: C.text1 });
      o.krs.forEach(([kr, val, pct, conf], j) => {
        const y = TOP + 1.15 + j * 1.1;
        txt(slide, "KR" + (j + 1) + "  " + kr, { x, y, w: cw, h: 0.45, fontSize: 11, bold: true, color: C.text1 });
        progress(pres, slide, { x, y: y + 0.5, w: cw, h: 0.12, pct, track: "E5E7EB", fill: T.colors.accent1 });
        txt(slide, val + "  ·  " + pct + "%", { x, y: y + 0.68, w: cw - 1.1, h: 0.26, fontSize: 10.5, color: C.text2, valign: "middle" });
        pill(pres, slide, CONF[conf][0], { x: x + cw - 1.0, y: y + 0.68, w: 1.0, h: 0.26, fill: CONF[conf][1], color: CONF[conf][2] });
      });
    });
    txt(slide, [
      { text: "Q4 reset proposed: ", options: { bold: true, color: C.accent1 } },
      { text: "re-baseline O3-KR2 to 40% pending the dialer contract and add a KR on 2024-vintage line management — decision at the 12 October leadership meeting.", options: { color: C.text1 } },
    ], { x: M, y: TOP + 4.5, w: CW, h: 0.45, fontSize: 12 });
  },
};
