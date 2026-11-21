// Pik, built from Tyler's "Porch Light" artwork in reference/pik/.
//
// The five SVG files are bundled as text. Each state's face (eyes and mouth) and the
// mic-off badge are lifted straight out of those files, then layered into one SVG so
// the card can cross-fade between states with CSS (classes p-rest, p-listen, ...).
// The shared frame (halo, ring, shadow, clay body, highlight, cheeks) is the same in
// all five files and is written out once below, exactly as it appears there.
// The sixth state, Heads up, isn't in Tyler's set; it comes from the prototype.
import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import resting from "../../reference/pik/resting.svg";
import listening from "../../reference/pik/listening.svg";
import thinking from "../../reference/pik/thinking.svg";
import speaking from "../../reference/pik/speaking.svg";
import muted from "../../reference/pik/muted.svg";

function face(src: string, name: string): string {
  const m = src.match(/<g fill="none" stroke="#3B291C"[^>]*>([\s\S]*?)<\/g>/);
  if (!m) throw new Error(`pik-house-card: couldn't find the face in ${name}.svg`);
  return m[1];
}

function badge(src: string): string {
  const m = src.match(/<g transform="translate\(203 187\)">([\s\S]*?)<\/g>/);
  if (!m) throw new Error("pik-house-card: couldn't find the mic-off badge in muted.svg");
  return m[1];
}

// The speaking mouth gets a class so CSS can animate it.
const speakFace = face(speaking, "speaking").replace("<ellipse ", '<ellipse class="mouth" ');

const ALERT_FACE =
  '<ellipse cx="111" cy="129" rx="6" ry="10.5" fill="#3B291C" stroke="none"></ellipse><ellipse cx="155" cy="124" rx="6" ry="10.5" fill="#3B291C" stroke="none"></ellipse><path d="M103 111q8-5 15-2m30-5q8-3 15 2" stroke-width="3.5"></path><ellipse cx="134" cy="148" rx="4.5" ry="5.5" fill="#3B291C" stroke="none"></ellipse>';

const BODY = "M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z";

const INNER = `<defs>
<radialGradient id="pkHalo"><stop class="hs" offset="0" stop-opacity=".25"></stop><stop class="hs" offset="1" stop-opacity="0"></stop></radialGradient>
<linearGradient id="pkClay" x1=".14" y1=".03" x2=".79" y2=".95"><stop offset="0" stop-color="#FFDF9B"></stop><stop offset=".52" stop-color="#F0AF64"></stop><stop offset="1" stop-color="#BD6A42"></stop></linearGradient>
<linearGradient id="pkMute" x1=".14" y1=".03" x2=".79" y2=".95"><stop offset="0" stop-color="#CDC1A4"></stop><stop offset="1" stop-color="#9E846D"></stop></linearGradient>
<radialGradient id="pkLight" cx=".28" cy=".15" r=".77"><stop offset="0" stop-color="#FFF3C3" stop-opacity=".64"></stop><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"></stop></radialGradient>
</defs>
<circle cx="128" cy="130" r="124" fill="url(#pkHalo)"></circle>
<circle class="ring" cx="128" cy="128" r="98"></circle>
<ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"></ellipse>
<g class="body">
<path d="${BODY}" fill="url(#pkClay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"></path>
<path class="mute" d="${BODY}" fill="url(#pkMute)"></path>
<path class="light" d="${BODY}" fill="url(#pkLight)"></path>
<path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"></path>
<path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"></path>
<g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
<g class="f f-rest">${face(resting, "resting")}</g>
<g class="f f-listen">${face(listening, "listening")}</g>
<g class="f f-think">${face(thinking, "thinking")}</g>
<g class="f f-speak">${speakFace}</g>
<g class="f f-muted">${face(muted, "muted")}</g>
<g class="f f-alert">${ALERT_FACE}</g>
</g>
</g>
<g class="badge2" transform="translate(203 187)">${badge(muted)}</g>`;

/** Pik's layered SVG. The state comes from the p-* class on the parent .pik element. */
export function pikArt(aria: string) {
  return html`<svg viewBox="0 0 256 256" width="280" height="280" role="img" aria-label=${aria}>${unsafeSVG(INNER)}</svg>`;
}
