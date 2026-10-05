const { txt, card, badge, label, M, W, TOP } = require("../common");

const theme = {
  name: "Midnight Executive",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: "1B1F3A", lt1: "FFFFFF", dk2: "5B6478", lt2: "EEF3FC", accent1: "1E2761", accent2: "CADCFC", accent3: "3E6BB5", accent4: "8FA8D8", accent5: "6B7A99", accent6: "C9A227", hlink: "1E2761", folHlink: "5B6478" },
};

const messages = [
  {
    head: "Deposits reached $48.2bn (+4.1% YoY), led by high-yield savings (+$1.6bn)",
    body: "Mix shift into savings lifted cost of funds by 12 bps QoQ. Checking balances held flat and there is no sign of outflow to brokerage after the September rate cut.",
  },
  {
    head: "Digital active customers hit 68% (+5 pts YoY); branch transactions fell 11%",
    body: "The 14-branch consolidation remains on plan for Q1 2027 with $11m of run-rate savings. Complaint volumes in the affected markets are inside tolerance.",
  },
  {
    head: "Card 30+ day delinquency rose to 1.42% (+18 bps QoQ), concentrated in the 2024 vintage",
    body: "Early-stage roll rates stabilised in September after line-increase tightening in July. Full-year charge-off guidance of 3.1% is unchanged but has no headroom left.",
  },
];

const asks = [
  { head: "Approve a 15 bps high-yield savings rate reduction effective 1 November", body: "Estimated +$9m annualised NII; modelled attrition below 0.5% of balances." },
  { head: "Endorse pausing automatic credit line increases for the 2024 card vintage", body: "Affects ~210k accounts; reduces projected 2027 losses by $4m." },
];

module.exports = {
  file: "01-executive-summary.pptx",
  section: "Executive summary",
  theme,
  title: "Q3 deposits grew 4.1% YoY despite two rate cuts; card delinquency is the one metric to watch",
  meta: "Q3 2026 business review  ·  Prepared for: Head of Consumer Banking  ·  Owner: Finance & Analytics  ·  5 October 2026",
  notes: "Executive summary (SCQA style). Title = the answer in one sentence. Three messages, each a headline with a number plus one or two lines of support. Right card = what you need from the reader, with a date. Keep to three messages; move anything else to an appendix.",
  // >>> three numbered key messages on the left, the ask card on the right <<< //
  build({ pres, slide, C }) {
    messages.forEach((m, i) => {
      const y = TOP + i * 1.62;
      badge(pres, slide, String(i + 1), { x: M, y: y + 0.03, d: 0.5, fill: C.accent1, color: C.background1, fontSize: 16 });
      txt(slide, m.head, { x: M + 0.75, y, w: 7.2, h: 0.55, fontSize: 16, bold: true, color: C.text1 });
      txt(slide, m.body, { x: M + 0.75, y: y + 0.58, w: 7.2, h: 0.9, fontSize: 14, color: C.text2 });
    });
    const cx = 8.85;
    const cw = W - M - cx;
    card(pres, slide, { x: cx, y: TOP, w: cw, h: 4.85, fill: { color: C.background2 } });
    label(slide, "What I need from you", { x: cx + 0.3, y: TOP + 0.25, w: cw - 0.6, h: 0.3, color: C.accent1 });
    asks.forEach((a, i) => {
      const y = TOP + 0.7 + i * 1.6;
      txt(slide, a.head, { x: cx + 0.3, y, w: cw - 0.6, h: 0.85, fontSize: 14, bold: true, color: C.text1 });
      txt(slide, a.body, { x: cx + 0.3, y: y + 0.85, w: cw - 0.6, h: 0.65, fontSize: 12, color: C.text2 });
    });
    txt(slide, "Decision needed by 15 October to meet the November pricing cycle.", { x: cx + 0.3, y: TOP + 4.0, w: cw - 0.6, h: 0.6, fontSize: 13, bold: true, color: C.accent1 });
  },
};
