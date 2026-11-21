// Bundles the card into one file (card/dist/pik-house-card.js) and assembles the
// GitHub Pages preview in ../docs (index.html, the card, and the reference prototype).
// Pages serves ../docs straight from the branch, so the built files are committed.
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

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

function site() {
  rmSync("../docs", { recursive: true, force: true });
  mkdirSync("../docs", { recursive: true });
  cpSync("preview/index.html", "../docs/index.html");
  cpSync("dist/pik-house-card.js", "../docs/pik-house-card.js");
  cpSync("../reference/daylight-reference.html", "../docs/reference.html");
  writeFileSync("../docs/.nojekyll", "");
}

if (watch) {
  const ctx = await esbuild.context({ ...opts, plugins: [{ name: "site", setup(b) { b.onEnd(site); } }] });
  await ctx.watch();
} else {
  await esbuild.build(opts);
  site();
}
