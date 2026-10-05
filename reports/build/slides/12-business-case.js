const { txt, card, label, chartBase, M, W, CW, TOP } = require("../common");

const theme = {
  name: "Cherry",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: "1D1D1D", lt1: "FFFFFF", dk2: "5C5C5C", lt2: "FCF6F5", accent1: "990011", accent2: "2F3C7E", accent3: "C85A5A", accent4: "E8B4B8", accent5: "6B0B14", accent6: "3A7D44", hlink: "990011", folHlink: "5C5C5C" },
};

const tiles = [
  ["Investment", "$4.8m", "over 12 months"],
  ["Run-rate benefit", "$5.5m p.a.", "from month 13"],
  ["Payback", "19 months", "from project start"],
  ["3-year NPV", "$6.1m", "at a 9% hurdle rate"],
];

const quarters = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12"];
const cumulative = [-1.6, -3.0, -3.4, -3.1, -1.7, -0.4, 1.0, 2.4, 3.8, 5.2, 6.5, 7.9];

const sections = [
  ["Benefits ($5.5m run-rate)", [
    "Lower roll-to-loss: −10 bps charge-off rate on the $6.2bn card book — $3.1m",
    "Collector productivity +22% through automated early contact — $1.6m",
    "Fewer complaints and manual letters — $0.8m",
  ]],
  ["Key assumptions", [
    "Contact rate rises from 31% to 48% (vendor benchmark 52%)",
    "No change to regulatory contact-frequency limits",
  ]],
  ["Risks and mitigations", [
    "Vendor delivery slip → contractual penalties and a phased go-live",
    "Fairness → Compliance-approved scripts and a pre-launch conduct review",
  ]],
];

module.exports = {
  file: "12-business-case.pptx",
  section: "Business case",
  theme,
  title: "Proposal: automate early-stage card collections outreach — $4.8m investment, 19-month payback, $6.1m NPV",
  meta: "Business case one-pager  ·  Investment Committee pre-read  ·  Sponsor: Head of Consumer Banking  ·  Decision requested: Phase 1 funding by 31 October",
  notes: "Business case one-pager. Four headline numbers a committee asks for first, a cumulative cash-flow chart that shows break-even, then benefits with their arithmetic, the assumptions the case depends on, the risks with mitigations, and the precise decision requested.",
  // >>> four stat tiles, cumulative cash-flow chart, benefits / assumptions / risks, decision box <<< //
  build({ pres, slide, C, T }) {
    const tw = (CW - 0.75) / 4;
    tiles.forEach(([l, v, s], i) => {
      const x = M + i * (tw + 0.25);
      card(pres, slide, { x, y: TOP, w: tw, h: 1.15, fill: { color: C.background2 } });
      txt(slide, l, { x: x + 0.2, y: TOP + 0.1, w: tw - 0.4, h: 0.28, fontSize: 11, color: C.text2 });
      txt(slide, v, { x: x + 0.2, y: TOP + 0.36, w: tw - 0.4, h: 0.5, fontSize: 24, bold: true, color: C.accent1 });
      txt(slide, s, { x: x + 0.2, y: TOP + 0.84, w: tw - 0.4, h: 0.25, fontSize: 10, color: C.text2 });
    });
    const cy = TOP + 1.4;
    slide.addChart(pres.ChartType.bar, [{ name: "Cumulative net cash flow", labels: quarters, values: cumulative }], Object.assign(chartBase(T), {
      x: M, y: cy, w: 6.4, h: 3.45,
      title: "Cumulative net cash flow, $m — break-even in Q7",
      barDir: "col",
      barGapWidthPct: 60,
      chartColors: [T.colors.accent2],
      invertedColors: ["B8B8B8"],
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFormatCode: "+0.0;-0.0",
      valAxisMinVal: -4,
      valAxisMaxVal: 8,
      valAxisMajorUnit: 2,
    }));
    const rx = M + 6.4 + 0.35;
    const rw = W - M - rx;
    let y = cy;
    sections.forEach(([h, items]) => {
      label(slide, h, { x: rx, y, w: rw, h: 0.25, color: C.accent1 });
      const lines = items.length;
      txt(slide, items.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < lines - 1, paraSpaceAfter: 2 } })), { x: rx, y: y + 0.27, w: rw, h: lines * 0.22 + 0.05, fontSize: 11.5, color: C.text1 });
      y += 0.27 + lines * 0.22 + 0.17;
    });
    const dy = cy + 2.72;
    card(pres, slide, { x: rx, y: dy, w: rw, h: 0.78, fill: { color: C.background2 } });
    txt(slide, [
      { text: "Decision requested: ", options: { bold: true, color: C.accent1 } },
      { text: "approve Phase 1 funding of $1.9m (design and vendor selection) by 31 October; Phase 2 is subject to pilot results in February.", options: { color: C.text1 } },
    ], { x: rx + 0.2, y: dy + 0.08, w: rw - 0.4, h: 0.62, fontSize: 12, valign: "middle" });
  },
};
