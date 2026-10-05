const { txt, card, label, M, CW, TOP } = require("../common");

const theme = {
  name: "Slate Night",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: { dk1: "F5F7FA", lt1: "1F2933", dk2: "AEB8C4", lt2: "2B3744", accent1: "4FD1C5", accent2: "F6AD55", accent3: "FC8181", accent4: "63B3ED", accent5: "9AE6B4", accent6: "D6BCFA", hlink: "4FD1C5", folHlink: "AEB8C4" },
};

const columns = [
  { title: "Done this week", items: [
    { head: "September deposit MI published on day 3", body: "Two days faster than August; commentary automated.", tag: "Finance MI · 3 Oct" },
    { head: "Card vintage delinquency deep-dive delivered", body: "2024 vintage isolated as the driver; shared with Risk.", tag: "Credit analytics · 1 Oct" },
    { head: "Data reconciliation suite v2 in production", body: "Row and column checks live for 25 source-target pairs.", tag: "Platform · 30 Sep" },
  ] },
  { title: "In progress", items: [
    { head: "HYS repricing impact model", body: "Attrition scenarios for −15 and −25 bps; draft Tuesday.", tag: "Pricing analytics · 70% done" },
    { head: "Branch consolidation dashboard", body: "Adding complaint and attrition tiles per market.", tag: "Distribution MI · 50% done" },
  ] },
  { title: "Next week", items: [
    { head: "Q3 business review pack", body: "Numbers locked Wednesday; narrative review Thursday.", tag: "Due 10 Oct" },
    { head: "Collections dialer data-feed design", body: "Depends on the vendor contract (see blockers).", tag: "Starts 7 Oct" },
  ] },
  { title: "Blockers and asks", accent: true, items: [
    { head: "Collections dialer contract still unsigned", body: "Blocks the data-feed design; Procurement escalation needed.", tag: "Ask: call the Procurement lead" },
    { head: "Two analyst roles open for 9 weeks", body: "Risk analytics backfill; contractor cover proposed to December.", tag: "Ask: approve contractor to Dec" },
  ] },
];

module.exports = {
  file: "06-weekly-board.pptx",
  section: "Weekly update board",
  theme,
  title: "Weekly update — Consumer Banking analytics — week ending 2 October 2026",
  meta: "For: Head of Consumer Banking  ·  Team: Data & Analytics, 12 FTE, 2 open roles  ·  Overall health: Green  ·  Next 1:1: 8 October",
  notes: "Weekly update board (dark). Four columns: done, in progress, next, blockers and asks. Every card is a headline plus one line of detail plus an owner or date. The blockers column is the reason the reader opens the slide, so each blocker ends with a specific ask.",
  // >>> four kanban columns of cards; the blockers column uses the warm accent <<< //
  build({ pres, slide, C }) {
    const gap = 0.25;
    const cw = (CW - gap * 3) / 4;
    const ch = 1.35;
    columns.forEach((col, i) => {
      const x = M + i * (cw + gap);
      label(slide, col.title, { x, y: TOP, w: cw, h: 0.3, fontSize: 11, color: col.accent ? C.accent2 : C.accent1 });
      col.items.forEach((it, j) => {
        const y = TOP + 0.4 + j * (ch + 0.15);
        card(pres, slide, { x, y, w: cw, h: ch, fill: { color: C.background2 } });
        txt(slide, it.head, { x: x + 0.15, y: y + 0.12, w: cw - 0.3, h: 0.45, fontSize: 12, bold: true, color: C.text1 });
        txt(slide, it.body, { x: x + 0.15, y: y + 0.57, w: cw - 0.3, h: 0.5, fontSize: 11, color: C.text2 });
        txt(slide, it.tag, { x: x + 0.15, y: y + 1.06, w: cw - 0.3, h: 0.22, fontSize: 10, bold: true, color: col.accent ? C.accent2 : C.accent1 });
      });
    });
  },
};
