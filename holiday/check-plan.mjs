// Cross-checks a holiday plan so the screen can't contradict itself:
//   node holiday/check-plan.mjs thanksgiving-2026
// Fails (exit 1) on any problem. Run after every change to the plan.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || "thanksgiving-2026";
const p = JSON.parse(readFileSync(join(here, file + ".json"), "utf8"));
const problems = [];
const bad = (m) => problems.push(m);
const days = Object.keys(p.days);
const dishIds = new Set(p.dishes.map((d) => d.id));
const recipeIds = new Set(p.recipes.map((r) => r.id));
const within = (seg, day, hm) => seg[0] === day && seg[1] <= hm && hm < seg[2];

// tasks
const ids = new Set();
let last = "";
for (const t of p.tasks) {
  if (ids.has(t.id)) bad(`duplicate task id ${t.id}`);
  ids.add(t.id);
  if (!days.includes(t.day)) bad(`${t.id}: unknown day ${t.day}`);
  if (!/^\d\d:\d\d$/.test(t.hm)) bad(`${t.id}: bad time ${t.hm}`);
  const key = days.indexOf(t.day) + t.hm;
  if (key < last) bad(`${t.id}: tasks out of time order`);
  last = key;
  if (t.rid && !recipeIds.has(t.rid)) bad(`${t.id}: unknown recipe ${t.rid}`);
  if ("who" in t) bad(`${t.id}: still says who does it`);
  for (const [r, i] of t.steps || []) {
    const R = p.recipes.find((x) => x.id === r);
    if (!R || !R.steps[i]) bad(`${t.id}: step ${r}:${i} doesn't exist`);
    else if (R.steps[i].d !== t.day) bad(`${t.id}: step ${r}:${i} is a ${R.steps[i].d} step but the task is on ${t.day}`);
  }
  if (t.rid && !(t.steps || []).length) bad(`${t.id}: has a recipe but no steps`);
  for (const e of t.dish || []) {
    if (!dishIds.has(e[0])) bad(`${t.id}: unknown dish ${e[0]}`);
    if (!["cold", "act", "hot", "wait"].includes(e[1])) bad(`${t.id}: unknown dish state ${e[1]}`);
  }
  // a task that names a burner must find that burner busy then
  const m = t.text.match(/^Burner (\d)/);
  if (m && !(p.stations["b" + m[1]] || []).some((s) => within(s, t.day, t.hm))) bad(`${t.id}: says burner ${m[1]} but burner ${m[1]} is free at ${t.day} ${t.hm}`);
  const mm = t.text.match(/[Bb]urner (\d)[^0-9]+[Bb]urner (\d)/);
  if (mm && !(p.stations["b" + mm[2]] || []).some((s) => within(s, t.day, t.hm))) bad(`${t.id}: says burner ${mm[2]} but it is free then`);
  if (t.lane === "oven" && !/off|out of the oven|Oven to/i.test(t.text) && !(p.stations.oven || []).some((s) => within(s, t.day, t.hm))) bad(`${t.id}: an oven task while the oven is off`);
  if (t.lane === "smoker" && t.day === p.hotCheck.day && !(p.stations.smoker || []).some((s) => within(s, t.day, t.hm))) bad(`${t.id}: a smoker task while the smoker is off`);
}
// every step's ingredients point at real ingredients, and every ingredient is used by some step
for (const r of p.recipes) {
  const used = new Set();
  r.steps.forEach((s, i) => {
    if (!Array.isArray(s.ing)) { bad(`recipe ${r.id} step ${i + 1}: no ingredient list`); return; }
    for (const e of s.ing) {
      const k = e[0];
      if (k === -1) { if (!e[2]) bad(`recipe ${r.id} step ${i + 1}: an extra item needs wording`); continue; }
      if (!r.ingr[k] || r.ingr[k][0] === "—") bad(`recipe ${r.id} step ${i + 1}: ingredient ${k} doesn't exist`);
      used.add(k);
    }
  });
  r.ingr.forEach((g, k) => { if (g[0] !== "—" && !used.has(k)) bad(`recipe ${r.id}: "${g[1]}" isn't used by any step`); });
}
// every recipe step is covered by some task
for (const r of p.recipes) r.steps.forEach((s, i) => {
  if (!p.tasks.some((t) => (t.steps || []).some(([x, j]) => x === r.id && j === i))) bad(`recipe ${r.id} step ${i + 1} isn't part of any task`);
  if (s.tm && !(s.tm[1] > 0 && ["check", "done", "temp"].includes(s.tm[2]))) bad(`recipe ${r.id} step ${i + 1}: bad timer`);
});
// stations: valid, in order, no overlaps
for (const [name, segs] of Object.entries(p.stations)) {
  segs.forEach((s, i) => {
    if (!days.includes(s[0]) || !(s[1] < s[2])) bad(`station ${name} segment ${i}: bad times`);
    const prev = segs[i - 1];
    if (prev && prev[0] === s[0] && prev[2] > s[1]) bad(`station ${name}: segments overlap at ${s[0]} ${s[1]}`);
  });
}
// every dish ends somewhere, and every hot dish gets hot
for (const d of p.dishes) {
  const eff = p.tasks.flatMap((t) => (t.dish || []).filter((e) => e[0] === d.id));
  if (!eff.length) bad(`dish ${d.id} never changes state`);
  if (d.hot && !eff.some((e) => e[1] === "hot")) bad(`hot dish ${d.id} is never marked hot`);
}
if (problems.length) { console.error("Plan problems:\n- " + problems.join("\n- ")); process.exit(1); }
console.log(`Plan OK: ${p.tasks.length} tasks, ${p.recipes.reduce((a, r) => a + r.steps.length, 0)} recipe steps, ${Object.keys(p.stations).length} stations, ${p.dishes.length} dishes.`);
