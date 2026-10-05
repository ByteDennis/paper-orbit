const { txt, card, label, cell, headerRow, rowBorders, STATUS, M, W, TOP } = require("../common");

const theme = {
  name: "Berry",
  headFontFace: "Century Schoolbook",
  bodyFontFace: "Calibri",
  colors: { dk1: "2B1A22", lt1: "FFFFFF", dk2: "6E5B63", lt2: "F6EFEA", accent1: "6D2E46", accent2: "A26769", accent3: "C9A3A5", accent4: "E3CFC7", accent5: "8A4A5E", accent6: "3E5C76", hlink: "6D2E46", folHlink: "6E5B63" },
};

const situation = "The Fed cut rates by 25 bps on 17 September. Three of our five closest competitors have already lowered high-yield savings (HYS) rates by 20–25 bps; two have held. Our HYS book is $14.8bn at 4.10% and produced roughly 60% of deposit growth over the last 18 months.";

const why = [
  "Every 10 bps on HYS is worth about $15m of annualised net interest income",
  "HYS customers are 2.3× more rate-sensitive than core savers",
  "Pricing changes take 10 business days to implement and 30 days' notice",
];

const criteria = [
  ["12-month NII impact", "+$37m", "+$22m", "$0"],
  ["Modelled balance attrition", "1.8% (≈$270m)", "0.6% (≈$90m)", "None"],
  ["Competitive position", "Bottom quartile on rate", "Mid-market", "Top quartile, costly"],
  ["Customer and conduct risk", "Medium: visible cut, complaint uptick likely", "Low", "Low"],
  ["Reversibility", "Hard to re-raise later", "Flexible: second step in December if needed", "Flexible"],
];

module.exports = {
  file: "04-decision-memo.pptx",
  section: "Decision memo",
  theme,
  title: "Decision required: pass through 15 of the 25 bps Fed cut to high-yield savings, not the full amount",
  meta: "Decision memo  ·  Pricing Committee pre-read  ·  Decision owner: Head of Consumer Banking  ·  Required by: 15 October 2026",
  notes: "Decision memo. Left: situation in four lines, why it matters in three bullets, the deadline. Right: options compared on the same criteria, recommended option tinted. Bottom: recommendation in one sentence plus the exact asks. The title states the recommendation so a reader who stops there still knows what you want.",
  // >>> situation and deadline on the left, options table and recommendation on the right <<< //
  build({ pres, slide, C, T }) {
    const lw = 3.9;
    label(slide, "Situation", { x: M, y: TOP, w: lw, h: 0.25, color: C.accent1 });
    txt(slide, situation, { x: M, y: TOP + 0.3, w: lw, h: 1.45, fontSize: 13, color: C.text1 });
    label(slide, "Why it matters", { x: M, y: TOP + 1.85, w: lw, h: 0.25, color: C.accent1 });
    txt(slide, why.map((w, i) => ({ text: w, options: { bullet: { indent: 12 }, breakLine: i < why.length - 1, paraSpaceAfter: 4 } })), { x: M, y: TOP + 2.15, w: lw, h: 1.45, fontSize: 12, color: C.text1 });
    card(pres, slide, { x: M, y: TOP + 3.75, w: lw, h: 1.1, fill: { color: C.background2 } });
    label(slide, "Decision needed by", { x: M + 0.25, y: TOP + 3.9, w: lw - 0.5, h: 0.25, color: C.text2 });
    txt(slide, "15 October 2026", { x: M + 0.25, y: TOP + 4.15, w: lw - 0.5, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
    txt(slide, "Pricing Committee, agenda item 2", { x: M + 0.25, y: TOP + 4.55, w: lw - 0.5, h: 0.25, fontSize: 11, color: C.text2 });

    const tx = M + lw + 0.35;
    const tw = W - M - tx;
    const rec = { fill: { color: T.colors.lt2 } };
    const head = [
      cell("CRITERIA", { bold: true, fontSize: 9, charSpacing: 1, color: T.colors.dk2, valign: "bottom" }),
      cell("A · Match market (−25 bps)", { bold: true, fontSize: 11, color: T.colors.dk1, valign: "bottom" }),
      cell([{ text: "B · Partial pass-through (−15 bps)", options: { bold: true, color: T.colors.dk1 } }, { text: "\nRECOMMENDED", options: { bold: true, fontSize: 9, charSpacing: 1, color: T.colors.accent1 } }], Object.assign({ fontSize: 11, valign: "bottom" }, rec)),
      cell("C · Hold (0 bps)", { bold: true, fontSize: 11, color: T.colors.dk1, valign: "bottom" }),
    ];
    const body = criteria.map((r) => [
      cell(r[0], { bold: true, color: T.colors.dk1 }),
      cell(r[1], { color: T.colors.dk2 }),
      cell(r[2], Object.assign({ color: T.colors.dk1 }, rec)),
      cell(r[3], { color: T.colors.dk2 }),
    ]);
    body.push([
      cell("Assessment", { bold: true, color: T.colors.dk1 }),
      cell("○  Not recommended", { color: T.colors.dk2 }),
      cell([{ text: "●  ", options: { color: STATUS.good } }, { text: "Recommended", options: { bold: true, color: T.colors.dk1 } }], rec),
      cell("○  Not recommended", { color: T.colors.dk2 }),
    ]);
    slide.addTable([head, ...body], {
      x: tx, y: TOP, w: tw, colW: [1.95, 2.0, 2.13, 2.0], rowH: [0.6, 0.48, 0.48, 0.48, 0.5, 0.5, 0.42],
      fontSize: 11, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });

    const ry = TOP + 3.75;
    card(pres, slide, { x: tx, y: ry, w: tw, h: 1.1, fill: { color: C.background2 } });
    txt(slide, [
      { text: "Recommendation — Option B: reduce HYS to 3.95% effective 1 November and review in December. ", options: { bold: true, color: C.accent1 } },
      { text: "Captures ~60% of the available NII while keeping attrition inside tolerance and preserving a second step. Asks: (1) approve Option B; (2) approve the 30-day customer notice; (3) agree the December review trigger — attrition above 1% or a competitor move above 20 bps.", options: { color: C.text1 } },
    ], { x: tx + 0.25, y: ry + 0.12, w: tw - 0.5, h: 0.9, fontSize: 12, valign: "middle" });
  },
};
