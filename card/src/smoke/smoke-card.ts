// Pik smoking: the Inkbird's probes on one screen. Reads the entities from ha/packages/pik_smoke.yaml:
//   sensor.smoke_probe_N (°F; attributes food, kind, target, rate, eta_min, flat, hist)
//   input_text.smoke_probe_N_flags (what's been said: d@ done, a got it, l lost, f falling, w/s stall)
//   input_boolean.smoke_on / smoke_quiet, input_datetime.smoke_started
// Every button goes back through a script (smoke_probe, smoke_got_it, smoke_end), so voice and taps agree.
// mock: true (or no hass) runs a made-up cook so the page can be tried anywhere.
import { LitElement, html, nothing, svg, type TemplateResult } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { smokeStyles } from "./smoke-styles";

export interface SmokeConfig { type: string; probes?: number; mock?: boolean; hours?: number }
interface HState { state: string; attributes: Record<string, unknown>; last_changed: string }
interface Hass {
  states: Record<string, HState>;
  callService(d: string, s: string, data?: Record<string, unknown>, target?: Record<string, unknown>, notify?: boolean, ret?: boolean): Promise<unknown>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection?: { subscribeEvents(cb: (e: { data: Record<string, unknown> }) => void, type: string): Promise<() => void> };
}
interface Probe {
  i: number; food: string; kind: "food" | "smoker"; target: number; v: number | null;
  rate: number | null; eta: number | null; flat: boolean; flags: Record<string, number>; since: number;
}

// Same presets as the hub's script (ha/gen-smoke.mjs), shown as chips in the editor.
const CHIPS: Array<[string, "food" | "smoker", number]> = [
  ["Brisket", "food", 203], ["Pork shoulder", "food", 203], ["Ribs", "food", 198], ["Turkey", "food", 165],
  ["Chicken", "food", 165], ["Salmon", "food", 145], ["Pork loin", "food", 145], ["Prime rib", "food", 130], ["Smoker", "smoker", 0],
];
const PROBE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 4.5a2.5 2.5 0 0 1 5 0v9.3a4.5 4.5 0 1 1-5 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.6" fill="currentColor"/></svg>`;
const SMOKER_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 14a8.5 6 0 0 1 17 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 14h18M7 14v6M17 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 6.5c-1-1 1-2 0-3.5M14 6.5c-1-1 1-2 0-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const dur = (min: number) => { const m = Math.max(0, Math.round(min)); const h = Math.floor(m / 60); return h ? `${h} h${m % 60 ? " " + (m % 60) + " m" : ""}` : `${m} min`; };
const clock = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const parseFlags = (s: string) => {
  const o: Record<string, number> = {};
  (s || "").replace(/unknown|unavailable/g, "").split(/\s+/).filter(Boolean).forEach((t) => { const [k, v] = t.split("@"); o[k] = v ? Number(v) : 0; });
  return o;
};

export class PikSmokeCard extends LitElement {
  static styles = [smokeStyles];
  static properties = { _t: { state: true } };
  private _t = 0;
  private config: SmokeConfig = { type: "custom:pik-smoke-card" };
  private _hass?: Hass;
  private timer?: number;
  private hist: Record<number, Array<[number, number]>> = {};
  private histAt = 0;
  private edit: { i: number; food: string; kind: "food" | "smoker"; target: number; typing: boolean } | null = null;
  private confirmEnd = false;
  private banner: { msg: string; at: number } | null = null;
  private unsub?: () => void;
  private busy = false;
  // mock cook
  private mock: { start: number; probes: Probe[]; quiet: boolean; on: boolean } | null = null;

  setConfig(config: SmokeConfig): void { this.config = { probes: 4, hours: 3, ...config }; }
  set hass(h: Hass) {
    const first = !this._hass;
    this._hass = h;
    if (first && h.connection && !this.config.mock) {
      h.connection.subscribeEvents((e) => { this.banner = { msg: String(e.data.message || ""), at: Date.now() }; this.requestUpdate(); }, "smoke_alert")
        .then((u) => (this.unsub = u)).catch(() => undefined);
    }
    if (first && !this.config.mock) this.loadHistory();
    this.requestUpdate();
  }
  getCardSize(): number { return 12; }
  private get live(): boolean { return !!this._hass && !this.config.mock; }

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts();
    this.timer = window.setInterval(() => { this._t++; if (this.live && Date.now() - this.histAt > 120000) this.loadHistory(); }, 15000);
    if (!this.live && !this.mock) this.startMock();
  }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this.timer); if (this.unsub) this.unsub(); }

  // ------------------------------------------------------------ data
  private n(): number { return this.config.probes || 4; }
  private st(id: string): HState | undefined { return this._hass?.states[id]; }
  private probes(): Probe[] {
    if (!this.live) { if (!this.mock) this.startMock(); return this.mockProbes(); }
    return [...Array(this.n())].map((_, k) => {
      const i = k + 1, s = this.st(`sensor.smoke_probe_${i}`), a = s?.attributes || {};
      const num = s && /^-?\d+(\.\d+)?$/.test(s.state) ? Number(s.state) : null;
      const food = this.st(`input_text.smoke_probe_${i}_food`)?.state || "";
      const target = Number(this.st(`input_number.smoke_probe_${i}_target`)?.state || 0) || 0;
      const kind = (this.st(`input_select.smoke_probe_${i}_kind`)?.state === "smoker" ? "smoker" : "food") as "food" | "smoker";
      return {
        i, food: /^(unknown|unavailable)$/.test(food) ? "" : food, kind, target, v: num,
        rate: typeof a.rate === "number" ? a.rate : null, eta: typeof a.eta_min === "number" ? a.eta_min : null, flat: a.flat === true,
        flags: parseFlags(this.st(`input_text.smoke_probe_${i}_flags`)?.state || ""), since: s ? Date.parse(s.last_changed) : Date.now(),
      };
    });
  }
  private cookOn(): boolean { return this.live ? this.st("input_boolean.smoke_on")?.state === "on" : !!this.mock?.on; }
  private quiet(): boolean { return this.live ? this.st("input_boolean.smoke_quiet")?.state === "on" : !!this.mock?.quiet; }
  private started(): Date | null {
    if (!this.live) return this.mock ? new Date(this.mock.start) : null;
    const s = this.st("input_datetime.smoke_started")?.state;
    const d = s ? new Date(s.replace(" ", "T")) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }
  private async loadHistory(): Promise<void> {
    if (!this._hass) return;
    this.histAt = Date.now();
    const ids = [...Array(this.n())].map((_, k) => `sensor.smoke_probe_${k + 1}`);
    try {
      const res = await this._hass.callWS<Record<string, Array<{ s: string; lu: number }>>>({
        type: "history/history_during_period", start_time: new Date(Date.now() - (this.config.hours || 3) * 3600e3).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
      });
      ids.forEach((id, k) => { this.hist[k + 1] = (res[id] || []).filter((x) => /^-?\d/.test(x.s)).map((x) => [x.lu * 1000, Number(x.s)] as [number, number]); });
      this.requestUpdate();
    } catch (e) { /* history not available */ }
  }
  private call(script: string, data: Record<string, unknown> = {}): void {
    if (!this.live) { this.mockCall(script, data); return; }
    this._hass!.callService("script", script, data).catch(() => undefined);
  }

  // ------------------------------------------------------------ what each probe is doing
  private status(p: Probe): { cls: string; word: string; line: string; done?: boolean } {
    if (!p.food && p.v === null) return { cls: "off", word: "", line: "Not in use. Tap to set it up." };
    if (!p.food) return { cls: "idle", word: "", line: "Reading, but not set up. Tap to say what it's in." };
    if (p.v === null) return { cls: "bad", word: "Not reading", line: "Check the probe is plugged in, and the Inkbird is on and in range." };
    const rate = p.rate === null ? "" : p.rate >= 2.5 ? `Rising ${Math.round(p.rate)}° an hour` : p.rate <= -2.5 ? `Falling ${Math.round(-p.rate)}° an hour` : "Holding steady";
    if (p.kind === "smoker") {
      if ("f" in p.flags || (p.rate !== null && p.rate <= -50)) return { cls: "bad", word: "Dropping fast", line: "Check the pellets and the fire." };
      if (p.target && Math.abs(p.v - p.target) > 25) return { cls: "warn", word: p.v > p.target ? "Running hot" : "Running cool", line: `Set for ${p.target}°.${rate ? " " + rate + "." : ""}` };
      return { cls: "ok", word: p.target ? "On target" : "", line: rate ? rate + "." : "Watching the smoker." };
    }
    if (p.v > 230) return { cls: "bad", word: "Out of the meat?", line: `Reads ${p.v}°, hotter than meat can get. Push the probe back into the thickest part.` };
    if (!p.target) return { cls: "idle", word: "", line: (rate ? rate + ". " : "") + "Watching. No alert set; tap to add one." };
    if (p.v >= p.target || "d" in p.flags) {
      const ago = "d" in p.flags && p.flags.d ? Math.max(0, Math.floor(Date.now() / 60000) - p.flags.d) : 0;
      return { cls: "done", word: "Done", line: `Hit ${p.target}°${ago ? " " + dur(ago) + " ago" : ""}. Time to take it off.`, done: !("a" in p.flags) };
    }
    if (p.v >= p.target - 10) return { cls: "warn", word: "Almost there", line: `${p.target - p.v}° to go.${rate ? " " + rate + "." : ""}` };
    if ((p.flat || "w" in p.flags) && p.v >= 150 && p.v <= 180 && p.target >= 190)
      return { cls: "stall", word: "The stall", line: "Holding steady. Normal for big cuts; it can last hours. Wrap it to push through." };
    return { cls: "go", word: "", line: rate ? rate + (p.eta !== null ? ` · about ${dur(p.eta)} to go` : "") + "." : "Warming up." };
  }

  // ------------------------------------------------------------ render
  render(): TemplateResult {
    const ps = this.probes(), on = this.cookOn(), st = this.started(), now = Date.now();
    const reading = ps.filter((p) => p.v !== null).length;
    const sub = on && st ? `Going for ${dur((now - st.getTime()) / 60000)} · since ${clock(st)}` : reading ? "The Inkbird is reading. The cook starts by itself in a minute." : "Turn the Inkbird on, and the cook starts by itself.";
    const ban = this.banner && now - this.banner.at < 10 * 60000 ? this.banner : null;
    return html`
<div class="wrap">
  <header>
    <div class="ti"><span class="eb">${this.live ? "Inkbird · live" : "Preview · made-up cook"}</span><h1 class="serif">Smoking</h1><span class="sub">${sub}</span></div>
    <div class="acts">
      <button class="ico ${this.quiet() ? "off" : ""}" @click=${this.toggleQuiet} title=${this.quiet() ? "Echos are quiet. Tap to let Pik speak." : "Pik announces on the Echos. Tap to quiet."}>${this.quiet() ? "🔇" : "🔊"}</button>
      ${this.confirmEnd
        ? html`<span class="cf">End the cook and clear every probe?</span><button class="btn" @click=${() => { this.confirmEnd = false; this.requestUpdate(); }}>Keep going</button><button class="btn ink" @click=${this.endCook}>End it</button>`
        : html`<button class="btn" ?disabled=${!on && !ps.some((p) => p.food)} @click=${() => { this.confirmEnd = true; this.requestUpdate(); }}>End cook</button>`}
    </div>
  </header>
  ${ban ? html`<div class="banner"><span>${ban.msg}</span><button class="btn sm" @click=${() => { this.banner = null; this.call("smoke_got_it"); this.requestUpdate(); }}>Got it</button></div>` : nothing}
  <main class="grid g${this.n()}">${ps.map((p) => this.tile(p))}</main>
  ${this.edit ? this.editor() : nothing}
</div>`;
  }

  private tile(p: Probe): TemplateResult {
    const s = this.status(p);
    const pct = p.v !== null && p.target > 0 && p.kind === "food" ? Math.max(0, Math.min(1, (p.v - 40) / Math.max(1, p.target - 40))) : null;
    return html`
<div class="tile ${s.cls}" @click=${(e: Event) => { if ((e.target as HTMLElement).closest("button")) return; this.openEdit(p); }}>
  <div class="th">
    <span class="em">${unsafeHTML(p.kind === "smoker" ? SMOKER_ICON : PROBE_ICON)}<span class="pn">${p.i}</span></span>
    <span class="nm ${p.food ? "" : "none"}">${p.food || `Probe ${p.i}`}</span>
    ${s.word ? html`<span class="word">${s.word}</span>` : nothing}
  </div>
  <div class="mid">
    <div class="temp serif">${p.v === null ? "—" : html`${p.v}<small>°F</small>`}</div>
    <div class="tg">${p.target ? html`<span class="eb">${p.kind === "smoker" ? "Set" : "Pull at"}</span><b>${p.target}°</b>` : nothing}</div>
  </div>
  ${pct !== null ? html`<div class="bar"><i style="width:${Math.round(pct * 100)}%"></i></div>` : nothing}
  ${this.spark(p)}
  <div class="ln">${s.line}</div>
  ${s.done ? html`<button class="btn ink got" @click=${() => this.call("smoke_got_it", { probe: p.i })}>Got it</button>` : nothing}
</div>`;
  }

  /** The last few hours as a line, with the target as a dashed rule. */
  private spark(p: Probe): TemplateResult | typeof nothing {
    const pts = (this.live ? this.hist[p.i] || [] : this.mockHist(p)).slice();
    if (p.v !== null) pts.push([Date.now(), p.v]);
    if (pts.length < 2) return nothing;
    const W = 300, H = 54, t0 = Date.now() - (this.config.hours || 3) * 3600e3;
    const vs = pts.map((x) => x[1]).concat(p.target ? [p.target] : []);
    const lo = Math.min(...vs) - 5, hi = Math.max(...vs) + 5;
    const X = (t: number) => ((Math.max(t, t0) - t0) / (Date.now() - t0)) * W, Y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
    const d = pts.map((x, k) => (k ? "L" : "M") + X(x[0]).toFixed(1) + " " + Y(x[1]).toFixed(1)).join(" ");
    return html`<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      ${p.target ? svg`<line x1="0" x2=${W} y1=${Y(p.target)} y2=${Y(p.target)} class="tl"/>` : nothing}
      ${svg`<path d=${d} class="ln2"/>`}</svg>`;
  }

  private editor(): TemplateResult {
    const e = this.edit!;
    const step = (d: number) => { e.target = Math.max(0, Math.min(600, e.target + d)); this.requestUpdate(); };
    return html`
<div class="scrim" @click=${(ev: Event) => { if (ev.target === ev.currentTarget) { this.edit = null; this.requestUpdate(); } }}>
  <div class="sheet">
    <div class="sh"><span class="eb">Probe ${e.i}</span><h2 class="serif">What's it in?</h2></div>
    <div class="chips">${CHIPS.map(([name, kind, t]) => html`<button class="chip ${e.food === name ? "on" : ""}" @click=${() => { e.food = name; e.kind = kind; e.target = t || e.target; if (kind === "smoker" && !t) e.target = 250; e.typing = false; this.requestUpdate(); }}>${name}</button>`)}
      <button class="chip ${e.typing ? "on" : ""}" @click=${() => { e.typing = true; this.requestUpdate(); }}>Something else…</button></div>
    ${e.typing ? html`<input class="txt" maxlength="40" placeholder="Like: pork belly" .value=${CHIPS.some((c) => c[0] === e.food) ? "" : e.food} @input=${(ev: Event) => { e.food = (ev.target as HTMLInputElement).value; }}>` : nothing}
    <div class="row">
      <span class="eb">${e.kind === "smoker" ? "Smoker set to" : "Tell me at"}</span>
      <div class="stepper"><button @click=${() => step(-5)}>−5</button><button @click=${() => step(-1)}>−1</button><b>${e.target ? e.target + "°F" : "No alert"}</b><button @click=${() => step(1)}>+1</button><button @click=${() => step(5)}>+5</button></div>
    </div>
    <div class="kinds"><button class="chip ${e.kind === "food" ? "on" : ""}" @click=${() => { e.kind = "food"; this.requestUpdate(); }}>In the food</button><button class="chip ${e.kind === "smoker" ? "on" : ""}" @click=${() => { e.kind = "smoker"; this.requestUpdate(); }}>Hanging in the smoker</button></div>
    <div class="foot">
      <button class="btn" @click=${() => { this.call("smoke_probe", { probe: e.i, food: "" }); this.edit = null; this.requestUpdate(); }}>Clear probe</button>
      <span style="flex:1"></span>
      <button class="btn" @click=${() => { this.edit = null; this.requestUpdate(); }}>Cancel</button>
      <button class="btn ink" ?disabled=${!e.food.trim()} @click=${() => { this.call("smoke_probe", { probe: e.i, food: e.food.trim(), target: e.target, kind: e.kind }); this.edit = null; this.requestUpdate(); }}>Save</button>
    </div>
  </div>
</div>`;
  }

  private openEdit(p: Probe): void {
    const chip = CHIPS.find((c) => c[0].toLowerCase() === p.food.toLowerCase());
    this.edit = { i: p.i, food: p.food, kind: p.kind, target: p.target || (chip ? chip[2] : 0), typing: !!p.food && !chip };
    this.requestUpdate();
  }
  private toggleQuiet = () => {
    if (!this.live) { if (this.mock) this.mock.quiet = !this.mock.quiet; this.requestUpdate(); return; }
    this._hass!.callService("input_boolean", this.quiet() ? "turn_off" : "turn_on", {}, { entity_id: "input_boolean.smoke_quiet" });
  };
  private endCook = () => { this.confirmEnd = false; this.call("smoke_end"); this.requestUpdate(); };

  // ------------------------------------------------------------ the made-up cook (mock / preview)
  private startMock(): void {
    const now = Date.now();
    this.mock = {
      start: now - (5 * 60 + 12) * 60000, on: true, quiet: false,
      probes: [
        { i: 1, food: "Brisket", kind: "food", target: 203, v: 164, rate: 0.6, eta: null, flat: true, flags: { w: 0 }, since: now },
        { i: 2, food: "Pork ribs", kind: "food", target: 198, v: 191, rate: 14, eta: 30, flat: false, flags: { n: 0 }, since: now },
        { i: 3, food: "Chicken thighs", kind: "food", target: 165, v: 167, rate: 22, eta: null, flat: false, flags: { d: Math.floor(now / 60000) - 4, n: 0 }, since: now },
        { i: 4, food: "Smoker", kind: "smoker", target: 250, v: 248, rate: -1, eta: null, flat: true, flags: {}, since: now },
      ],
    };
  }
  private mockProbes(): Probe[] { return this.mock!.probes.slice(0, this.n()); }
  private mockHist(p: Probe): Array<[number, number]> {
    const now = Date.now(), out: Array<[number, number]> = [];
    for (let k = 36; k >= 1; k--) {
      const t = now - k * 5 * 60000, x = (36 - k) / 36;
      let v: number;
      if (p.kind === "smoker") v = 250 + Math.sin(k * 1.7) * 6 - (k > 30 ? (k - 30) * 25 : 0);
      else if (p.i === 1) v = 40 + 124 * Math.min(1, x * 1.6) + (x > 0.62 ? Math.sin(k) * 0.8 : 0);
      else if (p.i === 2) v = 40 + (191 - 40) * Math.pow(x, 0.8);
      else v = 40 + (167 - 40) * Math.min(1, x * 1.1);
      if (p.v !== null) out.push([t, Math.round(v)]);
    }
    return out;
  }
  private mockCall(script: string, d: Record<string, unknown>): void {
    const m = this.mock; if (!m) return;
    if (script === "smoke_got_it") m.probes.forEach((p) => { if ((!d.probe || d.probe === p.i) && "d" in p.flags) p.flags.a = 0; });
    if (script === "smoke_end") { m.on = false; m.probes.forEach((p) => { p.food = ""; p.target = 0; p.kind = "food"; p.flags = {}; }); }
    if (script === "smoke_probe") {
      const p = m.probes.find((x) => x.i === d.probe); if (!p) return;
      p.food = String(d.food || ""); p.target = p.food ? Number(d.target || 0) : 0; p.kind = p.food ? ((d.kind as "food" | "smoker") || "food") : "food"; p.flags = {};
    }
    this.requestUpdate();
  }
}

function loadFonts(): void {
  if (document.querySelector('link[data-pik-fonts], link[href*="family=Instrument+Serif"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  link.dataset.pikFonts = "";
  document.head.appendChild(link);
}

if (!customElements.get("pik-smoke-card")) {
  customElements.define("pik-smoke-card", PikSmokeCard);
  const w = window as unknown as { customCards?: Array<Record<string, unknown>> };
  w.customCards = w.customCards || [];
  w.customCards.push({ type: "pik-smoke-card", name: "Pik smoking", description: "The Inkbird's probes: temperatures, targets, how fast they're rising, the stall, and done.", preview: false });
}
