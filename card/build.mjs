// Bundles the card into one file (card/dist/pik-house-card.js) and assembles the
// GitHub Pages preview in ../docs (index.html, the card, and the reference prototype).
// Pages serves ../docs straight from the branch, so the built files are committed.
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const watch = process.argv.includes("--watch");
const opts = {
  entryPoints: ["src/pik-house-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2021",
  minify: true,
  legalComments: "none",
  outfile: "dist/pik-house-card.js",
  loader: { ".svg": "text" },
  logLevel: "info",
};

// The backup page: holiday cooking mode on its own, with the card inlined (no Home Assistant needed).
// Also the smoking screen on its own, with a made-up cook, for trying it without the hub.
function standalone() {
  const js = readFileSync("dist/pik-house-card.js", "utf8").replace(/<\/script/gi, "<\\/script");
  const page = (title, tag, config) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Pik House</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#F3ECE0}body{touch-action:manipulation;-webkit-tap-highlight-color:transparent}${tag}{display:block;height:100vh}</style>
</head>
<body>
<${tag}></${tag}>
<script type="module">
${js}
const card = document.querySelector("${tag}");
card.setConfig(${JSON.stringify(config)});
</script>
</body>
</html>
`;
  writeFileSync("dist/holiday-standalone.html", page("Thanksgiving Kitchen", "pik-holiday-card", { type: "custom:pik-holiday-card", plan: "thanksgiving_2026", mock: true }));
  writeFileSync("dist/smoke-standalone.html", page("Smoking", "pik-smoke-card", { type: "custom:pik-smoke-card", mock: true }));
}

function site() {
  rmSync("../docs", { recursive: true, force: true });
  mkdirSync("../docs", { recursive: true });
  cpSync("preview/index.html", "../docs/index.html");
  cpSync("preview/holiday.html", "../docs/holiday.html");
  cpSync("dist/smoke-standalone.html", "../docs/smoking.html");
  cpSync("dist/pik-house-card.js", "../docs/pik-house-card.js");
  cpSync("../reference/daylight-reference.html", "../docs/reference.html");
  writeFileSync("../docs/.nojekyll", "");
}

if (watch) {
  const ctx = await esbuild.context({ ...opts, plugins: [{ name: "site", setup(b) { b.onEnd(site); } }] });
  await ctx.watch();
} else {
  await esbuild.build(opts);
  standalone();
  site();
}
