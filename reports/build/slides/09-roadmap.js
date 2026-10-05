const { txt, rect, line, label, M, W, TOP } = require("../common");

const theme = {
  name: "Sage Calm",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: { dk1: "1F2A2E", lt1: "FFFFFF", dk2: "5E6E73", lt2: "EEF4F1", accent1: "50808E", accent2: "84B59F", accent3: "69A297", accent4: "C5D9CF", accent5: "2F5D6B", accent6: "D9A05B", hlink: "50808E", folHlink: "5E6E73" },
};

const QUARTERS = ["Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027"];
const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const rows = [
  { name: "Core deposits migration", owner: "M. Chen · critical path", bars: [[0, 4, "committed"]], marks: [{ at: 0.77, kind: "gate", text: "Go / no-go 24 Oct", pos: "above" }, { at: 1.47, kind: "milestone", text: "Cutover 14 Nov", pos: "below" }] },
  { name: "Digital onboarding 2.0 — national rollout", owner: "J. Alvarez", bars: [[0, 3, "committed"]], marks: [{ at: 0.65, kind: "milestone", text: "National launch 20 Oct", pos: "below" }] },
  { name: "Card collections uplift", owner: "S. Patel", bars: [[1, 7, "committed"]], marks: [{ at: 1.3, kind: "gate", text: "Outsourcing decision 10 Nov", pos: "below" }, { at: 4.5, kind: "milestone", text: "Dialer live Feb", pos: "below" }] },
  { name: "Branch network phase 2", owner: "R. Okafor · pending approval", bars: [[3, 9, "pending"]], marks: [{ at: 3.4, kind: "gate", text: "Approval gate Jan", pos: "below" }] },
  { name: "Open banking APIs", owner: "L. Novak", bars: [[0, 6, "committed"], [6, 12, "pending"]], marks: [{ at: 2.6, kind: "milestone", text: "Certification Dec", pos: "below" }, { at: 6.3, kind: "milestone", text: "Premium APIs (tentative)", pos: "below" }] },
];

module.exports = {
  file: "09-roadmap.pptx",
  section: "Roadmap",
  theme,
  title: "2027 roadmap: five initiatives and three decision gates before March — core migration is the critical path",
  meta: "Consumer Banking change roadmap, Q4 2026 – Q3 2027  ·  Quarterly planning review  ·  Owner: PMO  ·  Status as of October 2026",
  notes: "Roadmap (Gantt). One row per initiative with owner; bars are delivery windows, diamonds are the decisions the reader owns, circles are milestones, and the dashed line is today. Pending work is drawn in the lighter colour so nobody reads it as committed.",
  // >>> quarter header, five Gantt rows with bars and markers, today line, legend <<< //
  build({ pres, slide, C, T }) {
    const x0 = M + 3.2;
    const x1 = W - M;
    const mw = (x1 - x0) / 12;
    QUARTERS.forEach((q, i) => {
      rect(pres, slide, { x: x0 + i * 3 * mw + 0.02, y: TOP, w: 3 * mw - 0.04, h: 0.32, fill: { color: C.background2 }, line: { color: T.colors.lt2, width: 0 } });
      txt(slide, q, { x: x0 + i * 3 * mw, y: TOP, w: 3 * mw, h: 0.32, fontSize: 11, bold: true, color: C.text1, align: "center", valign: "middle" });
    });
    MONTHS.forEach((m, i) => txt(slide, m, { x: x0 + i * mw, y: TOP + 0.36, w: mw, h: 0.22, fontSize: 9, color: C.text2, align: "center" }));
    const ry0 = TOP + 0.68;
    const rh = 0.74;
    rows.forEach((r, i) => {
      const ry = ry0 + i * rh;
      line(pres, slide, M, ry + rh, x1, ry + rh);
      txt(slide, r.name, { x: M, y: ry + 0.1, w: 3.0, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
      txt(slide, r.owner, { x: M, y: ry + 0.4, w: 3.0, h: 0.25, fontSize: 10, color: C.text2 });
      const by = ry + (rh - 0.3) / 2;
      r.bars.forEach(([s, e, kind]) => {
        slide.addShape(pres.ShapeType.roundRect, { x: x0 + s * mw + 0.03, y: by, w: (e - s) * mw - 0.06, h: 0.3, rectRadius: 0.15, fill: { color: kind === "committed" ? C.accent1 : C.accent2 }, line: { color: kind === "committed" ? T.colors.accent1 : T.colors.accent2, width: 0 } });
      });
      r.marks.forEach((mk) => {
        const mx = x0 + mk.at * mw;
        if (mk.kind === "gate") slide.addShape(pres.ShapeType.diamond, { x: mx - 0.14, y: by + 0.15 - 0.14, w: 0.28, h: 0.28, fill: { color: C.accent6 }, line: { color: "FFFFFF", width: 1 } });
        else slide.addShape(pres.ShapeType.ellipse, { x: mx - 0.11, y: by + 0.15 - 0.11, w: 0.22, h: 0.22, fill: { color: "FFFFFF" }, line: { color: T.colors.accent5, width: 1.5 } });
        const ly = mk.pos === "above" ? ry + 0.02 : by + 0.32;
        txt(slide, mk.text, { x: mx - 0.1, y: ly, w: 2.0, h: 0.2, fontSize: 9, color: C.text1 });
      });
    });
    for (let q = 1; q < 4; q++) line(pres, slide, x0 + q * 3 * mw, ry0, x0 + q * 3 * mw, ry0 + rows.length * rh);
    const todayX = x0 + (4 / 31) * mw;
    line(pres, slide, todayX, TOP + 0.6, todayX, ry0 + rows.length * rh, { color: T.colors.accent6, width: 1.25, dashType: "dash" });
    txt(slide, "Today", { x: todayX + 0.05, y: ry0 + rows.length * rh + 0.02, w: 0.8, h: 0.2, fontSize: 9, bold: true, color: C.accent6 });

    const ly = ry0 + rows.length * rh + 0.3;
    const items = [
      ["bar", T.colors.accent1, "Committed delivery"],
      ["bar", T.colors.accent2, "Pending approval"],
      ["diamond", T.colors.accent6, "Decision gate"],
      ["circle", "FFFFFF", "Milestone"],
    ];
    let lx = M;
    items.forEach(([kind, color, text]) => {
      if (kind === "bar") slide.addShape(pres.ShapeType.roundRect, { x: lx, y: ly + 0.05, w: 0.45, h: 0.16, rectRadius: 0.08, fill: { color }, line: { color, width: 0 } });
      else if (kind === "diamond") slide.addShape(pres.ShapeType.diamond, { x: lx + 0.1, y: ly, w: 0.26, h: 0.26, fill: { color }, line: { color, width: 0 } });
      else slide.addShape(pres.ShapeType.ellipse, { x: lx + 0.12, y: ly + 0.02, w: 0.22, h: 0.22, fill: { color }, line: { color: T.colors.accent5, width: 1.5 } });
      txt(slide, text, { x: lx + 0.55, y: ly, w: 1.7, h: 0.26, fontSize: 10, color: C.text2, valign: "middle" });
      lx += 2.1;
    });
  },
};
