const { txt, rect, badge, label, deltaRuns, cell, headerRow, rowBorders, STATUS, M, W, TOP } = require("../common");

const theme = {
  name: "Terracotta",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: "2B211F", lt1: "FFFFFF", dk2: "6B5E5A", lt2: "F4F1EA", accent1: "B85042", accent2: "E7E8D1", accent3: "A7BEAE", accent4: "D9897C", accent5: "7A4A42", accent6: "5B7B6B", hlink: "B85042", folHlink: "6B5E5A" },
};

const RAMP = { 2: "F9EEEB", 3: "F1D7D0", 4: "E4B1A5", 5: "D48878", 6: "B85042" };
const LEVELS = ["Low", "Medium", "High"];

const risks = [
  { l: 3, i: 3, text: "Card delinquency deteriorating in the 2024 vintage", owner: "Chief Credit Officer", action: "Line increases paused; collections capacity +40 FTE by December", trend: "up" },
  { l: 2, i: 3, text: "Deposit outflow to money-market funds and brokerage", owner: "Head of Deposits", action: "Rate-match playbook; retention offers for balances over $250k", trend: "flat" },
  { l: 2, i: 3, text: "Core deposits migration cutover slips past Q4", owner: "CIO, Consumer", action: "Second dress rehearsal 17 Oct; go / no-go decision 24 Oct", trend: "up" },
  { l: 3, i: 2, text: "Authorised push payment fraud losses above budget", owner: "Head of Fraud", action: "Confirmation-of-payee live in November; limits on new payees", trend: "flat" },
  { l: 2, i: 2, text: "Overdraft fee rule change reduces fee income", owner: "Head of Products", action: "Grace-period product designed; $18m revenue at risk sized", trend: "flat" },
  { l: 1, i: 2, text: "Attrition of key staff in collections", owner: "Head of Operations", action: "Retention awards approved; cross-training plan in place", trend: "down" },
];

const TREND = {
  up: ["▲", STATUS.badText, "Rising"],
  flat: ["►", "6B5E5A", "Stable"],
  down: ["▼", STATUS.goodText, "Falling"],
};

module.exports = {
  file: "08-risk-heatmap.pptx",
  section: "Risk heat map",
  theme,
  title: "Top risks to the Consumer Banking plan: two are rated high and need executive attention this quarter",
  meta: "Risk register extract, Q4 2026  ·  Quarterly risk review  ·  Owner: Business Risk & Controls  ·  Reviewed with second line",
  notes: "Risk heat map. Left: likelihood × impact grid, one hue, darker = more severe, numbered markers. Right: the register behind the numbers with owner, mitigation and trend versus last quarter. The title says how many risks are high and what you want the reader to do about them.",
  // >>> 3×3 likelihood-impact grid on the left, risk register table on the right <<< //
  build({ pres, slide, C, T }) {
    const gx = M + 0.85;
    const gy = TOP + 0.35;
    const cwid = 1.3;
    const chei = 1.2;
    label(slide, "Likelihood", { x: M, y: TOP, w: 2.5, h: 0.25, color: C.text2 });
    for (let r = 0; r < 3; r++) {
      const lik = 3 - r;
      txt(slide, LEVELS[lik - 1], { x: M, y: gy + r * chei, w: 0.75, h: chei, fontSize: 10, color: C.text2, align: "right", valign: "middle" });
      for (let c = 0; c < 3; c++) {
        const imp = c + 1;
        rect(pres, slide, { x: gx + c * cwid, y: gy + r * chei, w: cwid, h: chei, fill: { color: RAMP[lik + imp] }, line: { color: "FFFFFF", width: 2 } });
      }
    }
    LEVELS.forEach((t, c) => txt(slide, t, { x: gx + c * cwid, y: gy + 3 * chei + 0.05, w: cwid, h: 0.25, fontSize: 10, color: C.text2, align: "center" }));
    label(slide, "Impact", { x: gx, y: gy + 3 * chei + 0.32, w: 3 * cwid, h: 0.25, color: C.text2, align: "center" });
    const counts = {};
    risks.forEach((rk) => { counts[rk.l + "-" + rk.i] = (counts[rk.l + "-" + rk.i] || 0) + 1; });
    const placed = {};
    risks.forEach((rk, n) => {
      const key = rk.l + "-" + rk.i;
      const slot = placed[key] || 0;
      placed[key] = slot + 1;
      const cx = gx + (rk.i - 1) * cwid + cwid / 2 - 0.2 + (slot - (counts[key] - 1) / 2) * 0.5;
      const cy = gy + (3 - rk.l) * chei + chei / 2 - 0.2;
      badge(pres, slide, String(n + 1), { x: cx, y: cy, d: 0.4, fill: "FFFFFF", line: { color: T.colors.accent1, width: 1 }, color: T.colors.accent1, fontSize: 11 });
    });

    const tx = gx + 3 * cwid + 0.4;
    const tw = W - M - tx;
    const body = risks.map((rk, n) => [
      cell(String(n + 1), { bold: true, align: "center", color: T.colors.accent1 }),
      cell(rk.text, { bold: true, color: T.colors.dk1 }),
      cell(rk.owner, { color: T.colors.dk2 }),
      cell(rk.action, { color: T.colors.dk2 }),
      cell(deltaRuns(TREND[rk.trend][0], TREND[rk.trend][1], TREND[rk.trend][2], T.colors.dk2)),
    ]);
    slide.addTable([headerRow(["#", "Risk", "Owner", "Mitigation", "Trend"], { color: T.colors.dk2 }), ...body], {
      x: tx, y: TOP, w: tw, colW: [0.4, 2.35, 1.25, 2.45, tw - 6.45], rowH: [0.3, 0.56, 0.56, 0.56, 0.56, 0.56, 0.56],
      fontSize: 11, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });
    txt(slide, "Rating = likelihood × impact; darker cell = higher severity. Trend is versus last quarter. High-rated risks (1 and 3) have a named executive sponsor and are reviewed monthly.", { x: tx, y: TOP + 4.0, w: tw, h: 0.6, fontSize: 11, color: C.text2 });
  },
};
