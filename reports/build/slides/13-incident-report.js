const { txt, card, line, dot, label, statusRuns, cell, headerRow, rowBorders, M, W, CW, TOP } = require("../common");

const theme = {
  name: "Graphite",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: { dk1: "F5F5F5", lt1: "232323", dk2: "BDBDBD", lt2: "303030", accent1: "FAB219", accent2: "E66767", accent3: "66BB6A", accent4: "64B5F6", accent5: "9E9E9E", accent6: "CE93D8", hlink: "FAB219", folHlink: "BDBDBD" },
};

const facts = [
  ["Duration", "2h 14m", "07:42–09:56 ET, 29 September"],
  ["Customers affected", "~186k", "23% of daily active users"],
  ["Failed login attempts", "412k", "app and web combined"],
  ["Complaints logged", "1,240", "against ~90 on a normal day"],
];

const events = [
  ["07:42", "Monitoring alert: auth error rate above 5%"],
  ["07:55", "Sev-2 declared; incident bridge opened"],
  ["08:30", "Root cause found: expired TLS certificate on the secondary auth gateway"],
  ["09:20", "Certificate reissued; gateway nodes restarted"],
  ["09:56", "Error rate back at baseline; incident closed"],
];

const rootCause = "The quarterly certificate rotation completed on the primary gateway but failed silently on the secondary. When a routine deployment shifted traffic to the secondary at 07:40, TLS handshakes failed and logins errored. Detection relied on error-rate alerting; no certificate-expiry alert existed for the secondary node.";
const impact = "App and web login unavailable or slow for most customers; cards, ATMs and payments were unaffected. 1,240 complaints (3 escalated) and goodwill payments of $8.2k.";

const actions = [
  ["Certificate-expiry monitoring on every gateway node", "Platform Eng.", "10 Oct", "done"],
  ["Rotation job fails loudly and pages on-call; both nodes verified", "Platform Eng.", "17 Oct", "doing"],
  ["Login availability on the customer status page within 15 minutes", "Digital Channels", "31 Oct", "open"],
];

const STATE = { done: ["66BB6A", "Done"], doing: ["FAB219", "In progress"], open: ["9E9E9E", "Open"] };

module.exports = {
  file: "13-incident-report.pptx",
  section: "Incident report",
  theme,
  title: "INC-4471: mobile banking login degraded for 2h 14m on 29 September — root cause fixed, two actions open",
  meta: "Post-incident report  ·  Severity 2  ·  Service owner: Digital Channels  ·  Reviewed by: Technology Risk  ·  Report date: 5 October 2026",
  notes: "Incident report (dark). Four facts a manager needs before anything else, a timeline from alert to close, root cause and customer impact in plain words, and the remediation actions with owner, date and status. The title carries the outcome so the reader is not left wondering whether it is over.",
  // >>> fact tiles, five-point timeline, root cause and impact, actions table <<< //
  build({ pres, slide, C, T }) {
    const tw = (CW - 0.75) / 4;
    facts.forEach(([l, v, s], i) => {
      const x = M + i * (tw + 0.25);
      card(pres, slide, { x, y: TOP, w: tw, h: 1.05, fill: { color: C.background2 } });
      txt(slide, l, { x: x + 0.2, y: TOP + 0.08, w: tw - 0.4, h: 0.26, fontSize: 11, color: C.text2 });
      txt(slide, v, { x: x + 0.2, y: TOP + 0.32, w: tw - 0.4, h: 0.45, fontSize: 22, bold: true, color: C.accent1 });
      txt(slide, s, { x: x + 0.2, y: TOP + 0.76, w: tw - 0.4, h: 0.25, fontSize: 10, color: C.text2 });
    });
    const ly = TOP + 1.6;
    const lx0 = M + 0.3;
    const step = (CW - 0.6) / (events.length - 1);
    line(pres, slide, lx0, ly, W - M - 0.3, ly, { color: "5A5A5A", width: 1.5 });
    events.forEach(([t, d], i) => {
      const x = lx0 + i * step;
      dot(pres, slide, x - 0.11, ly - 0.11, 0.22, i === events.length - 1 ? T.colors.accent3 : T.colors.accent1);
      txt(slide, t, { x: x - 0.8, y: ly - 0.42, w: 1.6, h: 0.25, fontSize: 11, bold: true, color: C.text1, align: "center" });
      txt(slide, d, { x: x - 1.2, y: ly + 0.2, w: 2.4, h: 0.7, fontSize: 10, color: C.text2, align: "center" });
    });
    const by = TOP + 2.75;
    const lw = 6.0;
    label(slide, "Root cause", { x: M, y: by, w: lw, h: 0.25, color: C.accent1 });
    txt(slide, rootCause, { x: M, y: by + 0.28, w: lw, h: 1.15, fontSize: 11.5, color: C.text1 });
    label(slide, "Customer impact", { x: M, y: by + 1.5, w: lw, h: 0.25, color: C.accent1 });
    txt(slide, impact, { x: M, y: by + 1.78, w: lw, h: 0.7, fontSize: 11.5, color: C.text1 });
    const tx = M + lw + 0.35;
    const tbw = W - M - tx;
    label(slide, "Actions", { x: tx, y: by, w: tbw, h: 0.25, color: C.accent1 });
    const body = actions.map((a) => [
      cell(a[0], { color: T.colors.dk1 }),
      cell(a[1], { color: T.colors.dk2 }),
      cell(a[2], { color: T.colors.dk2 }),
      cell(statusRuns(STATE[a[3]][0], STATE[a[3]][1], T.colors.dk1)),
    ]);
    slide.addTable([headerRow(["Action", "Owner", "Due", "Status"], { color: T.colors.dk2 }), ...body], {
      x: tx, y: by + 0.3, w: tbw, colW: [3.0, 1.25, 0.7, tbw - 4.95], rowH: [0.3, 0.55, 0.55, 0.55],
      fontSize: 11, color: T.colors.dk1, border: rowBorders("4A4A4A"), autoPage: false,
    });
  },
};
