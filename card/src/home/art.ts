// The kitchen screen's illustrations: the live energy scene, the plant photo rings and the wine wall.
import { html, svg, nothing, type TemplateResult } from "lit";

let uid = 0;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ energy

export interface SceneIn {
  solar: number; house: number; bat: number; grid: number | null; pct: number; out: boolean;
  elevation: number | null; azimuth: number | null; clouds: number | null;
}

/** Sky colors from the sun's real elevation: night, dusk, golden hour, day. */
function sky(el: number): [string, string, string] {
  if (el < -8) return ["#0B1230", "#1B2550", "#2C3A6B"];
  if (el < -2) return ["#1E2A55", "#5A4E7C", "#D98C6A"];
  if (el < 6) return ["#4C6FA5", "#E9A76F", "#F7D29C"];
  if (el < 14) return ["#6FA7D8", "#BFDDF0", "#F5E3C2"];
  return ["#5A9BD8", "#A9D3F0", "#E6F3FA"];
}

/** Moving dots along a path; dir 1 = path direction, -1 = reverse; speed from kW. */
function particles(pathId: string, kw: number, dir: number, color: string, r = 4.2): TemplateResult {
  const a = Math.abs(kw);
  if (a < 0.05) return svg``;
  const n = clamp(Math.round(2 + a * 1.4), 2, 8);
  const dur = clamp(3.6 / Math.sqrt(a), 1.1, 5.5);
  const kp = dir > 0 ? "0;1" : "1;0";
  return svg`${Array.from({ length: n }, (_x, i) => svg`<circle r=${r} fill=${color} opacity=".95">
<animateMotion dur=${dur + "s"} begin=${-(dur * i) / n + "s"} repeatCount="indefinite" keyPoints=${kp} keyTimes="0;1" calcMode="linear"><mpath href=${"#" + pathId}></mpath></animateMotion></circle>`)}`;
}

function pill(x: number, y: number, txt: string, fg: string, bg: string): TemplateResult {
  const w = 14 + txt.length * 8.6;
  return svg`<g transform=${`translate(${x - w / 2} ${y - 14})`}><rect width=${w} height="28" rx="14" fill=${bg} opacity=".92"></rect><text x=${w / 2} y="19" text-anchor="middle" font-family="Instrument Sans, system-ui, sans-serif" font-size="15" font-weight="600" fill=${fg}>${txt}</text></g>`;
}

/** The house, live: sky by the real sun, panels, Powerwall, the grid, and power moving between them. 640×400. */
export function energyScene(e: SceneIn, opts: { labels?: boolean; cls?: string; wide?: boolean } = {}): TemplateResult {
  const id = "es" + ++uid;
  const el = e.elevation ?? (new Date().getHours() >= 7 && new Date().getHours() < 17 ? 20 : -20);
  const night = el < -4;
  const [s0, s1, s2] = sky(el);
  const az = e.azimuth ?? 180;
  const sx = clamp(lerp(30, 610, (az - 100) / 160), 40, 600);
  const sy = clamp(250 - el * 7, 40, 290);
  const clouds = e.clouds ?? 0;
  const panelsOn = e.solar > 0.1;
  const winGlow = night || el < 2;
  const lv = clamp(e.pct, 0, 100) / 100;
  // where things are
  const roof = { x: 318, y: 168 };
  const gridIn = e.grid !== null && e.grid < -0.05; // importing
  const gridOut = e.grid !== null && e.grid > 0.05; // exporting
  const sunPath = `M${sx} ${sy} L${roof.x} ${roof.y}`;
  const gridPath = "M104 186 C170 176 214 196 262 226";
  const batPath = "M402 262 L452 262";
  return html`<svg class=${opts.cls || ""} viewBox=${opts.wide ? "-300 -20 940 440" : "0 0 640 400"} preserveAspectRatio="xMidYMid slice" role="img" aria-label="The house's power right now" style="display: block; width: 100%; height: 100%">${svg`
<defs>
<linearGradient id=${id + "sky"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${s0}></stop><stop offset=".62" stop-color=${s1}></stop><stop offset="1" stop-color=${s2}></stop></linearGradient>
<radialGradient id=${id + "sun"}><stop offset="0" stop-color="#FFF6D8"></stop><stop offset=".35" stop-color="#FFD27A"></stop><stop offset="1" stop-color="#FFB547" stop-opacity="0"></stop></radialGradient>
<linearGradient id=${id + "hill"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${night ? "#24344A" : "#86A672"}></stop><stop offset="1" stop-color=${night ? "#141E2E" : "#5E7F52"}></stop></linearGradient>
<linearGradient id=${id + "hill2"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${night ? "#1C2A3D" : "#6E9160"}></stop><stop offset="1" stop-color=${night ? "#101824" : "#4D6B45"}></stop></linearGradient>
<linearGradient id=${id + "panel"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D4A7A"></stop><stop offset=".5" stop-color="#1B2F55"></stop><stop offset="1" stop-color="#2A4675"></stop></linearGradient>
<linearGradient id=${id + "glint"} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"></stop><stop offset=".5" stop-color="#fff" stop-opacity=".55"></stop><stop offset="1" stop-color="#fff" stop-opacity="0"></stop></linearGradient>
<linearGradient id=${id + "bat"} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4FA06A"></stop><stop offset="1" stop-color="#B8E59A"></stop></linearGradient>
<clipPath id=${id + "roof"}><path d="M262 206 L320 150 L398 150 L418 206 Z"></path></clipPath>
<clipPath id=${id + "bc"}><rect x="444" y="218" width="40" height="88" rx="9"></rect></clipPath>
<path id=${id + "ps"} d=${sunPath}></path><path id=${id + "pg"} d=${gridPath}></path><path id=${id + "pb"} d=${batPath}></path>
</defs>
<rect x="-420" y="-40" width="1480" height="480" fill=${`url(#${id}sky)`}></rect>
${night ? svg`<g fill="#fff">${[[60, 40, 1.4], [140, 80, 1], [210, 30, 1.6], [300, 60, 1], [380, 26, 1.3], [470, 70, 1], [530, 36, 1.5], [600, 90, 1], [90, 120, 1], [560, 140, 1.2], [250, 110, 0.9], [-60, 60, 1.3], [-150, 30, 1], [-230, 100, 1.4], [-120, 140, 0.9], [-280, 50, 1.1]].map(([x, y, r], i) => svg`<circle cx=${x} cy=${y} r=${r} opacity=".85"><animate attributeName="opacity" values=".2;.95;.2" dur=${3 + (i % 4) + "s"} repeatCount="indefinite"></animate></circle>`)}</g>
<g transform="translate(540 70)"><circle r="26" fill="#F3EEDC"></circle><circle cx="11" cy="-7" r="24" fill=${s0}></circle></g>`
    : svg`<circle cx=${sx} cy=${sy} r="70" fill=${`url(#${id}sun)`}><animate attributeName="r" values="64;74;64" dur="6s" repeatCount="indefinite"></animate></circle><circle cx=${sx} cy=${sy} r="22" fill="#FFE7A8"></circle>`}
${clouds > 20 ? svg`<g fill=${night ? "#3A4668" : "#FFFFFF"} opacity=${night ? 0.6 : clamp(clouds / 110, 0.35, 0.85)}>
<g><ellipse cx="120" cy="70" rx="46" ry="16"></ellipse><ellipse cx="150" cy="60" rx="30" ry="18"></ellipse><animateTransform attributeName="transform" type="translate" values="-40 0;700 0" dur="90s" repeatCount="indefinite"></animateTransform></g>
${clouds > 55 ? svg`<g><ellipse cx="400" cy="100" rx="60" ry="18"></ellipse><ellipse cx="430" cy="88" rx="34" ry="20"></ellipse><animateTransform attributeName="transform" type="translate" values="-500 0;300 0" dur="120s" repeatCount="indefinite"></animateTransform></g>` : nothing}</g>` : nothing}
<path d="M-420 300 C-300 280 -120 296 0 290 C120 250 220 270 330 262 C450 254 540 236 640 252 C760 266 900 240 1060 256 L1060 460 L-420 460 Z" fill=${`url(#${id}hill2)`}></path>
<path d="M-420 326 C-260 306 -120 320 0 316 C140 296 260 304 380 300 C480 296 560 286 640 292 C800 300 920 284 1060 296 L1060 460 L-420 460 Z" fill=${`url(#${id}hill)`}></path>
<!-- grid pole -->
<g stroke=${night ? "#8C95A8" : "#5D4A3C"} stroke-width="5" stroke-linecap="round"><path d="M96 308 V168"></path><path d="M76 182 H118"></path><path d="M80 196 H114" stroke-width="3"></path></g>
<path d="M118 182 C180 172 214 192 262 222" fill="none" stroke=${night ? "#59647D" : "#4B3B30"} stroke-width="1.6"></path>
${e.out ? svg`<g transform="translate(96 150)"><circle r="15" fill="#E0645A"></circle><path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"></path></g>` : nothing}
<!-- house -->
<ellipse cx="340" cy="312" rx="130" ry="10" fill="#000" opacity=".16"></ellipse>
<rect x="268" y="204" width="146" height="104" fill=${night ? "#C9B8A0" : "#F3E6D3"}></rect>
<rect x="268" y="204" width="146" height="10" fill="#000" opacity=".08"></rect>
<path d="M252 210 L320 144 L402 144 L428 210 Z" fill=${night ? "#5B4636" : "#8E5B3D"}></path>
<g clip-path=${`url(#${id}roof)`}>
<g transform="translate(0 0)" fill=${`url(#${id}panel)`} stroke="#9FB8DA" stroke-width=".8" stroke-opacity=".5">
${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => svg`<path d=${`M${292 + c * 26 - r * 9} ${158 + r * 15} h23 l-4 13 h-23 z`}></path>`))}
</g>
${panelsOn ? svg`<rect x="250" y="140" width="40" height="80" fill=${`url(#${id}glint)`} transform="skewX(-20)"><animate attributeName="x" values="250;470" dur="3.2s" repeatCount="indefinite"></animate></rect>` : nothing}
</g>
<rect x="300" y="248" width="28" height="60" rx="3" fill="#7A5038"></rect>
${[[284, 226], [352, 226], [384, 226]].map(([x, y]) => svg`<rect x=${x} y=${y} width="22" height="22" rx="3" fill=${winGlow ? "#FFCB6B" : "#A9C8DE"} stroke="#fff" stroke-width="2">${winGlow ? svg`<animate attributeName="fill" values="#FFCB6B;#FFD98C;#FFCB6B" dur="5s" repeatCount="indefinite"></animate>` : nothing}</rect>`)}
<!-- Powerwall -->
<rect x="440" y="214" width="48" height="96" rx="11" fill="#F7F4EE" stroke="#D2CABD" stroke-width="2"></rect>
<g clip-path=${`url(#${id}bc)`}>
<rect x="444" y=${306 - 88 * lv} width="40" height=${88 * lv + 4} fill=${`url(#${id}bat)`}></rect>
<path d=${`M444 ${306 - 88 * lv} q10 -5 20 0 t20 0 v8 h-40 z`} fill="#CFEFB2" opacity=".8"><animateTransform attributeName="transform" type="translate" values="-20 0;0 0;-20 0" dur="3s" repeatCount="indefinite"></animateTransform></path>
</g>
<text x="464" y="244" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="20" fill="#2A221B">${e.pct}%</text>
<!-- power moving -->
${panelsOn && !night ? svg`<path d=${sunPath} stroke="#FFD27A" stroke-width="2" stroke-dasharray="2 10" opacity=".45" fill="none"></path>${particles(id + "ps", e.solar, 1, "#FFD27A", 5)}` : nothing}
${particles(id + "pg", e.grid ?? 0, gridIn ? 1 : -1, gridOut ? "#9FE0A0" : "#8FC2F0")}
${particles(id + "pb", e.bat, e.bat > 0 ? 1 : -1, "#B8E59A", 4.5)}
${opts.labels ? svg`
${panelsOn ? pill(clamp(sx + 70, 90, 500), clamp(sy + 40, 40, 250), e.solar.toFixed(1) + " kW sun", "#5A3A10", "#FFE9B8") : nothing}
${e.grid !== null && Math.abs(e.grid) > 0.05 ? pill(196, 214, (gridOut ? "Selling " : "Buying ") + Math.abs(e.grid).toFixed(1) + " kW", "#123049", "#DCEBFA") : e.out ? pill(196, 214, "Grid down", "#fff", "#C2453B") : nothing}
${pill(341, 338, "House " + e.house.toFixed(1) + " kW", "#2A221B", "#FCF8F1")}
${Math.abs(e.bat) > 0.05 ? pill(470, 196, (e.bat > 0 ? "Charging " : "Using ") + Math.abs(e.bat).toFixed(1), "#1E4A2C", "#DDF3CF") : nothing}` : nothing}
`}</svg>`;
}

// ------------------------------------------------------------------ plants

export interface PlantPic { name: string; photo: string; spot: string; notes: string }
export const photoUrl = (id: string, size = 256) => (id ? `/api/image/serve/${id}/${size}x${size}` : "");

/** A plant photo inside a moisture ring: the ring fills with the soil moisture; the tick is the thirst line. */
export function plantRing(p: { photo: string; m: number; thr: number; dry: boolean; live: boolean }, size: number, label?: TemplateResult): TemplateResult {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  const f = p.live ? clamp(p.m / 60, 0.02, 1) : 0;
  const tk = clamp(p.thr / 60, 0, 1) * 2 * Math.PI - Math.PI / 2;
  const col = p.dry ? "#E3893B" : "#5E8A5A";
  return html`<div class=${"pring" + (p.dry ? " dry" : "")} style=${`width: ${size}px; height: ${size}px`}>
${p.photo ? html`<img src=${photoUrl(p.photo, size > 160 ? 512 : 256)} alt="" loading="lazy" style=${`inset: 9px; width: ${size - 18}px; height: ${size - 18}px`}>` : html`<div class="noimg" style=${`inset: 9px`}></div>`}
<svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} aria-hidden="true">${svg`
<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="rgba(94,138,90,.18)" stroke-width="6"></circle>
<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${col} stroke-width="6" stroke-linecap="round" stroke-dasharray=${`${c * f} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`}></circle>
<circle cx=${size / 2 + r * Math.cos(tk)} cy=${size / 2 + r * Math.sin(tk)} r="4.5" fill="#fff" stroke="#E3893B" stroke-width="2.5"></circle>`}</svg>
${p.dry ? html`<span class="drop" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 3 C8 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-2-6-6-12z" fill="#fff"></path></svg></span>` : nothing}
${label || nothing}</div>`;
}

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
