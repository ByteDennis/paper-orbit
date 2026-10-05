const { txt, card, label, statusRuns, cell, headerRow, rowBorders, STATUS, M, W, TOP } = require("../common");

const theme = {
  name: "Charcoal Minimal",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: { dk1: "212121", lt1: "FFFFFF", dk2: "616161", lt2: "F2F2F2", accent1: "36454F", accent2: "7D8B96", accent3: "B0BAC2", accent4: "D9DEE2", accent5: "4A5F6E", accent6: "C0A062", hlink: "36454F", folHlink: "616161" },
};

const RAG = {
  green: { color: STATUS.good, text: "On track" },
  amber: { color: STATUS.warn, text: "At risk" },
  red: { color: STATUS.bad, text: "Off track" },
};

const rows = [
  ["Digital onboarding 2.0", "green", "Release 3 live in two states; funnel conversion +4 pts", "National rollout 20 Oct; marketing launch", "J. Alvarez"],
  ["Core deposits migration", "amber", "Dress rehearsal 2 slipped one week on reconciliation defects", "Go / no-go for 14 Nov cutover due 24 Oct", "M. Chen"],
  ["Card collections uplift", "red", "Dialer vendor contract unsigned; hiring 40% complete", "Decision on interim outsourcing needed", "S. Patel"],
  ["Branch network optimisation", "green", "6 of 14 consolidations done; attrition 1.8% vs 3% tolerance", "Next four closures 1 Nov; staff redeployment", "R. Okafor"],
  ["Open banking APIs", "amber", "Security review raised 3 high findings; 2 closed", "Close final finding by 10 Oct; certification test", "L. Novak"],
  ["Complaints handling redesign", "green", "Average resolution 6.1 days (target 7)", "Automate acknowledgement letters", "A. Rossi"],
];

const escalations = [
  { text: "Approve interim outsourcing of early-stage collections", owner: "S. Patel · by 10 Oct" },
  { text: "Confirm 14 Nov cutover or defer migration to January", owner: "M. Chen · by 24 Oct" },
];

module.exports = {
  file: "03-rag-status.pptx",
  section: "RAG status",
  theme,
  title: "Change portfolio status — overall AMBER: core migration and card collections need decisions this month",
  meta: "Status as of 2 October 2026  ·  Weekly portfolio review  ·  Prepared for: Head of Consumer Banking  ·  Owner: PMO",
  notes: "RAG status tracker. One row per workstream: status, what happened this period, what happens next, owner. Status always carries a word next to the colour. Overall rating and the escalations that need the reader's decision sit on the right so they are not buried in the table.",
  // >>> workstream status table on the left, overall rating and escalations on the right, legend below <<< //
  build({ pres, slide, C, T }) {
    const tw = 8.35;
    const body = rows.map((r) => [
      cell(r[0], { bold: true, color: T.colors.dk1 }),
      cell(statusRuns(RAG[r[1]].color, RAG[r[1]].text, T.colors.dk1)),
      cell(r[2], { color: T.colors.dk2 }),
      cell(r[3], { color: T.colors.dk2 }),
      cell(r[4], { color: T.colors.dk2 }),
    ]);
    slide.addTable([headerRow(["Workstream", "Status", "This period", "Next period", "Owner"], { color: T.colors.dk2 }), ...body], {
      x: M, y: TOP, w: tw, colW: [1.75, 1.2, 2.35, 2.05, 1.0], rowH: [0.35, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62],
      fontSize: 11, color: T.colors.dk1, border: rowBorders(), autoPage: false,
    });
    const px = M + tw + 0.3;
    const pw = W - M - px;
    card(pres, slide, { x: px, y: TOP, w: pw, h: 4.07, fill: { color: C.background2 } });
    label(slide, "Overall status", { x: px + 0.25, y: TOP + 0.2, w: pw - 0.5, h: 0.25, color: C.text2 });
    txt(slide, statusRuns(STATUS.warn, "AMBER", T.colors.dk1), { x: px + 0.25, y: TOP + 0.45, w: pw - 0.5, h: 0.5, fontSize: 24, bold: true });
    txt(slide, "3 on track  ·  2 at risk  ·  1 off track", { x: px + 0.25, y: TOP + 1.0, w: pw - 0.5, h: 0.3, fontSize: 11, color: C.text2 });
    label(slide, "Decisions needed", { x: px + 0.25, y: TOP + 1.5, w: pw - 0.5, h: 0.25, color: C.text2 });
    escalations.forEach((e, i) => {
      const y = TOP + 1.8 + i * 1.1;
      txt(slide, e.text, { x: px + 0.25, y, w: pw - 0.5, h: 0.7, fontSize: 13, bold: true, color: C.text1 });
      txt(slide, e.owner, { x: px + 0.25, y: y + 0.72, w: pw - 0.5, h: 0.3, fontSize: 11, color: C.text2 });
    });
    txt(slide, [
      ...statusRuns(STATUS.good, "On track: on plan     ", T.colors.dk2),
      ...statusRuns(STATUS.warn, "At risk: slippage with mitigation in place     ", T.colors.dk2),
      ...statusRuns(STATUS.bad, "Off track: off plan, decision needed", T.colors.dk2),
    ], { x: M, y: TOP + 4.35, w: tw, h: 0.3, fontSize: 11 });
  },
};
