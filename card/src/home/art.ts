// The kitchen screen's illustrations: the live energy scene, the plant photo rings and the wine wall.
import { html, svg, nothing, type TemplateResult } from "lit";

let uid = 0;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ wine

export interface Wine { name: string; producer: string; vintage: string; region: string; grape: string; value: number; image: string; kind: "red" | "rose" | "white"; count: number }

const GLASS = { red: ["#2A0E14", "#5A1626"], rose: ["#E7A08B", "#F6C9B6"], white: ["#C9B97A", "#EEE2A8"] };
/** A drawn bottle for wines without a photo: the glass in the wine's color and a little label. */
export function bottleArt(w: Pick<Wine, "kind" | "name" | "vintage">, h: number): TemplateResult {
  const g = GLASS[w.kind];
  const id = "bt" + ++uid;
  const short = w.name.replace(/^(19|20)\d\d\s+/, "").split(" ").slice(0, 2).join(" ");
  return html`<svg viewBox="0 0 60 200" height=${h} aria-hidden="true">${svg`<defs><linearGradient id=${id} x1="0" x2="1"><stop offset="0" stop-color=${g[0]}></stop><stop offset=".45" stop-color=${g[1]}></stop><stop offset="1" stop-color=${g[0]}></stop></linearGradient></defs>
<path d="M24 4 H36 V52 C36 62 52 70 52 92 V190 Q52 196 46 196 H14 Q8 196 8 190 V92 C8 70 24 62 24 52 Z" fill=${`url(#${id})`}></path>
<rect x="23" y="2" width="14" height="22" rx="2" fill=${w.kind === "red" ? "#3A1A1E" : "#D8C9A8"}></rect>
<rect x="11" y="112" width="38" height="52" rx="3" fill="#F6EFE3"></rect>
<text x="30" y="134" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="9" fill="#2A221B">${short}</text>
<text x="30" y="150" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8" fill="#7A6C5E">${w.vintage || "NV"}</text>
<path d="M14 96 Q16 140 14 186" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none"></path>`}</svg>`;
}

/** One lit niche in the wine wall: the bottle photo (or drawing), its count and name. */
export function niche(w: Wine, h: number, onTap?: () => void, hot = false): TemplateResult {
  return html`<button type="button" class=${"niche" + (hot ? " hot" : "")} style=${`height: ${h}px`} @click=${(e: Event) => { e.stopPropagation(); onTap && onTap(); }} aria-label=${w.name}>
<span class="nlight"></span>
${w.image ? html`<img src=${w.image} alt="" referrerpolicy="no-referrer" loading="lazy" @error=${(e: Event) => { const i = e.target as HTMLElement; i.style.display = "none"; const a = i.nextElementSibling as HTMLElement | null; if (a) a.style.display = "flex"; }}><span class="nart" style="display: none">${bottleArt(w, h - 30)}</span>` : html`<span class="nart">${bottleArt(w, h - 30)}</span>`}
${w.count > 1 ? html`<span class="ncount">×${w.count}</span>` : nothing}
</button>`;
}

// ------------------------------------------------------------------ energy, as a live chart of today

export type Pt = [number, number]; // [ms, value]
export interface DayHist { solar: Pt[]; load: Pt[]; pct: Pt[]; ysolar?: Pt[] }

/** Resample a step series onto a 5-minute grid between a and b (holds the last value). */
function grid(pts: Pt[], a: number, b: number, step = 300000): Pt[] {
  const out: Pt[] = [];
  let i = 0, v = pts.length ? pts[0][1] : 0;
  for (let t = a; t <= b; t += step) {
    while (i < pts.length && pts[i][0] <= t) { v = pts[i][1]; i++; }
    out.push([t, v]);
  }
  return out;
}
/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(p: Array<[number, number]>): string {
  if (!p.length) return "";
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const avg = (pts: Pt[], k: number) => pts.map((p, i) => { const s = pts.slice(Math.max(0, i - k), i + k + 1); return [p[0], s.reduce((a, q) => a + q[1], 0) / s.length] as Pt; });

/** Today's sun against the house: glowing solar area, the house's use as a line, the Powerwall level, and now. */
export function energyChart(h: DayHist | null, now: number, w: number, ht: number, opts: { big?: boolean; solarNow?: number } = {}): TemplateResult {
  const id = "ec" + ++uid;
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const a = d0.getTime() + 6 * 3600e3, b = d0.getTime() + 21 * 3600e3;
  const padL = opts.big ? 34 : 0, padR = opts.big ? 34 : 0, padT = opts.big ? 16 : 6, padB = opts.big ? 26 : 2;
  const X = (t: number) => padL + ((t - a) / (b - a)) * (w - padL - padR);
  const end = Math.min(now, b);
  const sol = h ? avg(grid(h.solar, a, end), 1) : [];
  const lod = h ? avg(grid(h.load, a, end), 1) : [];
  const pct = h ? grid(h.pct, a, end, 900000) : [];
  const peak = Math.max(1, ...sol.map((p) => p[1]), ...lod.map((p) => p[1]), ...(h && h.ysolar ? h.ysolar.map((p) => p[1]) : [])) * 1.15;
  const Y = (v: number) => ht - padB - (Math.max(0, v) / peak) * (ht - padT - padB);
  const YP = (v: number) => ht - padB - (clamp(v, 0, 100) / 100) * (ht - padT - padB);
  const ys = h && h.ysolar && h.ysolar.length ? avg(grid(h.ysolar, a, b), 1) : [];
  const ysp = ys.map((p) => [X(p[0]), Y(p[1])] as [number, number]);
  const sp = sol.map((p) => [X(p[0]), Y(p[1])] as [number, number]);
  const lp = lod.map((p) => [X(p[0]), Y(p[1])] as [number, number]);
  const pp = pct.map((p) => [X(p[0]), YP(p[1])] as [number, number]);
  const area = sp.length ? smooth(sp) + ` L${sp[sp.length - 1][0].toFixed(1)} ${ht - padB} L${sp[0][0].toFixed(1)} ${ht - padB} Z` : "";
  const nx = X(end), ny = sp.length ? sp[sp.length - 1][1] : ht - padB;
  const showNow = now >= a && now <= b;
  const ticks = [6, 9, 12, 15, 18, 21];
  return html`<svg viewBox=${`0 0 ${w} ${ht}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style="display: block; overflow: visible">${svg`
<defs>
<linearGradient id=${id + "a"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC861" stop-opacity=".85"></stop><stop offset=".55" stop-color="#F59A3C" stop-opacity=".35"></stop><stop offset="1" stop-color="#F59A3C" stop-opacity="0"></stop></linearGradient>
<linearGradient id=${id + "s"} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB25A"></stop><stop offset=".5" stop-color="#FFE08A"></stop><stop offset="1" stop-color="#FFB25A"></stop></linearGradient>
<filter id=${id + "g"} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation=${opts.big ? 6 : 3.5}></feGaussianBlur></filter>
</defs>
${opts.big ? svg`${ticks.map((hh) => { const x = X(d0.getTime() + hh * 3600e3); return svg`<line x1=${x} x2=${x} y1=${padT} y2=${ht - padB} stroke="#fff" stroke-opacity=".07"></line><text x=${x} y=${ht - 6} text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="12" fill="#9FB0C4">${hh === 12 ? "noon" : (hh > 12 ? hh - 12 : hh) + (hh >= 12 ? "p" : "a")}</text>`; })}` : nothing}
<line x1=${padL} x2=${w - padR} y1=${ht - padB} y2=${ht - padB} stroke="#fff" stroke-opacity=".14"></line>
${ysp.length ? svg`<path d=${smooth(ysp) + ` L${ysp[ysp.length - 1][0].toFixed(1)} ${ht - padB} L${ysp[0][0].toFixed(1)} ${ht - padB} Z`} fill="#FFC861" fill-opacity=".035"></path><path d=${smooth(ysp)} fill="none" stroke="#FFC861" stroke-opacity=".5" stroke-width=${opts.big ? 1.6 : 1.2} stroke-dasharray="2 4"></path>` : nothing}
${area ? svg`<path d=${area} fill=${`url(#${id}a)`}></path>
<path d=${smooth(sp)} fill="none" stroke="#FFC861" stroke-width=${opts.big ? 7 : 5} stroke-opacity=".55" filter=${`url(#${id}g)`}></path>
<path d=${smooth(sp)} fill="none" stroke=${`url(#${id}s)`} stroke-width=${opts.big ? 2.6 : 2} stroke-linecap="round"></path>` : nothing}
${lp.length ? svg`<path d=${smooth(lp)} fill="none" stroke="#DDE7F3" stroke-opacity=".75" stroke-width=${opts.big ? 1.8 : 1.4} stroke-dasharray=${opts.big ? "5 5" : "3 4"}></path>` : nothing}
${opts.big && pp.length ? svg`<path d=${smooth(pp)} fill="none" stroke="#8EDB9A" stroke-width="2" stroke-opacity=".9"></path>
${[0, 50, 100].map((v) => svg`<text x=${w - padR + 6} y=${YP(v) + 4} font-family="Instrument Sans, sans-serif" font-size="11" fill="#8EDB9A" fill-opacity=".8">${v}%</text>`)}
${[0, peak / 1.15 / 2, peak / 1.15].map((v) => svg`<text x=${padL - 6} y=${Y(v) + 4} text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="11" fill="#9FB0C4">${v.toFixed(v < 10 ? 1 : 0)}</text>`)}
<text x=${padL - 6} y=${padT - 4} text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="10" fill="#9FB0C4">kW</text>` : nothing}
${showNow ? svg`<line x1=${nx} x2=${nx} y1=${padT} y2=${ht - padB} stroke="#fff" stroke-opacity=".35" stroke-dasharray="2 3"></line>
<circle cx=${nx} cy=${ny} r=${opts.big ? 14 : 9} fill="#FFD27A" opacity=".35"><animate attributeName="r" values=${opts.big ? "8;18;8" : "5;12;5"} dur="2.4s" repeatCount="indefinite"></animate><animate attributeName="opacity" values=".55;0;.55" dur="2.4s" repeatCount="indefinite"></animate></circle>
<circle cx=${nx} cy=${ny} r=${opts.big ? 5.5 : 4} fill="#FFF3CF" stroke="#FFB25A" stroke-width="2"></circle>` : nothing}
`}</svg>`;
}

/** A vertical battery gauge with a slow shimmer while it charges. */
export function batteryGauge(pct: number, charging: boolean, w = 26, h = 70): TemplateResult {
  const id = "bg" + ++uid;
  const f = clamp(pct, 0, 100) / 100;
  const ih = (h - 8) * f;
  return html`<svg width=${w} height=${h + 6} viewBox=${`0 0 ${w} ${h + 6}`} aria-hidden="true">${svg`
<defs><linearGradient id=${id} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3E9A62"></stop><stop offset="1" stop-color="#A8E6A0"></stop></linearGradient></defs>
<rect x=${w / 2 - 5} y="0" width="10" height="5" rx="2" fill="#fff" fill-opacity=".5"></rect>
<rect x="1" y="5" width=${w - 2} height=${h} rx="7" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)" stroke-width="1.5"></rect>
<rect x="4" y=${5 + 4 + (h - 8) - ih} width=${w - 8} height=${ih} rx="4" fill=${`url(#${id})`}>${charging ? svg`<animate attributeName="opacity" values="1;.7;1" dur="2s" repeatCount="indefinite"></animate>` : nothing}</rect>`}</svg>`;
}

// ------------------------------------------------------------------ plant group icons (no photos)

const ICONS: Array<[RegExp, string]> = [
  [/kitchen/i, "M20 38 C20 30 20 26 20 20 M20 26 C13 25 7 21 6 13 C14 13 19 18 20 26 Z M20 22 C27 21 33 16 34 8 C26 9 21 14 20 22 Z M20 30 C26 30 31 27 33 22 C27 21 22 25 20 30 Z M20 31 C14 31 9 29 7 25 C13 23 18 26 20 31 Z"],
  [/aroid|monstera/i, "M20 38 V27 M20 27 C7 27 3 17 6 9 C9 3 17 2 20 6 C23 2 31 3 34 9 C37 17 33 27 20 27 Z M12 12 L16 15 M10 19 L15 19 M28 12 L24 15 M30 19 L25 19 M20 9 V24"],
  [/bedroom|office|spider/i, "M20 38 V30 M20 30 C16 22 9 18 3 18 M20 30 C17 20 15 12 10 5 M20 30 C21 20 22 11 25 4 M20 30 C24 21 30 16 37 15 M20 30 C14 26 8 26 4 28"],
  [/tree|palm|fig/i, "M20 38 V16 M20 16 C14 10 8 10 3 13 M20 16 C16 8 11 5 6 5 M20 16 C21 8 24 4 29 3 M20 16 C26 10 32 10 37 13 M20 16 C24 12 31 13 34 18"],
  [/tough|zz|snake/i, "M14 38 C14 26 12 16 10 6 M26 38 C26 26 28 16 30 6 M12 12 l-5 -2 M11 18 l-6 0 M13 25 l-6 2 M28 12 l5 -2 M29 18 l6 0 M27 25 l6 2"],
  [/jungle|christmas|rhipsalis/i, "jungle"],
  [/desert|cact|succulent/i, "M20 38 V8 C20 5 24 5 24 8 V38 M20 22 H14 C12 22 11 21 11 19 V13 C11 11 14 11 14 13 V18 H20 M24 26 H29 C31 26 32 25 32 23 V17 C32 15 29 15 29 17 V22 H24"],
];
export function plantIcon(group: string, size: number, color = "#5E8A5A"): TemplateResult {
  const d = (ICONS.find(([re]) => re.test(group)) || ICONS[0])[1];
  if (d === "jungle") {
    // Christmas cactus: chains of flat segments arching out of the pot, a bloom at each tip
    const seg: Array<[number, number, number]> = [[20, 31, 0], [15.5, 24, -32], [11, 17.5, -42], [24.5, 24, 32], [29, 17.5, 42], [20, 22, 0]];
    return html`<svg width=${size} height=${size} viewBox="0 0 40 40" aria-hidden="true">${svg`<g fill="none" stroke=${color} stroke-width="2.2">${seg.map(([x, y, r]) => svg`<ellipse cx=${x} cy=${y} rx="2.8" ry="4" transform=${`rotate(${r} ${x} ${y})`}></ellipse>`)}</g>
<path d="M20 38 V35.5" stroke=${color} stroke-width="2.2" stroke-linecap="round"></path>
<circle cx="8" cy="12.5" r="2.2" fill=${color}></circle><circle cx="32" cy="12.5" r="2.2" fill=${color}></circle><circle cx="20" cy="16" r="2.2" fill=${color}></circle>`}</svg>`;
  }
  return html`<svg width=${size} height=${size} viewBox="0 0 40 40" aria-hidden="true">${svg`<path d=${d} fill="none" stroke=${color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
}

/** A plant group as an icon inside its moisture ring, the percentage big and clear underneath. */
export function groupRing(g: { room: string; m: number; thr: number; dry: boolean; live: boolean }, size: number): TemplateResult {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  const f = g.live ? clamp(g.m / 60, 0.02, 1) : 0;
  const tk = clamp(g.thr / 60, 0, 1) * 2 * Math.PI - Math.PI / 2;
  const col = g.dry ? "#E3893B" : "#5E8A5A";
  return html`<div class=${"gring" + (g.dry ? " dry" : "")} style=${`width: ${size}px; height: ${size}px`}>
<svg width=${size} height=${size} aria-hidden="true">${svg`
<circle cx=${size / 2} cy=${size / 2} r=${r} fill=${g.dry ? "#FFF2E4" : "#F3F5EC"}></circle>
<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="rgba(94,138,90,.16)" stroke-width="7"></circle>
<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${col} stroke-width="7" stroke-linecap="round" stroke-dasharray=${`${c * f} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`}></circle>
<line x1=${size / 2 + (r - 7) * Math.cos(tk)} y1=${size / 2 + (r - 7) * Math.sin(tk)} x2=${size / 2 + (r + 7) * Math.cos(tk)} y2=${size / 2 + (r + 7) * Math.sin(tk)} stroke="#E3893B" stroke-width="2.5" stroke-linecap="round"></line>`}</svg>
<span class="gicon">${plantIcon(g.room, size * 0.5, col)}</span></div>`;
}
