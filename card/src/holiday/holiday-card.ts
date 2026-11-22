// Holiday cooking mode: a full-screen Home Assistant card that runs a big meal's plan.
//
// It is the tested Thanksgiving Kitchen page (claude.ai artifact), moved into the hub:
// the same tabs, timers and alarms, but ticks, timers and turkey readings live in Home Assistant
// (see store.ts), so every screen agrees, the Echos announce each task, and Pik can answer
// "what's next?" or log a temperature by voice.
//
//   type: custom:pik-holiday-card
//   plan: thanksgiving_2026     # a plan bundled in holiday/*.json
//   prefix: tg26                # entity prefix from the generated HA package
//   timers: 12                  # size of the kitchen timer pool
//   mock: false                 # true = keep everything in this browser only
import { LitElement, html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { holidayStyles } from "./holiday-styles";
import { PLANS, type Plan, type Recipe, type Task, type TimerKind, type TimerSpec } from "./plan";
import { HaStore, LocalStore, SPOTS, type Hass, type KTimer, type Store } from "./store";

export interface HolidayConfig { type: string; plan?: string; prefix?: string; timers?: number; mock?: boolean }

type Tab = "now" | "plan" | "recipes" | "turkey" | "final" | "shop" | "notes";
interface Alert { kind: string; when: string; text: string; tm: TimerSpec | null }
interface Local { tab: Tab; day: string | null; step: Record<string, number>; fired: Record<string, number>; rung: Record<string, number> }

const TABS: Array<[Tab, string]> = [["now", "Now"], ["plan", "Timeline"], ["recipes", "Recipes"], ["turkey", "Turkey"], ["final", "Final hour"], ["shop", "Shopping check"], ["notes", "Notes & safety"]];
const LANES: Record<string, string> = { smoker: "Smoker", oven: "Oven", stove: "Stove", prep: "Counter", fridge: "Fridge" };
const LOCS: Array<[string, string]> = [["breast", "Thickest part of the breast"], ["thigh", "Innermost thigh"], ["wing", "Innermost wing"]];
const KLABEL: Record<string, string> = { check: "CHECK NOW", done: "DONE", temp: "TEMP CHECK" };
const SHORTDAY: Record<string, string> = { tue: "Tue ", wed: "Wed ", thu: "Thu " };

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
function fmt12(hm: string): string { let [h, m] = hm.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + (ap === "PM" ? "" : " AM"); }
function fmtDur(ms: number): string { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0"); }
function hmNow(): string { const d = new Date(); const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM"); }

export class PikHolidayCard extends LitElement {
  static styles = [holidayStyles];

  private config: HolidayConfig = { type: "custom:pik-holiday-card" };
  private plan: Plan = PLANS.thanksgiving_2026;
  private store: Store = new LocalStore("pik-holiday-thanksgiving_2026");
  private ha?: HaStore;
  private _hass?: Hass;
  private L: Local = { tab: "now", day: null, step: {}, fired: {}, rung: {} };
  private Q: Alert[] = [];
  private lastRing = 0;
  private ringStart = 0;
  private sheet: { id: string; cook: boolean } | null = null;
  private lastSig = "";
  private soundOff = true;
  private toast = "";
  private _toastT?: number;
  private _sec?: number;
  private _min?: number;
  private actx?: AudioContext;
  private wake: { release(): Promise<void> } | null = null;
  private minuteKey = "";

  // ---------------------------------------------------------------- HA card API

  setConfig(config: HolidayConfig): void {
    if (!config) throw new Error("pik-holiday-card: missing config");
    const plan = PLANS[config.plan || "thanksgiving_2026"];
    if (!plan) throw new Error("pik-holiday-card: unknown plan " + config.plan);
    this.config = config;
    this.plan = plan;
    try { const raw = localStorage.getItem(this.localKey()); if (raw) this.L = Object.assign(this.L, JSON.parse(raw)); } catch (e) { /* ignore */ }
    this.pickStore();
    this.requestUpdate();
  }
  set hass(h: Hass) {
    this._hass = h;
    const wasLive = this.store.live;
    this.pickStore();
    if (this.ha) this.ha.hass = h;
    const sig = this.store.sig();
    if (sig !== this.lastSig || wasLive !== this.store.live) { this.lastSig = sig; this.requestUpdate(); }
  }
  get hass(): Hass { return this._hass as Hass; }
  getCardSize(): number { return 20; }
  static getStubConfig(): HolidayConfig { return { type: "custom:pik-holiday-card", plan: "thanksgiving_2026", prefix: "tg26" }; }

  private entPrefix(): string { return this.config.prefix || "tg26"; }
  private localKey(): string { return "pik-holiday-ui-" + this.plan.id; }
  private saveL(): void { try { localStorage.setItem(this.localKey(), JSON.stringify(this.L)); } catch (e) { /* ignore */ } }

  /** Live when Home Assistant is connected and the holiday package is installed; otherwise this browser only. */
  private pickStore(): void {
    const wantLive = !this.config.mock && !!this._hass;
    if (wantLive) {
      if (!this.ha) {
        const first = Object.values(this.plan.days).sort()[0];
        this.ha = new HaStore(this.entPrefix(), this.config.timers || 12, first + "T00:00:00" + this.plan.tz, () => { this.lastSig = ""; this.requestUpdate(); });
      }
      this.ha.hass = this._hass as Hass;
      if (this.ha.hasEntities()) { this.store = this.ha; return; }
    }
    if (this.store.live || !(this.store instanceof LocalStore)) this.store = new LocalStore("pik-holiday-" + this.plan.id);
  }
  private get missingPackage(): boolean { return !this.config.mock && !!this._hass && !this.store.live; }

  // ---------------------------------------------------------------- lifecycle

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts();
    this._sec = window.setInterval(() => this.tick(), 1000);
    this.addEventListener("pointerdown", this.onPointer, true);
    document.addEventListener("visibilitychange", this.onVis);
    window.setTimeout(() => this.soundBanner(), 800);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._sec);
    clearInterval(this._min);
    this.removeEventListener("pointerdown", this.onPointer, true);
    document.removeEventListener("visibilitychange", this.onVis);
    if (this.wake) { this.wake.release().catch(() => undefined); this.wake = null; }
  }
  private onPointer = () => { this.unlockAudio(); this.keepAwake(); };
  private onVis = () => { if (document.visibilityState === "visible") this.keepAwake(); };

  // ---------------------------------------------------------------- time helpers

  private at(day: string, hm: string): Date { return new Date(this.plan.days[day] + "T" + hm + ":00" + this.plan.tz); }
  private currentDay(): string {
    const days = Object.keys(this.plan.days);
    const now = Date.now();
    let cur = days[0];
    days.forEach((d) => { if (now >= this.at(d, "00:00").getTime()) cur = d; });
    return cur;
  }
  private viewDay(): string { return this.L.day || this.currentDay(); }

  // ---------------------------------------------------------------- sound, wake lock

  private unlockAudio(): void {
    try {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.actx = this.actx || new A();
      if (this.actx.state !== "running") this.actx.resume();
    } catch (e) { /* no audio */ }
    window.setTimeout(() => this.soundBanner(), 300);
  }
  private soundBanner(): void {
    const off = !this.actx || this.actx.state !== "running";
    if (off !== this.soundOff) { this.soundOff = off; this.requestUpdate(); }
  }
  private chime(kind: string): void {
    const w = window as unknown as { __chimes?: Array<{ kind: string; at: number }> };
    (w.__chimes = w.__chimes || []).push({ kind, at: Date.now() });
    try {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = this.actx || (this.actx = new A());
      const notes = kind === "done" ? [784, 988, 1175] : kind === "temp" ? [660, 660, 880] : kind === "task" ? [587, 784] : [880, 740];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.type = "sine"; o.connect(g); g.connect(ctx.destination);
        const t0 = ctx.currentTime + i * 0.22;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
        o.start(t0); o.stop(t0 + 0.55);
      });
    } catch (e) { /* no audio */ }
  }
  private async keepAwake(): Promise<void> {
    try {
      const nav = navigator as unknown as { wakeLock?: { request(t: string): Promise<{ release(): Promise<void>; addEventListener(e: string, f: () => void): void }> } };
      if (!this.wake && nav.wakeLock && document.visibilityState === "visible") {
        const w = await nav.wakeLock.request("screen");
        this.wake = w; w.addEventListener("release", () => (this.wake = null));
      }
    } catch (e) { /* not allowed here */ }
  }

  // ---------------------------------------------------------------- alerts and the 1-second tick

  private pushAlert(kind: string, when: string, text: string, tm?: TimerSpec | null): void {
    this.Q.push({ kind, when, text, tm: tm || null });
    if (!this.ringStart) this.ringStart = Date.now();
    this.lastRing = Date.now();
    this.chime(kind);
    this.requestUpdate();
  }
  private ackAlerts(): void {
    this.Q = []; this.ringStart = 0;
    this.store.timers().filter((t) => t.rang).forEach((t) => this.store.stopTimer(t.key));
    this.requestUpdate();
  }

  private tick(): void {
    const now = Date.now();
    let changed = false;
    // Timers that just finished.
    this.store.timers().forEach((t) => {
      if (!t.rang) return;
      const prev = this.L.rung[t.key];
      if (prev && Math.abs(prev - t.end) < 20000) return;
      this.L.rung[t.key] = t.end; changed = true;
      if (now - t.end > 10 * 60000) return; // finished long ago (screen was asleep): show it, don't ring
      const msg = t.kind === "temp" ? "Turkey temperature check: log breast, thigh and wing." : t.kind === "check" ? "Check now: " + t.label : "Done: " + t.label;
      this.pushAlert(t.kind === "check" ? "task" : t.kind, "Timer", msg);
    });
    // Planned tasks whose time has come (once each, only if not ticked off).
    this.plan.tasks.forEach((t) => {
      const due = this.at(t.day, t.hm).getTime();
      if (due <= now && !this.L.fired[t.id]) {
        this.L.fired[t.id] = 1; changed = true;
        if (!this.store.isDone(t.id) && now - due < 10 * 60000) this.pushAlert("task", fmt12(t.hm), (t.who === "AB" ? "Both: " : "Cook " + t.who + ": ") + t.text, t.tm);
      }
    });
    // Keep chiming every 30 seconds until someone taps "Got it" (for up to 10 minutes).
    if (this.Q.length && now - this.lastRing >= 30000 && now - this.ringStart < 600000) { this.lastRing = now; this.chime(this.Q[this.Q.length - 1].kind); }
    if (changed) this.saveL();
    // Countdowns update in place; the rest redraws once a minute or on a real change.
    this.updateCountdowns();
    const mk = new Date().getMinutes() + ":" + new Date().getHours();
    if (changed || mk !== this.minuteKey) { this.minuteKey = mk; this.requestUpdate(); }
  }
  private updateCountdowns(): void {
    const root = this.renderRoot as ShadowRoot;
    if (!root || !root.querySelectorAll) return;
    const now = Date.now();
    const ts = this.store.timers();
    root.querySelectorAll<HTMLElement>("[data-tid]").forEach((el) => {
      const t = ts.find((x) => x.key === el.dataset.tid);
      const tl = el.querySelector(".tl");
      if (t && tl) tl.textContent = t.rang || t.end <= now ? "0:00" : fmtDur(t.end - now);
    });
    const c = root.querySelector("#clock");
    if (c) { const d = new Date(); let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; c.innerHTML = h + ":" + String(m).padStart(2, "0") + "<small>" + ap + "</small>"; }
  }

  private flash(msg: string): void {
    clearTimeout(this._toastT);
    this.toast = msg; this.requestUpdate();
    this._toastT = window.setTimeout(() => { this.toast = ""; this.requestUpdate(); }, 3200);
  }

  // ---------------------------------------------------------------- turkey

  private turkeyStatus() {
    const L = SPOTS.map((k) => this.store.latest(k));
    if (!L.some((x) => x)) return { cls: "", sym: "—", head: "Not on yet", sub: "Log the first reading after it goes on." };
    if (L.every((x) => x && x.f >= 165)) return { cls: "ok", sym: "✓", head: "Done: 165°F in all three spots", sub: "Off the smoker, tent, rest 30–45 min. Hold at 140°F or hotter." };
    const vals = L.filter((x) => x).map((x) => x!.f);
    const minT = vals.length ? Math.min(...vals) : null;
    const missing = SPOTS.filter((_s, i) => !L[i]);
    return {
      cls: minT != null && minT >= 150 ? "warn" : "hot", sym: minT != null ? minT + "°" : "?", head: "Not done yet" + (minT != null ? ": lowest spot " + minT + "°F" : ""),
      sub: missing.length ? "Still need a reading for: " + missing.join(", ") + "." : "Keep checking every 20–30 minutes. Done only at 165°F everywhere.",
    };
  }

  // ---------------------------------------------------------------- views (HTML strings; the page's tested markup)

  private timerBtn(tm: TimerSpec | null | undefined, small = true): string {
    if (!tm) return "";
    const cls = tm[2] === "check" ? "chk" : tm[2] === "temp" ? "tp" : "dn";
    const word = tm[2] === "check" ? "Check in" : tm[2] === "temp" ? "Temp check in" : "Done in";
    return `<button class="btn ${small ? "sm " : ""}${cls}" data-timer='${esc(JSON.stringify(tm))}'>${word} ${tm[1] >= 120 ? Math.round(tm[1] / 60) + " h" : tm[1] + " min"}</button>`;
  }
  private whoPill(w: string): string { return `<span class="pill ${w === "A" ? "a" : w === "B" ? "b" : "ab"}">${w === "AB" ? "Both" : "Cook " + w}</span>`; }
  private recipe(id: string | null): Recipe | undefined { return id ? this.plan.recipes.find((r) => r.id === id) : undefined; }
  private taskRow(t: Task, highlight: boolean): string {
    const r = this.recipe(t.rid), done = this.store.isDone(t.id);
    return `<div class="task${done ? " done" : ""}${highlight ? " now" : ""}">
    <div class="t">${t.day !== this.viewDay() ? SHORTDAY[t.day] || "" : ""}${fmt12(t.hm)}</div>
    <div class="w"><span class="lane l-${t.lane}"></span>${esc(t.text)}<small>${LANES[t.lane]} · ${t.who === "AB" ? "both cooks" : "Cook " + t.who}${r ? " · " + esc(r.name) : ""}</small></div>
    <div class="acts">${this.timerBtn(t.tm)}${r ? `<button class="btn sm" data-recipe="${r.id}">Recipe</button>` : ""}<button class="tick${done ? " on" : ""}" data-done="${t.id}" aria-label="Mark done">${done ? "✓" : ""}</button></div></div>`;
  }
  private daysBtns(d: string): string {
    return Object.keys(this.plan.days).map((k) => `<button class="btn sm${d === k ? " ink" : ""}" data-day="${k}">${this.plan.dayNames[k]}</button>`).join("");
  }

  private viewNow(): string {
    const d = this.viewDay(), now = new Date();
    const order = Object.keys(this.plan.days);
    const list = this.plan.tasks.filter((t) => t.day === d);
    const pending = list.filter((t) => !this.store.isDone(t.id));
    const soon = new Date(now.getTime() + 10 * 60000), recent = new Date(now.getTime() - 15 * 60000);
    const prior = this.L.day ? [] : this.plan.tasks.filter((t) => order.indexOf(t.day) < order.indexOf(d) && !this.store.isDone(t.id));
    const earlier = prior.concat(pending.filter((t) => this.at(t.day, t.hm) < recent));
    // Due now includes ones already ticked, so a mistaken tick can be undone right there.
    const due = list.filter((t) => this.at(t.day, t.hm) >= recent && this.at(t.day, t.hm) <= soon);
    const next = pending.filter((t) => this.at(t.day, t.hm) > soon).slice(0, 6);
    const ts = this.turkeyStatus();
    const arriving = this.plan.shop.filter((x) => x[2] === "On a grocery order");
    return `<div class="daybar">${this.daysBtns(d)}<span class="note" style="margin-left:8px">${this.L.day ? "Previewing. " : ""}Today is picked automatically from the clock.</span>${this.L.day ? `<button class="btn sm" data-day="">Back to today</button>` : ""}</div>
  ${this.missingPackage ? `<div class="flag" style="margin-bottom:14px"><b>Not shared yet</b><span>The holiday package isn't installed in Home Assistant, so progress is saved on this screen only.</span></div>` : ""}
  <div class="grid2">
    <div class="card">
      <span class="eb">${this.plan.dayNames[d]} · ${pending.length} of ${list.length} left</span>
      <h2 class="serif">${due.some((t) => !this.store.isDone(t.id)) ? "Do these now" : pending.length ? "Coming up" : "All done for " + this.plan.dayNames[d].toLowerCase()}</h2>
      ${earlier.length ? `<details style="margin:2px 0 8px"><summary class="note" style="cursor:pointer">${earlier.length} earlier ${earlier.length === 1 ? "task isn't" : "tasks aren't"} ticked off. Show them</summary>${earlier.map((t) => this.taskRow(t, false)).join("")}</details>` : ""}
      ${due.map((t) => this.taskRow(t, true)).join("")}
      ${next.map((t) => this.taskRow(t, false)).join("")}
      ${!due.length && !next.length && pending.length ? pending.slice(0, 6).map((t) => this.taskRow(t, false)).join("") : ""}
      <p class="note" style="margin-top:12px">Times are the plan; tick tasks off as you go${this.store.live ? " (here, on the Echo Show, or by telling Pik)" : ""}. The full schedule is on the Timeline tab.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card">
        <span class="eb">Turkey</span>
        <div class="tstat" style="margin-top:10px"><div class="tdot ${ts.cls}">${ts.sym}</div><div><b style="font-size:18px">${esc(ts.head)}</b><p class="muted" style="margin:4px 0 0">${esc(ts.sub)}</p></div></div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm ink" data-tab="turkey">Log temperatures</button>${this.timerBtn(["Turkey: temperature check", 20, "temp"])}${this.timerBtn(["Turkey: temperature check", 30, "temp"])}</div>
      </div>
      <div class="card">
        <span class="eb">Alarms</span>
        <div class="kv" style="margin-top:10px">
          <b><span class="st chk">CHECK NOW</span></b><span>Go look: doneness, preheat, water boiling. The food may need more time.</span>
          <b><span class="st ok">DONE</span></b><span>This stage is finished: uncover, take out, move on.</span>
          <b><span class="st miss">TEMP CHECK</span></b><span>Turkey reminder only. The turkey is done by thermometer, never by a timer.</span>
        </div>
        ${this.store.live ? `<div style="display:flex;align-items:center;gap:12px;margin-top:14px"><span style="flex:1;font-size:14px"><b>Echos read each task out loud:</b> ${this.store.alarmsOn() ? "on" : "off"}</span><button class="btn sm" data-alarms="1">${this.store.alarmsOn() ? "Turn off" : "Turn on"}</button></div>` : ""}
      </div>
      <div class="card">
        <span class="eb">Still open</span>
        ${this.plan.shop.filter((x) => x[3] === "miss").map((x) => `<div class="flag"><b>Missing</b><span>${esc(x[0])}: ${esc(x[4])}</span></div>`).join("")}
        ${arriving.length ? `<div class="flag conf"><b>Arriving</b><span>${arriving.map((x, i) => esc(i ? x[0].toLowerCase() : x[0])).join(" and ")} are on the grocery order. Check they came and weren’t substituted.</span></div>` : ""}
        <div class="flag conf"><b>Confirm</b><span>Turkey weight, fresh vs. thawed, and the label. Then the turkey plan locks.</span></div>
      </div>
    </div>
  </div>`;
  }

  private viewPlan(): string {
    const d = this.viewDay();
    const list = this.plan.tasks.filter((t) => t.day === d);
    const times = [...new Set(list.map((t) => t.hm))].sort();
    const smoker = this.plan.smokerTrack[d];
    const lanes = smoker ? ["smoker", "oven", "stove", "prep"] : ["oven", "stove", "prep", "fridge"];
    const laneOf = (t: Task) => (lanes.includes(t.lane) ? t.lane : "prep");
    const track = this.plan.ovenTracks[d] || [];
    const bar = (tr: Array<[string, number, string]>) => `<div class="oventrack" style="margin-top:8px">${tr.map(([l, w, c]) => `<div style="flex:${w};background:${c}">${esc(l)}</div>`).join("")}</div>`;
    return `<div class="daybar">${this.daysBtns(d)}<span class="note">Lanes keep the oven, smoker and burners from double-booking. Tap a block to open its recipe; tick it off (or undo) here too.</span></div>
  <span class="eb">Oven, ${this.plan.dayNames[d]}</span>${bar(track)}
  ${smoker ? `<span class="eb">Smoker</span>${bar(smoker)}` : ""}
  <div class="planhead"><span></span>${lanes.map((l) => `<span class="eb"><span class="lane l-${l}"></span>${LANES[l]}${l === "prep" && smoker ? " · fridge" : ""}</span>`).join("")}</div>
  ${times.map((hm) => `<div class="planrow"><div class="t">${fmt12(hm)}</div>${lanes.map((l) => `<div class="cell">${list.filter((t) => t.hm === hm && laneOf(t) === l).map((t) => `<div class="blk ${t.lane}${this.store.isDone(t.id) ? " done" : ""}" ${t.rid ? `data-recipe="${t.rid}"` : ""}><span class="who">${this.whoPill(t.who)}</span>${esc(t.text)}<button class="btick${this.store.isDone(t.id) ? " on" : ""}" data-done="${t.id}" aria-label="${this.store.isDone(t.id) ? "Ticked off. Tap to undo" : "Tick off"}">${this.store.isDone(t.id) ? "✓ Done" : "Tick off"}</button></div>`).join("")}</div>`).join("")}</div>`).join("")}`;
  }

  private viewRecipes(): string {
    return `<span class="eb">${this.plan.recipes.length} dishes · tap one for ingredients, steps and timers</span><h2 class="serif">Recipes</h2>
  <div class="rgrid">${this.plan.recipes.map((r) => `<button class="rcard" data-recipe="${r.id}"><span class="n">${r.n}</span><span class="nm">${esc(r.name)}</span>
    <span class="tags"><span class="pill">${esc(r.gf)}</span>${(r.flags || []).some((f) => f[0] === "conf") ? `<span class="pill" style="background:#EEF3FA;color:#3A5F86">Confirm</span>` : ""}${(r.flags || []).some((f) => f[0] === "warn") ? `<span class="pill" style="background:var(--tempBg);color:var(--urg)">Provisional</span>` : ""}${r.tag.indexOf("Family") === 0 ? `<span class="pill ab">Family</span>` : ""}</span></button>`).join("")}</div>`;
  }

  private viewSheet(): string {
    if (!this.sheet) return "";
    const { id, cook } = this.sheet;
    const r = this.recipe(id); if (!r) return "";
    const flagHtml = (r.flags || []).map(([k, h, t]) => `<div class="flag ${k === "conf" || k === "jc" ? "conf" : ""}"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("");
    const byDay = Object.keys(this.plan.days).map((d) => [d, r.steps.map((s, i) => ({ s, i })).filter((x) => x.s.d === d)] as const).filter((x) => x[1].length);
    let body: string;
    if (cook) {
      if (this.L.step[id] == null) { const fi = r.steps.findIndex((x) => x.d === this.currentDay()); this.L.step[id] = fi < 0 ? 0 : fi; }
      const i = Math.min(this.L.step[id] || 0, r.steps.length - 1), s = r.steps[i];
      body = `<div class="cook"><div class="clist">${r.steps.map((x, j) => `<button class="cstep${j === i ? " now" : j < i ? " past" : ""}" data-go="${j}"><span class="cn">${j + 1}</span>${esc(x.t.length > 70 ? x.t.slice(0, 68) + "…" : x.t)}</button>`).join("")}</div>
      <div class="cnow"><span class="eb">${this.plan.dayNames[s.d]} · step ${i + 1} of ${r.steps.length}</span><p class="cbig">${esc(s.t)}</p>
      <div>${this.timerBtn(s.tm, false)}</div>
      <div class="cnav"><button class="btn" data-go="${i - 1}">Back</button><button class="btn ink" data-go="${i + 1}">${i === r.steps.length - 1 ? "Finish" : "Next step"}</button></div></div></div>`;
    } else {
      body = `<div class="rdet"><div>
      <div class="meta"><div>Yield<b>${esc(r.yield)}</b></div><div>Gluten<b style="font-size:13px">${esc(r.gf)}</b></div><div>Active<b>${esc(r.active)}</b></div><div>Passive<b style="font-size:13px">${esc(r.passive)}</b></div></div>
      <h3>Ingredients</h3><ul class="ing">${r.ingr.map(([q, it, nt]) => q === "—" ? `<li style="grid-template-columns:1fr"><span class="eb" style="padding-top:6px">${esc(it)}</span></li>` : `<li><b>${esc(q)}</b><span>${esc(it)}${nt ? `<i>${esc(nt)}</i>` : ""}</span></li>`).join("")}</ul>
      <h3 style="margin-top:18px">Equipment</h3><p class="muted" style="font-size:14px">${r.equip.map(esc).join(" · ")}</p>
      <h3>How you know it's done</h3><p style="font-size:14px">${esc(r.done)}</p>
      <h3>Make ahead</h3><p style="font-size:14px">${esc(r.ahead)}</p>
      <h3>Storage</h3><p style="font-size:14px">${esc(r.store)}</p>
      ${r.src ? `<p class="note">Original: <a href="${esc(r.src[1])}" target="_blank" rel="noopener">${esc(r.src[0])}</a>. Steps here are a short summary in our own words.</p>` : `<p class="note">Your family's recipe, as you gave it.</p>`}
    </div><div>${flagHtml}
      ${byDay.map(([d, arr]) => `<h3 class="dayhd">${this.plan.dayNames[d]}</h3><ol class="steps">${arr.map(({ s, i }) => `<li><span class="num">${i + 1}</span><span class="tx">${esc(s.t)}</span><span>${this.timerBtn(s.tm)}</span></li>`).join("")}</ol>`).join("")}
    </div></div>`;
    }
    return `<div class="x"><button class="btn${cook ? "" : " ink"}" data-cook="1">${cook ? "All steps" : "Cook mode"}</button> <button class="btn" data-close="1">Close</button></div>
    <span class="eb">${esc(r.tag)}</span><h2 class="serif" style="font-size:40px;max-width:900px">${r.n}. ${esc(r.name)}</h2>${body}`;
  }

  private viewTurkey(): string {
    const ts = this.turkeyStatus();
    const gal = [1, 1.5, 2, 2.5, 3];
    const reads = this.store.readings();
    const tf = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `<div class="grid2">
  <div class="card">
    <span class="eb">Doneness is by thermometer, never by the clock</span>
    <div class="tstat" style="margin:12px 0 6px"><div class="tdot ${ts.cls}">${ts.sym}</div><div><b style="font-size:20px">${esc(ts.head)}</b><p class="muted" style="margin:4px 0 0">${esc(ts.sub)}</p></div></div>
    <div class="probe">${LOCS.map(([k, l]) => { const x = this.store.latest(k); return `<label>${l}<input id="p-${k}" type="number" inputmode="numeric" placeholder="°F"><span class="last">${x ? "Last: " + x.f + "°F at " + tf(x.t) : "No reading yet"}</span></label>`; }).join("")}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ink" data-logt="1">Log readings</button>${this.timerBtn(["Turkey: temperature check", 20, "temp"], false)}${this.timerBtn(["Turkey: temperature check", 30, "temp"], false)}${this.timerBtn(["Turkey: temperature check", 60, "temp"], false)}</div>
    <p class="note" style="margin-top:12px">USDA: safe at 165°F in the thickest part of the breast, the innermost thigh and the innermost wing. Measure each away from bone. The recipe's 160°F breast pull is not used.${this.store.live ? " You can also tell Pik: “the breast is 158.”" : ""}</p>
    <h3 style="margin-top:16px">Readings</h3>
    <table><tr><th>Time</th><th>Spot</th><th>°F</th><th></th></tr>${reads.slice().reverse().map((x, i) => `<tr><td>${tf(x.t)}</td><td>${x.loc}</td><td><b>${x.f}</b></td><td>${this.store.removeReading ? `<button class="btn sm" data-deltemp="${reads.length - 1 - i}">Remove</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Nothing logged yet.</td></tr>`}</table>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card"><span class="eb">Plan (estimate)</span>
      <div class="kv" style="margin-top:10px"><b>9:30</b><span>Smoker to 250°F</span><b>10:15</b><span>Turkey on, probe in the thigh</span><b>≈12:30</b><span>Raise to 325–350°F for skin</span><b>2:00–2:45</b><span>Expected done window</span><b>+30–45 min</b><span>Rest, tented</span><b>3:20</b><span>Carve</span></div>
      <p class="note" style="margin-top:10px">A flattened 16-lb bird usually takes about 3½–4½ hours on this plan; the real time comes from the thermometer.</p></div>
    <div class="card"><span class="eb">If it's early or late</span>${this.plan.ifs.filter((x) => /^Turkey|^Smoker trouble/.test(x[0])).map(([h, t]) => `<div class="flag"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("")}</div>
    <div class="card"><span class="eb">Brine by volume (Himalayan salt)</span>
      <table class="brine" style="margin-top:8px"><tr><th>Water</th><th>Salt (weigh)</th><th>Brown sugar</th></tr>${gal.map((g) => `<tr><td>${g} gal</td><td><b>${Math.round(230 * g)} g</b></td><td>${(0.75 * g).toFixed(2).replace(/\.?0+$/, "")} cup</td></tr>`).join("")}</table>
      <p class="note" style="margin-top:8px">Make only enough to cover the bird in the bag. Weigh the salt on the kitchen scale. Brine 10 hours, at 40°F or colder.</p></div>
  </div></div>`;
  }

  private viewFinal(): string {
    return `<div class="grid2"><div class="card"><span class="eb">3:00 to 4:00 PM · two cooks · burners 1–5 assigned</span><h2 class="serif">The final hour</h2>
    ${this.plan.finalHour.map((f) => { const on = this.store.isDone(f.id); return `<div class="fh${on ? " on" : ""}"><div class="t">${fmt12(f.hm)}</div><div class="w">${esc(f.text)}<div style="margin-top:6px">${this.whoPill(f.who)}</div></div><button class="tick${on ? " on" : ""}" data-done="${f.id}">${on ? "✓" : ""}</button></div>`; }).join("")}
    <div style="margin-top:14px"><button class="btn sm" data-resetfinal="1">Clear checks</button></div></div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card"><span class="eb">Holding hot dishes (140°F or hotter)</span><div class="kv" style="margin-top:10px"><b>Stuffing, GBC</b><span>Smoker on its lowest setting (200–225°F) from 3:00, covered. GBC goes back in the oven at 3:40.</span><b>Turkey</b><span>Carved, foil, smoker hold from 3:20.</span><b>Potatoes</b><span>Covered, burner 1, lowest.</span><b>Gravy</b><span>Burner 4, lowest, stirred.</span><b>Mac</b><span>Out at 3:35, tented with foil; 20 minutes of resting sets the sauce.</span><b>Backup</b><span>Preheated cooler hot box.</span></div><p class="note" style="margin-top:8px">Verify with the thermometer at 3:30 and 3:50. Foil alone isn’t a holding method.</p></div>
    <div class="card"><span class="eb">Cold pulls</span><div class="kv" style="margin-top:10px">
      <b>2:30</b><span>Deviled eggs, roe dip, chips (back in by 4:30)</span><b>3:00</b><span>Cranberry sauce, vinaigrette</span><b>3:45</b><span>Salad greens</span><b>4:45</b><span>Gooey butter cake (dessert ≈5:15)</span><b>6:00</b><span>Everything back in the fridge</span></div></div>
    <div class="card"><span class="eb">If something slips</span>${this.plan.ifs.map(([h, t]) => `<div class="flag"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("")}</div>
  </div></div>`;
  }

  private viewShop(): string {
    const lbl: Record<string, string> = { ok: "OK", chk: "Confirm", miss: "Missing", jc: "Judgment call", no: "Ordered, not used" };
    return `<span class="eb">Checked against the totals in your notes (no receipts attached)</span><h2 class="serif">Shopping check</h2>
  <div class="card"><table><tr><th>Item</th><th>Needed</th><th>Ordered / on hand</th><th>Status</th><th>Note</th></tr>
  ${this.plan.shop.map(([a, b, c, s, n]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td>${esc(c)}</td><td><span class="st ${s}">${lbl[s]}</span></td><td class="muted">${esc(n)}</td></tr>`).join("")}</table></div>`;
  }

  private viewNotes(): string {
    return `<div class="grid2"><div style="display:flex;flex-direction:column;gap:20px">
    <div class="card"><span class="eb">Bring progress from the Thanksgiving page</span>
      <p style="margin-top:8px">Started on the standalone page? There, open Notes &amp; safety and tap <b>Copy progress for the hub</b>. Then paste here. Ticks, running timers and turkey readings come across.</p>
      <textarea id="imp" rows="3" style="width:100%;border-radius:14px;border:1px solid var(--line);padding:10px;font:13px monospace" placeholder="Paste the progress code"></textarea>
      <div style="margin-top:8px"><button class="btn sm ink" data-import="1">Bring it over</button></div></div>
    <div class="card"><span class="eb">Assumptions (change any of these)</span><ul style="margin:10px 0 0;padding-left:18px;line-height:1.55">${this.plan.assume.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="card"><span class="eb">Optional ideas (not in the plan)</span><ul style="margin:10px 0 0;padding-left:18px;line-height:1.55">${this.plan.optional.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  </div>
  <div class="card"><span class="eb">USDA food safety used in this plan</span>
    ${this.plan.safe.map(([h, t, u]) => `<div class="flag safe"><b>${esc(h)}</b><span>${esc(t)} <a href="${esc(u)}" target="_blank" rel="noopener">USDA</a></span></div>`).join("")}
    <p class="note">Leftovers: shallow containers, fridge within 2 hours, eat within 3–4 days, reheat to 165°F.</p>
    <div style="margin-top:12px"><button class="btn sm" data-resetall="1">Reset all progress${this.store.live ? " (every screen)" : " on this screen"}</button></div></div></div>`;
  }

  private mainHtml(): string {
    const v = { now: () => this.viewNow(), plan: () => this.viewPlan(), recipes: () => this.viewRecipes(), turkey: () => this.viewTurkey(), final: () => this.viewFinal(), shop: () => this.viewShop(), notes: () => this.viewNotes() }[this.L.tab] || (() => this.viewNow());
    return v();
  }

  // ---------------------------------------------------------------- events

  private onClick = (e: Event): void => {
    const el = (e.target as HTMLElement).closest("[data-tab],[data-day],[data-done],[data-timer],[data-recipe],[data-stop],[data-plus],[data-go],[data-cook],[data-close],[data-logt],[data-deltemp],[data-resetfinal],[data-resetall],[data-alarms],[data-import],[data-ack],.sheet") as HTMLElement | null;
    if (!el) return;
    const ds = el.dataset;
    if (el.classList.contains("sheet")) { if (e.target === el) this.closeSheet(); return; }
    if (ds.tab) { this.L.tab = ds.tab as Tab; this.saveL(); this.requestUpdate(); this.scrollTop = 0; return; }
    if (ds.day !== undefined) { this.L.day = ds.day || null; this.saveL(); this.requestUpdate(); return; }
    if (ds.done) { this.store.setDone(ds.done, !this.store.isDone(ds.done)); this.requestUpdate(); return; }
    if (ds.timer) {
      const [l, m, k] = JSON.parse(ds.timer) as TimerSpec;
      this.unlockAudio();
      this.store.startTimer(l, m, k).then((err) => { if (err) this.flash(err); this.requestUpdate(); });
      if (el.closest(".alert")) { el.textContent = "Timer started"; (el as HTMLButtonElement).disabled = true; }
      return;
    }
    if (ds.recipe) { this.sheet = { id: ds.recipe, cook: false }; this.requestUpdate(); return; }
    if (ds.stop) { this.store.stopTimer(ds.stop); this.requestUpdate(); return; }
    if (ds.plus) { this.store.plus5(ds.plus); this.requestUpdate(); return; }
    if (ds.cook) { if (this.sheet) this.sheet.cook = !this.sheet.cook; this.requestUpdate(); return; }
    if (ds.close) { this.closeSheet(); return; }
    if (ds.go !== undefined && this.sheet) {
      const r = this.recipe(this.sheet.id)!; const j = Number(ds.go);
      if (j >= r.steps.length) { this.closeSheet(); return; }
      this.L.step[this.sheet.id] = Math.max(0, j); this.saveL(); this.requestUpdate(); return;
    }
    if (ds.logt) { this.logTemps(); return; }
    if (ds.deltemp && this.store.removeReading) { this.store.removeReading(Number(ds.deltemp)); this.requestUpdate(); return; }
    if (ds.resetfinal) { this.store.setMany(this.plan.finalHour.map((f) => f.id), false); this.requestUpdate(); return; }
    if (ds.resetall) {
      if (confirm("Clear all ticks, turkey readings and timers" + (this.store.live ? " on every screen?" : " on this screen?"))) {
        this.store.resetAll(this.plan.tasks.map((t) => t.id).concat(this.plan.finalHour.map((f) => f.id)));
        this.L = { tab: "now", day: null, step: {}, fired: {}, rung: {} }; this.saveL(); this.requestUpdate();
      }
      return;
    }
    if (ds.alarms) { this.store.setAlarms(!this.store.alarmsOn()); return; }
    if (ds.import) { this.importProgress(); return; }
    if (ds.ack) { this.ackAlerts(); return; }
  };
  private closeSheet(): void { this.sheet = null; this.requestUpdate(); }

  private logTemps(): void {
    const root = this.renderRoot as ShadowRoot;
    const vals: Record<string, number> = {};
    LOCS.forEach(([k]) => { const inp = root.querySelector<HTMLInputElement>("#p-" + k); const v = inp ? parseFloat(inp.value) : NaN; if (!isNaN(v) && v > 30 && v < 250) vals[k] = Math.round(v); });
    if (!Object.keys(vals).length) { this.flash("Type at least one reading first."); return; }
    // Check doneness with the new readings before they round-trip through Home Assistant.
    const after = SPOTS.map((k) => (vals[k] != null ? vals[k] : (this.store.latest(k) || { f: 0 }).f));
    this.store.logTemps(vals);
    LOCS.forEach(([k]) => { const inp = root.querySelector<HTMLInputElement>("#p-" + k); if (inp) inp.value = ""; });
    if (after.every((f) => f >= 165)) this.pushAlert("done", hmNow(), "Turkey is done: 165°F in breast, thigh and wing. Off the smoker, tent, rest.");
    this.requestUpdate();
  }

  /** Progress code from the standalone page: base64 JSON {v:1, done:[ids], temps:[{loc,f,t}], timers:[{label,kind,end}]} */
  private async importProgress(): Promise<void> {
    const ta = (this.renderRoot as ShadowRoot).querySelector<HTMLTextAreaElement>("#imp");
    const code = ta ? ta.value.trim() : "";
    if (!code) { this.flash("Paste the progress code first."); return; }
    let data: { v: number; done: string[]; temps: Array<{ loc: string; f: number; t: number }>; timers: Array<{ label: string; kind: TimerKind; end: number }> };
    try { data = JSON.parse(decodeURIComponent(escape(atob(code.replace(/\s+/g, ""))))); } catch (e) { this.flash("That code didn't read. Copy it again from the page."); return; }
    const known = new Set(this.plan.tasks.map((t) => t.id).concat(this.plan.finalHour.map((f) => f.id)));
    const ids = (data.done || []).filter((i) => known.has(i));
    this.store.setMany(ids, true);
    const latest: Record<string, number> = {};
    (data.temps || []).forEach((r) => { latest[r.loc] = r.f; });
    if (Object.keys(latest).length) this.store.logTemps(latest);
    const now = Date.now();
    let nt = 0;
    for (const t of data.timers || []) {
      const left = (t.end - now) / 60000;
      if (left > 0.1) { await this.store.startTimer(t.label, Math.round(left * 10) / 10, t.kind); nt++; }
    }
    // Tasks that came over ticked shouldn't alarm again.
    ids.forEach((i) => (this.L.fired[i] = 1)); this.saveL();
    if (ta) ta.value = "";
    this.flash("Brought over " + ids.length + " ticked tasks" + (Object.keys(latest).length ? ", turkey readings" : "") + (nt ? " and " + nt + (nt === 1 ? " timer" : " timers") : "") + ".");
    this.requestUpdate();
  }

  // ---------------------------------------------------------------- render

  private timersHtml(): string {
    const now = Date.now();
    return this.store.timers().sort((a, b) => a.end - b.end).map((t: KTimer) => {
      const up = t.rang || t.end <= now;
      return `<div class="tm ${t.kind}${up ? " ring" : ""}" data-tid="${esc(t.key)}"><span class="k">${KLABEL[t.kind] || "TIMER"}</span><span class="tl"></span><span class="lb">${esc(t.label)}</span>
      ${up ? "" : `<button class="btn sm" data-plus="${esc(t.key)}">+5</button>`}<button class="btn sm" data-stop="${esc(t.key)}">${up ? "OK" : "×"}</button></div>`;
    }).join("");
  }
  private alertHtml(): string {
    const show = this.Q.slice(-5), more = this.Q.length - show.length;
    return `<ul>${show.map((a) => `<li class="k-${a.kind}"><b>${esc(a.when)}</b><span>${esc(a.text)}</span><span>${a.tm ? this.timerBtn(a.tm) : ""}</span></li>`).join("")}${more ? `<li><b></b><span>…and ${more} earlier</span><span></span></li>` : ""}</ul>`;
  }

  render() {
    const now = new Date();
    const left = Date.parse(this.plan.dinner) - now.getTime();
    const count = left > 86400000 ? Math.floor(left / 86400000) + " d " + Math.floor((left % 86400000) / 3600000) + " h" : left > 0 ? fmtDur(left).replace(/:\d\d$/, "") : "Happy " + this.plan.title;
    const miss = this.plan.shop.filter((x) => x[3] === "miss").length;
    // The clock and timer countdowns are filled in place each second (updateCountdowns), not by Lit.
    return html`<div class="wrap" @click=${this.onClick}>
<header>
  <div class="hrow">
    <div class="clock" id="clock"></div>
    <div class="title"><span class="eb">Pik House · ${this.plan.title}${this.store.live ? "" : " · this screen only"}</span><b>${this.plan.subtitle}</b></div>
    <div class="count"><span class="eb">${left > 0 ? "Dinner in" : "Dinner"}</span><div class="big">${count}</div></div>
  </div>
  <nav>${TABS.map(([k, v]) => html`<button class=${this.L.tab === k ? "on" : ""} data-tab=${k}>${v}${k === "shop" && miss ? html`<span class="badge">${miss}</span>` : nothing}</button>`)}</nav>
</header>
<main>${unsafeHTML(this.mainHtml())}</main>
<div class="sheet ${this.sheet ? "open" : ""}"><div class="panel">${unsafeHTML(this.viewSheet())}</div></div>
<div id="timerbar">${unsafeHTML(this.timersHtml())}</div>
<div class="alert ${this.Q.length ? "show" : ""}" role="alert">${unsafeHTML(this.alertHtml())}<button class="btn sm" id="alertOk" data-ack="1">Got it</button></div>
<div class="sound ${this.soundOff ? "show" : ""}">🔇 Sound is off. Tap anywhere on the screen once so alarms can ring.</div>
${this.toast ? html`<div class="toast" role="status">${this.toast}</div>` : nothing}
</div>`;
  }

  updated(): void {
    this.updateCountdowns();
    document.title = this.Q.length ? "⏰ " + this.Q[this.Q.length - 1].text.slice(0, 40) : this.plan.title + " · Pik House";
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

if (!customElements.get("pik-holiday-card")) {
  customElements.define("pik-holiday-card", PikHolidayCard);
  const w = window as unknown as { customCards?: Array<Record<string, unknown>> };
  w.customCards = w.customCards || [];
  w.customCards.push({ type: "pik-holiday-card", name: "Pik holiday cooking", description: "Runs a big meal's plan: tasks, timers, alarms and the turkey log.", preview: false });
}
