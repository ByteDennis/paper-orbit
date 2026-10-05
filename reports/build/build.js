const fs = require("fs");
const path = require("path");
const { buildSpec } = require("./common");

const OUT = path.resolve(__dirname, "..");
const SLIDES = path.join(__dirname, "slides");

// >>> build every slide spec, or only those whose file name starts with a given argument <<< //
async function main() {
  const only = process.argv.slice(2);
  const files = fs.readdirSync(SLIDES).filter((f) => f.endsWith(".js")).sort();
  for (const f of files) {
    if (only.length && !only.some((id) => f.startsWith(id))) continue;
    const spec = require(path.join(SLIDES, f));
    const out = await buildSpec(spec, OUT);
    console.log("wrote", path.relative(process.cwd(), out));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
