// The three sheets that slide up from the bottom: Energy, Plants and Home.
// Markup is ported from reference/daylight-reference.html.
import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { Vals } from "./pik-house-card";

export function energySheet(v: Vals) {
  return html`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">Energy · Tesla</span><h2 class="stitle">Power in motion</h2><button type="button" class="done" @click=${v.goHome}>Done</button></div>
<div class="sbody esb">
<div class=${v.ewinCls}>
<svg class="emap" viewBox="0 0 392 214" width="760" height="415" role="img" aria-label=${v.energyAria}>
<defs>
<radialGradient id="eGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#E8B97C" stop-opacity=".18"></stop><stop offset="1" stop-color="#E8B97C" stop-opacity="0"></stop></radialGradient>
<linearGradient id="eBat" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#609975"></stop><stop offset="1" stop-color="#C5E5A4"></stop></linearGradient>
<linearGradient id="eRoof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEE0A4"></stop><stop offset="1" stop-color="#BC7D4B"></stop></linearGradient>
</defs>
<ellipse cx="196" cy="98" rx="170" ry="96" fill="url(#eGlow)"></ellipse>
<g fill="none" stroke="#E4C29B" opacity=".12"><ellipse cx="196" cy="98" rx="96" ry="62"></ellipse><ellipse cx="196" cy="98" rx="140" ry="86" stroke-dasharray="2 7"></ellipse></g>
<g class=${v.solarFlow}><path class="wire" d="M80 54Q122 60 156 82"></path><path class="pk" d="M80 54Q122 60 156 82"></path></g>
<g class=${v.gridFlow}><path class="wire" d="M80 150Q122 140 156 116"></path><path class="pk" d="M80 150Q122 140 156 116"></path></g>
<g class=${v.batFlow}><path class="wire" d="M312 150Q270 140 236 116"></path><path class="pk" d="M312 150Q270 140 236 116"></path></g>
<g transform="translate(52 46)">
<circle r="28" fill="#23271F" stroke="#7B6A50"></circle>
<g class="sunic" stroke="#FFC580" stroke-width="2" stroke-linecap="round"><circle r="10" fill="#FFC580" fill-opacity=".32"></circle><path d="M0-19v4M0 15v4M-19 0h4M15 0h4M-13-13l3 3M10 10l3 3M13-13l-3 3M-10 10l-3 3"></path></g>
<path class="moon" d="M6 12A13 13 0 0 1-7-10c-1.5 7 3 14 10.5 15.5 3 .7 5.8.4 7.6-.5A13 13 0 0 1 6 12Z" fill="#BCD0DD" stroke="#E0EDF2" stroke-width="1"></path>
</g>
<text class="nlbl" x="90" y="24">${v.solarLbl}</text>
<text class="nval" x="90" y="43">${v.solarVal}</text>
<g transform="translate(196 98)">
<circle r="40" fill="#28291F" stroke="#A88958" stroke-opacity=".75"></circle>
<circle r="34" fill="none" stroke="#E6C086" stroke-opacity=".28" stroke-dasharray="1 5"></circle>
<path d="M-17 0V15H17V0" fill="#8A6448" stroke="#33271E" stroke-width="1.2"></path>
<path d="M-22 2 0-17 22 2Z" fill="url(#eRoof)" stroke="#33271E" stroke-width="1.2"></path>
<rect class="win" x="-11" y="4" width="7" height="6" rx="1"></rect>
<rect class="win" x="4" y="4" width="7" height="6" rx="1"></rect>
<rect x="-3" y="8" width="6" height="7" fill="#4A3628"></rect>
<text class="nlbl" text-anchor="middle" y="29">HOUSE</text>
</g>
<text class="hval" text-anchor="middle" x="196" y="162">${v.houseVal}</text>
<g transform="translate(52 158)">
<circle class="gridnode" r="28" fill="#222820" stroke="#697D75"></circle>
<path d="M-10 16-3-14h6l7 30M-7 2H7M-4-6h8M-14-8h28" fill="none" stroke="#C2D8DD" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
<path class="cut" d="M-14 14 14-14" stroke="#FAA192" stroke-width="4" stroke-linecap="round"></path>
</g>
<text class="nlbl" text-anchor="middle" x="52" y="200">${v.gridLbl}</text>
<text class="nval" text-anchor="middle" x="52" y="214" style="font-size: 13px">${v.gridVal}</text>
<g transform="translate(340 158)">
<circle r="30" fill="#222820" stroke="#74937A"></circle>
<rect x="-12" y="-20" width="24" height="40" rx="4" fill="#18231D" stroke="#B0D3AC" stroke-width="1.5"></rect>
<path d="M-5-21v-3H5v3" fill="none" stroke="#B0D3AC" stroke-width="1.5"></path>
<rect class="batfill" x="-8.5" width="17" rx="2" fill="url(#eBat)" style=${v.batStyle}></rect>
</g>
<text class="nlbl" text-anchor="middle" x="334" y="200">POWERWALL 2</text>
<text class="nval" text-anchor="middle" x="334" y="214" style="font-size: 13px">${v.batVal}</text>
</svg>
</div>
<div class="stats">
<div class="lead">${v.e.main}</div>
<div class="leadsub">${v.e.sub}</div>
<div class="stat">Solar right now<b>${v.solarVal}</b></div>
<div class="stat">House is using<b>${v.houseVal}</b></div>
<div class="stat">Powerwall<b>${v.batVal}</b></div>
<div class="stat">Grid<b>${v.gridStat}</b></div>
${v.showEssentials ? html`<button type="button" class="bigbtn" @click=${v.essentialsOn}>Switch to essentials only</button>` : nothing}
</div>
</div>
</div>`;
}

export function plantsSheet(v: Vals) {
  return html`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">${v.plantsEb}</span><h2 class="stitle">${v.plHead}</h2><button type="button" class="done" @click=${v.goHome}>Done</button></div>
<div class="sbody psb">
<div class="plist">
${repeat(v.groups, (g) => g.id, (g) => html`<div class=${g.cls}>
${g.hasStop ? html`<span class="stopn">${g.stop}</span>` : html`<span class="okdot"></span>`}
<span class="pname"><b>${g.room}</b><span>${g.sub}</span></span>
<span class="meter"><span class="mfill" style=${g.fill}></span><span class="mtick" style=${g.tick}></span></span>
<span class="ppct">${g.m}%</span>
<span class="pst">${g.status}</span>
${g.isDry ? html`<button type="button" class="wbtn" @click=${g.tap}>Watered</button>` : html`<span></span>`}
</div>`)}
</div>
<div class="rcol">
<span class="eb">${v.routeLbl}</span>
<div class="lead">${v.routeHead}</div>
${v.routeStops.map((r) => html`<div class="rstop"><span class="stopn">${r.n}</span>${r.room}<span class="rp">${r.plants} plants</span></div>`)}
${v.hasRoute ? html`<button type="button" class="bigbtn ink" @click=${v.logRoute}>${v.routeBtn}</button>` : nothing}
<p class="note">One sensor sits in each group's thirstiest plant. When it dips below its line (the tick on the bar), the whole group gets water.</p>
</div>
</div>
</div>`;
}

export function homeSheet(v: Vals) {
  return html`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">Around the house</span><h2 class="stitle">Home</h2><button type="button" class="done" @click=${v.goHome}>Done</button></div>
<div class="sbody hsb">
<div class="hpanel"><span class="eb">Heat · Ecobee</span><div class="thermo"><button type="button" class="tbtn" aria-label="Lower the heat" @click=${v.down}>−</button><span class="tset">${v.setpoint}°</span><button type="button" class="tbtn" aria-label="Raise the heat" @click=${v.up}>+</button></div><div class="csub">${v.thermoSub}</div></div>
<div class="hpanel"><span class="eb">Lights · Wemo + Leviton</span><div class="lights">${v.lights.map((l) => html`<button type="button" class=${l.cls} aria-pressed=${l.pressed} @click=${l.toggle}><i></i>${l.name}<small>${l.state}</small></button>`)}</div></div>
<div class="hpanel"><span class="eb">Outside</span>
<div class="zone"><b>Yard · Rachio</b><span>Skipping while it's freezing</span></div>
<div class="zone"><b>Garden · B-Hyve</b><span>${v.gardenTxt}</span><button type="button" class="zbtn" @click=${v.toggleGarden}>${v.gardenBtn}</button></div>
<button type="button" class="cam" @click=${v.camera}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"></rect><path d="M16 10l5-3v10l-5-3"></path></svg>Ring live view</button>
</div>
</div>
</div>`;
}
