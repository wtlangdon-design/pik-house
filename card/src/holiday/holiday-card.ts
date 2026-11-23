// Holiday cooking mode: one full-screen page that runs a big meal's plan.
//
// One page, driven by the clock (design: "Holiday cooking: one page v3" on the design canvas):
//   header     clock · the alarm when a task's time comes · turkey · Echo mute · Plan & recipes · countdown
//   stations   smoker · oven · the five burners, now and next
//   left       one card per recipe whose part is due now: its step and that step's ingredients; ‹ › walk through
//              every step of the recipe, and the time moves with them. The next few recipes are listed below.
//   right      timers not already shown on a task · the 12 dishes and where each one is
//   bottom     the day at a glance (Chromebook only); tap it for the full schedule
//   one sheet  Plan & recipes: recipes, full schedule with ticks (settings at the bottom)
// Ticks, step positions, timers, turkey readings and hot checks live in Home Assistant (store.ts),
// so every screen agrees and Pik can read and change them.
//
//   type: custom:pik-holiday-card
//   plan: thanksgiving_2026
//   prefix: tg26
//   timers: 12
//   layout: echo        # optional: the Echo Show 15 (no day strip)
//   mock: false         # true = keep everything in this browser only
import { LitElement, html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { holidayStyles } from "./holiday-styles";
import { DISH_ICON } from "./dish-icons";
import { PLANS, type Plan, type Recipe, type Run, type Task, type TimerKind, type TimerSpec } from "./plan";
import { HaStore, LocalStore, SPOTS, type Hass, type KTimer, type Place, type Store } from "./store";

export interface HolidayConfig { type: string; plan?: string; prefix?: string; timers?: number; mock?: boolean; layout?: string }

type Seg = "recipes" | "schedule";
/** One place in a recipe's run: a part (task) and, if it has any, one of its recipe steps. */
interface Entry { t: Task; r?: Recipe; i?: number; s?: Recipe["steps"][number] }
interface Alert { kind: string; when: string; text: string; at: number }
interface Local { day: string | null; open: string | null; fired: Record<string, number>; rung: Record<string, number>; allDishes: boolean; tips?: Record<string, boolean>; last?: Record<string, [string, number]> }

const LANES: Record<string, string> = { smoker: "Smoker", oven: "Oven", stove: "Stove", prep: "Counter", fridge: "Fridge" };
const SPOTNAME: Record<string, string> = { breast: "Breast", thigh: "Thigh", wing: "Wing" };
const SHORTDAY: Record<string, string> = { tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun", mon: "Mon" };

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
function fmt12(hm: string): string { let [h, m] = hm.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + (ap === "PM" ? "" : " AM"); }
function fmtDur(ms: number): string { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0"); }
function hmNow(): string { const d = new Date(); const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM"); }
// Small station emblems for the "put on" buttons (the burner number sits on the top edge).
const ICON: Record<string, string> = {
  burner: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4.5v3M12 18.5v3M3.5 13h3M17.5 13h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  oven: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3.5" width="18" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6.5" y="10" width="11" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 6.8h.01M10.5 6.8h.01M14 6.8h3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  smoker: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 14a8.5 6 0 0 1 17 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 14h18M7 14v6M17 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 6.5c-1-1 1-2 0-3.5M14 6.5c-1-1 1-2 0-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};
/** A station's emblem: its icon, and for a burner its number as a badge in the top-right corner. */
const emblem = (st: string) => `<span class="ic">${ICON[st[0] === "b" ? "burner" : st]}${st[0] === "b" ? `<span class="pn">${st.slice(1)}</span>` : ""}</span>`;
const stName = (st: string) => (st[0] === "b" ? "Burner " + st.slice(1) : st === "oven" ? "Oven" : "Smoker");
const onWords = (st: string) => (st === "oven" ? "in the oven" : st === "smoker" ? "on the smoker" : "on burner " + st.slice(1));
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

export class PikHolidayCard extends LitElement {
  static styles = [holidayStyles];

  private config: HolidayConfig = { type: "custom:pik-holiday-card" };
  private plan: Plan = PLANS.thanksgiving_2026;
  private store: Store = new LocalStore("pik-holiday-thanksgiving_2026");
  private ha?: HaStore;
  private _hass?: Hass;
  private L: Local = { day: null, open: null, fired: {}, rung: {}, allDishes: false };
  private Q: Alert[] = [];
  private lastRing = 0;
  private ringStart = 0;
  private sheet: { seg: Seg; recipe: string | null; day: string | null } | null = null;
  private turkeyPad: { spot: number; entry: string } | null = null;
  private picker: { i: number } | null = null;
  private askReset = false;
  private seenAck = -1;
  private lastSig = "";
  private soundOff = true;
  private toast = "";
  private _toastT?: number;
  private _sec?: number;
  private actx?: AudioContext;
  private wake: { release(): Promise<void> } | null = null;
  private minuteKey = "";
  private _seq?: Map<string, Entry[]>;
  private keep: { scroll: Record<string, number>; earl: boolean; settings: boolean; resetSheet: boolean } = { scroll: {}, earl: false, settings: false, resetSheet: false };

  // ---------------------------------------------------------------- HA card API

  setConfig(config: HolidayConfig): void {
    if (!config) throw new Error("pik-holiday-card: missing config");
    const plan = PLANS[config.plan || "thanksgiving_2026"];
    if (!plan) throw new Error("pik-holiday-card: unknown plan " + config.plan);
    this.config = config;
    this.plan = plan;
    this._seq = undefined;
    if (config.layout) this.setAttribute("layout", config.layout); else this.removeAttribute("layout");
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
  private get echo(): boolean { return this.config.layout === "echo"; }

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
    this.removeEventListener("pointerdown", this.onPointer, true);
    document.removeEventListener("visibilitychange", this.onVis);
    if (this.wake) { this.wake.release().catch(() => undefined); this.wake = null; }
  }
  private onPointer = () => { this.unlockAudio(); this.keepAwake(); };
  private onVis = () => { if (document.visibilityState === "visible") this.keepAwake(); };

  // ---------------------------------------------------------------- time

  private at(day: string, hm: string): Date { return new Date(this.plan.days[day] + "T" + hm + ":00" + this.plan.tz); }
  private currentDay(): string {
    const days = Object.keys(this.plan.days);
    const now = Date.now();
    let cur = days[0];
    days.forEach((d) => { if (now >= this.at(d, "00:00").getTime()) cur = d; });
    return cur;
  }
  private viewDay(): string { return this.L.day || this.currentDay(); }
  /** The plan day that is actually today's date, if any (before Tuesday nothing is "today"). */
  private todayKey(): string | null {
    const d = new Date(), ymd = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    return Object.keys(this.plan.days).find((k) => this.plan.days[k] === ymd) || null;
  }
  private whenLabel(t: { day: string; hm: string }): string { return (t.day === this.todayKey() ? "" : SHORTDAY[t.day] + " ") + fmt12(t.hm); }

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

  private pushAlert(kind: string, when: string, text: string): void {
    this.Q.push({ kind, when, text, at: Date.now() });
    if (!this.ringStart) this.ringStart = Date.now();
    this.lastRing = Date.now();
    this.chime(kind);
    this.requestUpdate();
  }
  private ackAlerts(): void {
    this.Q = []; this.ringStart = 0;
    this.store.setAck(Date.now());
    this.store.timers().filter((t) => t.rang).forEach((t) => this.store.stopTimer(t.key));
    this.requestUpdate();
  }

  private tick(): void {
    const now = Date.now();
    let changed = false;
    // "Got it" on another screen or by voice clears the alarms that were already showing here.
    const ack = this.store.ackedAt();
    if (this.seenAck < 0) this.seenAck = ack;
    else if (ack > this.seenAck) {
      this.seenAck = ack;
      const before = this.Q.length;
      this.Q = this.Q.filter((a) => a.at > ack);
      if (!this.Q.length) this.ringStart = 0;
      if (this.Q.length !== before) changed = true;
    }
    this.store.timers().forEach((t) => {
      if (!t.rang) return;
      const prev = this.L.rung[t.key];
      if (prev && Math.abs(prev - t.end) < 20000) return;
      this.L.rung[t.key] = t.end; changed = true;
      if (now - t.end > 10 * 60000) return; // finished long ago (screen was asleep): show it, don't ring
      const msg = t.kind === "temp" ? "Turkey temperature check: log breast, thigh and wing." : t.kind === "check" ? "Check now: " + t.label : "Done: " + t.label;
      this.pushAlert(t.kind === "check" ? "task" : t.kind, "Timer", msg);
    });
    this.plan.tasks.forEach((t) => {
      const due = this.at(t.day, t.hm).getTime();
      if (due <= now && !this.L.fired[t.id]) {
        this.L.fired[t.id] = 1; changed = true;
        if (!this.store.isDone(t.id) && now - due < 10 * 60000) this.pushAlert("task", fmt12(t.hm), t.text);
      }
    });
    if (this.Q.length && now - this.lastRing >= 30000 && now - this.ringStart < 600000) { this.lastRing = now; this.chime(this.Q[this.Q.length - 1].kind); }
    if (changed) this.saveL();
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

  // ---------------------------------------------------------------- plan helpers

  private recipe(id: string | null): Recipe | undefined { return id ? this.plan.recipes.find((r) => r.id === id) : undefined; }
  /** The recipe steps a task covers. */
  private stepsOf(t: Task) {
    return (t.steps || []).map(([rid, i]) => { const r = this.recipe(rid); return { r: r as Recipe, i, s: r ? r.steps[i] : undefined }; }).filter((x) => x.r && x.s) as Array<{ r: Recipe; i: number; s: Recipe["steps"][number] }>;
  }
  /** A step's ingredients as [amount, item], using the step's own amount where it uses only part. */
  private stepIngr(r: Recipe, s: Recipe["steps"][number]): Array<[string, string]> {
    return (s.ing || []).map(([k, q, w]) => {
      const g = k >= 0 ? r.ingr[k] : undefined;
      // An amount given for the step wins, even an empty one ("salt, for the water" has no amount).
      return [q !== undefined && q !== null ? q : g ? g[0] : "", w || (g ? g[1] : "")] as [string, string];
    }).filter((x) => x[1]);
  }
  /** Step text without the time it starts with (the task already shows the time). */
  private stepText(t: string): string {
    const m = t.match(/^(?:About |≈)?\d{1,2}:\d\d (?:AM|PM): (.*)$/s);
    const x = m ? m[1] : t;
    return x.charAt(0).toUpperCase() + x.slice(1);
  }
  // ---------------------------------------------------------------- one card per recipe

  /** Which card a task belongs to: its recipe; a job that isn't part of a recipe is its own small reminder card. */
  private gid(t: Task): string { return t.rid || t.id; }
  private gname(g: string): string {
    const d = this.plan.dishes.find((x) => x.id === g);
    return d ? d.name : (this.recipe(g) || { name: "" }).name;
  }
  /** Every recipe's run from start to finish: each part in time order, each part's steps in order. */
  private seqs(): Map<string, Entry[]> {
    if (this._seq) return this._seq;
    const m = new Map<string, Entry[]>();
    const order = Object.keys(this.plan.days);
    const tasks = this.plan.tasks.slice().sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day) || (a.hm < b.hm ? -1 : a.hm > b.hm ? 1 : 0));
    tasks.forEach((t) => {
      const g = this.gid(t);
      if (!m.has(g)) m.set(g, []);
      const st = this.stepsOf(t);
      if (st.length) st.forEach((x) => m.get(g)!.push({ t, r: x.r, i: x.i, s: x.s }));
      else m.get(g)!.push({ t });
    });
    return (this._seq = m);
  }
  private parts(g: string): Task[] { return [...new Set((this.seqs().get(g) || []).map((e) => e.t))]; }
  private ms(t: Task): number { return this.at(t.day, t.hm).getTime(); }
  private isDue(t: Task, now = Date.now()): boolean { return this.ms(t) <= now + 10 * 60000; }
  /** The part of a recipe to do now: the first open part that has started. Ticking moves the card on.
   *  A part left unticked more than 30 minutes behind a newer one, or over an hour old, folds away so the card keeps up.
   *  Nothing started: the next part. On another day's preview: that day's first open part. */
  private partOf(g: string, day: string, live: boolean): { cur: Task; behind: Task[] } | null {
    // Only the day on screen: a dish never runs on into tomorrow's steps.
    const open = this.parts(g).filter((t) => t.day === day && !this.store.isDone(t.id));
    if (!open.length) return null;
    if (!live) return { cur: open[0], behind: [] };
    const now = Date.now();
    const started = open.filter((t) => this.ms(t) <= now);
    if (started.length) {
      const latest = Math.max(...started.map((t) => this.ms(t)));
      const keep = (t: Task) => this.ms(t) >= latest - 30 * 60000 && this.ms(t) >= now - 60 * 60000;
      const cur = started.find(keep);
      if (cur) return { cur, behind: started.filter((t) => !keep(t)) };
      const nxt = open.find((t) => this.ms(t) > now);
      return { cur: nxt || started[started.length - 1], behind: nxt ? started : started.slice(0, -1) };
    }
    return { cur: open[0], behind: [] };
  }
  /** The last place in a recipe's run that belongs to the day on screen (› stops there). */
  private dayEnd(g: string): number {
    const seq = this.seqs().get(g)!, d = this.viewDay();
    let last = -1;
    seq.forEach((e, i) => { if (e.t.day === d) last = i; });
    return last < 0 ? seq.length - 1 : last;
  }
  /** Where a recipe's card is: never before the part it's on (‹ stops there), never past the end. */
  private cardIdx(g: string, cur: Task): number {
    const seq = this.seqs().get(g)!;
    const start = seq.findIndex((e) => e.t === cur);
    return Math.max(start, Math.min(this.store.getStep(g), this.dayEnd(g)));
  }
  /** The timer that goes with one place in a recipe: the step's own, or the part's if none of its steps has one. */
  private timerOf(e: Entry): TimerSpec | null {
    if (e.s && e.s.tm) return e.s.tm;
    return this.stepsOf(e.t).some((x) => x.s.tm) ? null : e.t.tm;
  }
  private timerByLabel(label: string): KTimer | undefined { return this.store.timers().find((x) => x.label === label); }

  // ---------------------------------------------------------------- what's on the stove, in the oven, on the smoker

  private get runs(): Run[] { return this.plan.runs || []; }
  private taskById(id: string): Task | undefined { return this.plan.tasks.find((t) => t.id === id); }
  /** A placement counts until the part that ends its run is ticked off; then the burner frees itself. */
  private alive = (p: Place): boolean => { const u = this.runs[p.i]; return !!u && !this.store.isDone(u.to); };
  private onNow(): Array<{ p: Place; u: Run }> { return this.store.places().filter(this.alive).map((p) => ({ p, u: this.runs[p.i] })); }
  private placed(i: number): Place | undefined { return this.store.places().find((p) => p.i === i && this.alive(p)); }
  private runStart(u: Run): number { const t = this.taskById(u.from); return t ? this.ms(t) : 0; }
  private runEnd(u: Run): number { const t = this.taskById(u.from); return t ? this.at(t.day, u.until).getTime() : 0; }
  /** The plan's run for a station right now that nobody has put on yet (shown faded on the tile, even if its first part is ticked). */
  private plannedNow(st: string) {
    const now = Date.now();
    return this.runs.map((u, i) => ({ u, i })).find(({ u, i }) => u.st === st && !this.placed(i) && !this.store.isDone(u.to) && this.runStart(u) <= now && now < this.runEnd(u));
  }
  private plannedNext(st: string) {
    const now = Date.now();
    return this.runs.map((u, i) => ({ u, i })).filter(({ u, i }) => u.st === st && !this.placed(i) && !this.store.isDone(u.from) && this.runStart(u) > now).sort((a, b) => this.runStart(a.u) - this.runStart(b.u))[0];
  }
  private whenMs(ms: number): string {
    const d = new Date(ms), hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    const day = Object.keys(this.plan.days).find((k) => this.plan.days[k] === d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
    return (day && day !== this.todayKey() ? SHORTDAY[day] + " " : "") + fmt12(hm) + (hm >= "12:00" ? " PM" : "");
  }
  /** The emblem button on a card: tap to put the dish on its burner / in the oven / on the smoker, tap again to take it off. */
  private placeBtn(i: number, preview = false): string {
    const u = this.runs[i], pl = this.placed(i);
    if (preview && !pl) {
      // Looking ahead: show where it will go, not tappable until that step comes up.
      const t = this.taskById(u.from);
      const tip = `The ${u.l.toLowerCase()} goes ${onWords(u.st)} at ${t ? this.when(t) : "its time"}.`;
      return `<button class="pl pre ${u.st[0] === "b" ? "burner" : u.st}" disabled title="${esc(tip)}" aria-label="${esc(tip)}">${emblem(u.st)}</button>`;
    }
    const st = pl ? pl.st : u.st;
    const busy = !pl && st[0] === "b" ? this.onNow().find((x) => x.p.st === st) : undefined;
    const state = pl ? "on" : busy ? "busy" : "free";
    const kind = st[0] === "b" ? "burner" : st;
    const title = pl ? `${u.l}: ${onWords(st)}. Tap to take it off.` : busy ? `${stName(st)} has the ${busy.u.l.toLowerCase()} on it. Tap to pick another burner.` : `Put the ${u.l.toLowerCase()} ${onWords(st)}`;
    return `<button class="pl ${state} ${kind}" data-place="${i}" title="${esc(title)}" aria-label="${esc(title)}">${emblem(st)}${busy ? `<span class="bang">!</span>` : ""}</button>`;
  }
  /** Runs whose emblem belongs on this part's card: the ones that start here, and ones already on that this part is within. */
  private runsFor(g: string, t: Task): number[] {
    const at = this.ms(t);
    return this.runs.map((u, i) => ({ u, i })).filter(({ u, i }) => u.r === g && !this.store.isDone(u.to) && (u.from === t.id || (!!this.placed(i) && this.runStart(u) <= at && at <= this.ms(this.taskById(u.to) || t)))).map((x) => x.i);
  }
  private pickerHtml(): string {
    const i = this.picker!.i, u = this.runs[i];
    const on = this.onNow();
    const now = Date.now();
    return `<button class="scrim2" data-pickclose="1" aria-label="Close"></button><div class="tpop pick" role="dialog" aria-label="Pick a burner">
      <div class="tph"><div><h3 class="serif">Which burner?</h3><p>For the ${esc(u.l.toLowerCase())}. ${esc(stName(u.st))} isn't free.</p></div><button class="btn sm" data-pickclose="1">Cancel</button></div>
      <div class="bpick">${[1, 2, 3, 4, 5].map((n) => { const x = on.find((y) => y.p.st === "b" + n); return x
        ? `<button disabled>${emblem("b" + n)}<b>${esc(x.u.l)}</b><span>on ${Math.max(1, Math.round((now - x.p.at) / 60000))} min</span></button>`
        : `<button data-pick="${i}:b${n}">${emblem("b" + n)}<b>Free</b><span>${n === Number(u.st.slice(1)) ? "" : "use this one"}</span></button>`; }).join("")}</div></div>`;
  }
  private isToday(): boolean { return !this.L.day || this.L.day === this.currentDay(); }

  /** The recipe cards for the left column. */
  private cards() {
    const d = this.viewDay(), now = Date.now(), order = Object.keys(this.plan.days), live = this.isToday();
    // Cards are for dishes only. Jobs outside a recipe ("Dinner", the 140°F checks, leftovers) still ring as alarms.
    const groups = [...this.seqs().keys()].filter((g) => !!this.recipe(g));
    const byTime = (a: { cur: Task }, b: { cur: Task }) => this.ms(a.cur) - this.ms(b.cur) || this.plan.tasks.indexOf(a.cur) - this.plan.tasks.indexOf(b.cur);
    const due: Array<{ g: string; cur: Task }> = [], next: Array<{ g: string; cur: Task }> = [], done: Array<{ g: string; t: Task }> = [];
    let behind: Task[] = [];
    groups.forEach((g) => {
      const dayParts = this.parts(g).filter((t) => t.day === d);
      if (!dayParts.length) return;
      const p = this.partOf(g, d, live);
      // Everything for this dish today is done: it goes to the bottom and stops (tomorrow's steps wait for tomorrow).
      if (!p) { done.push({ g, t: dayParts[dayParts.length - 1] }); return; }
      behind = behind.concat(p.behind);
      if (live && this.isDue(p.cur, now)) { due.push({ g, cur: p.cur }); return; }
      // An old part nobody ticked, with nothing later today, folds into the earlier list instead.
      if (live && this.ms(p.cur) < now) { if (behind.indexOf(p.cur) < 0) behind = behind.concat([p.cur]); return; }
      next.push({ g, cur: p.cur });
    });
    // Parts from earlier days nobody ticked off.
    if (live) behind = behind.concat(this.plan.tasks.filter((t) => !!t.rid && order.indexOf(t.day) < order.indexOf(d) && !this.store.isDone(t.id)));
    return { due: due.sort(byTime), done: done.sort((a, b) => this.ms(a.t) - this.ms(b.t)), next: next.sort(byTime), behind: behind.sort((a, b) => this.ms(a) - this.ms(b)) };
  }
  private inFinalHour(): boolean {
    const h = this.plan.hotCheck, now = Date.now();
    return this.isToday() && this.currentDay() === h.day && now >= this.at(h.day, "15:00").getTime() && now < this.at(h.day, h.to).getTime();
  }

  // ---------------------------------------------------------------- stations

  private segNow(name: string) {
    const now = Date.now();
    const segs = this.plan.stations[name] || [];
    const cur = segs.find(([d, a, b]) => this.plan.days[d] && now >= this.at(d, a).getTime() && now < this.at(d, b).getTime());
    const nxt = segs.find(([d, a, , , w]) => this.plan.days[d] && this.at(d, a).getTime() > now && (!cur || w !== cur[4]));
    const nextWhat = nxt ? nxt[4] : "";
    const nextWhen = nxt ? (nxt[0] === this.todayKey() ? "" : SHORTDAY[nxt[0]] + " ") + fmt12(nxt[1]) + (nxt[1] >= "12:00" ? " PM" : "") + (nxt[3] && /°F/.test(nxt[3]) ? " · " + nxt[3] : "") : "";
    return { cur, nextWhat, nextWhen };
  }
  private stationsHtml(): string {
    const big = (name: string, label: string) => {
      const sn = this.segNow(name);
      let cur = sn.cur;
      // The plan says the turkey is off by 2:45; if the thermometer disagrees, the smoker tile says so.
      if (name === "smoker" && cur && cur[0] === this.plan.hotCheck.day && !this.store.isDone("thu_1445_turkey")) {
        const r = SPOTS.map((k) => this.store.latest(k));
        if (r.some((x) => x) && !r.every((x) => x && x.f >= 165) && cur[2] > "14:45") cur = [cur[0], cur[1], cur[2], "325–350°F", "Turkey · not 165°F yet"];
      }
      // Dishes actually put in / on show solid; otherwise the plan's line, faded.
      const on = this.onNow().filter((x) => x.p.st === name);
      const what = on.length ? `<b>${esc(on.map((x) => x.u.l).join(" · "))}</b>` : `<b class="${cur && /[a-z]/i.test(cur[4]) ? "pl8" : ""}">${esc(cur ? cur[4] : "Off")}</b>`;
      return `<div class="sn ${name}${cur || on.length ? "" : " idle"}${on.length ? " on" : ""}">${emblem(name)}<div class="snb"><span class="eb">${label} ${cur && cur[3] ? `<span class="tp">${esc(cur[3])}</span>` : ""}</span>${what}${sn.nextWhat ? `<i>next: ${esc(sn.nextWhat)} · ${esc(sn.nextWhen)}</i>` : ""}</div></div>`;
    };
    // Burners show what's actually been put on (solid); what the plan expects but nobody has put on yet is faded.
    const now = Date.now();
    const burners = [1, 2, 3, 4, 5].map((n) => {
      const st = "b" + n, on = this.onNow().filter((x) => x.p.st === st), plan = this.plannedNow(st), nx = this.plannedNext(st);
      const nextLines = nx ? `<i>next: ${esc(nx.u.l)} · ${esc(this.whenMs(this.runStart(nx.u)))}</i>` : "";
      if (on.length) {
        const waiting = plan && plan.u.r !== on[0].u.r ? plan : undefined;
        return `<div class="bn on${waiting ? " clash" : ""}">${emblem(st)}<div><b>${esc(on.map((x) => x.u.l).join(" + "))}</b>${waiting ? `<i class="w">${esc(waiting.u.l)} is waiting</i>` : `<i>on ${Math.max(1, Math.round((now - on[0].p.at) / 60000))} min</i>`}</div></div>`;
      }
      if (plan) return `<div class="bn plan">${emblem(st)}<div><b>${esc(plan.u.l)}</b><i>planned · not on yet</i></div></div>`;
      return `<div class="bn free">${emblem(st)}<div><b>Free</b>${nextLines}</div></div>`;
    }).join("");
    return `<div class="stn">${big("smoker", "Smoker")}${big("oven", "Oven")}<div class="stovebox"><span class="eb">Stove · 5 burners</span><div class="burners">${burners}</div></div></div>`;
  }

  // ---------------------------------------------------------------- turkey

  private turkeyStatus() {
    const L = SPOTS.map((k) => this.store.latest(k));
    const tf = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (!L.some((x) => x)) {
      const nx = this.plan.tasks.find((t) => t.rid === "turkey" && !this.store.isDone(t.id));
      return { cls: "off", sym: "—", head: "Turkey: not on yet", sub: nx ? clip(this.whenLabel(nx) + " · " + nx.text, 34) : "" };
    }
    if (L.every((x) => x && x.f >= 165)) return { cls: "ok", sym: "✓", head: "Turkey: done", sub: "165°F in all three · rest it" };
    const have = L.map((x, i) => ({ x, i })).filter((o) => o.x);
    const low = have.reduce((a, b) => (b.x!.f < a.x!.f ? b : a));
    return { cls: low.x!.f >= 150 ? "warn" : "hot", sym: low.x!.f + "°", head: "Turkey: lowest " + low.x!.f + "°F", sub: SPOTNAME[SPOTS[low.i]] + " · " + tf(low.x!.t) + (have.length < 3 ? " · log all 3" : "") };
  }

  // ---------------------------------------------------------------- the dish board

  private dishRows() {
    const now = Date.now(), recent = now - 15 * 60000, today = this.todayKey();
    const hc = this.plan.hotCheck;
    const hotWin = this.isToday() && this.currentDay() === hc.day && now >= this.at(hc.day, hc.from).getTime() && now < this.at(hc.day, hc.to).getTime();
    const involves = (t: Task, d: string) => t.rid === d || (t.steps || []).some(([r]) => r === d) || (t.dish || []).some((e) => e[0] === d);
    const readings = SPOTS.map((k) => this.store.latest(k));
    return this.plan.dishes.map((dish) => {
      let state = "wait", words = "";
      this.plan.tasks.forEach((t) => { if (this.store.isDone(t.id)) (t.dish || []).forEach((e) => { if (e[0] === dish.id) { state = e[1]; words = e[2]; } }); });
      const active = this.plan.tasks.find((t) => involves(t, dish.id) && !this.store.isDone(t.id) && this.at(t.day, t.hm).getTime() <= now && this.at(t.day, t.hm).getTime() >= recent);
      if (active) { state = state === "hot" ? "hot" : "act"; words = "In progress"; }
      if (!words) {
        const nx = this.plan.tasks.find((t) => involves(t, dish.id) && !this.store.isDone(t.id));
        words = nx ? (nx.day === today ? fmt12(nx.hm) + " today" : SHORTDAY[nx.day] + " " + fmt12(nx.hm)) : "";
      }
      let tky = false;
      if (dish.id === "turkey" && readings.some((x) => x) && !this.store.isDone("thu_1445_turkey")) { words = SPOTS.map((k, i) => SPOTNAME[k] + " " + (readings[i] ? readings[i]!.f : "–")).join(" · "); tky = true; }
      const hot = dish.hot && hotWin;
      const checked = hot && this.store.isHot(dish.id);
      if (checked) { state = "ok"; words = "Hot · 140°F+ ✓"; }
      return { dish, state, words, tky, hotBtn: hot && !checked, checked };
    });
  }
  private dishesHtml(): string {
    const rows = this.dishRows();
    const busy = rows.some((r) => r.state === "act" || r.state === "hot" || r.hotBtn);
    const group = busy && !this.L.allDishes;
    const ready = group ? rows.filter((r) => r.state === "cold" && !r.tky) : [];
    const shown = rows.filter((r) => ready.indexOf(r) < 0);
    const row = (r: ReturnType<PikHolidayCard["dishRows"]>[number]) =>
      `<div class="dr${r.tky ? " tky" : ""}" ${r.dish.id === "turkey" ? `data-turkey="1"` : `data-dish="${r.dish.id}"`}><span class="sd ${r.state}"></span><b>${esc(r.dish.name)}</b>${r.hotBtn ? `<button class="hotbtn" data-hot="${r.dish.id}">140°F ✓</button>` : `<span class="${r.checked ? "g" : r.state === "act" ? "w" : ""}">${esc(r.words)}</span>`}</div>`;
    const title = this.inFinalHour() ? "Keeping hot · tap 140°F ✓ after each check" : rows.every((r) => r.state === "wait") ? "The " + rows.length + " dishes · nothing made yet" : "The " + rows.length + " dishes · where everything is";
    const foot = ready.length ? `<div class="dr grp" data-alldishes="1"><span class="sd cold"></span><b>Ready (${ready.length})</b><span>${esc(ready.map((r) => r.dish.name).join(", "))} ▸</span></div>`
      : busy && this.L.allDishes ? `<div class="dr grp" data-alldishes="1"><span></span><b></b><span>Fold the ready ones ▴</span></div>` : "";
    return `<div class="rcard2 dcard"><span class="eb">${title}</span><span class="dkey">Amber: in progress · gray: made, waiting · green: hot and checked</span>
      <div class="dlist">${shown.map(row).join("")}${foot}</div></div>`;
  }

  // ---------------------------------------------------------------- the Now list

  private timerBtnHtml(tm: TimerSpec | null): string {
    if (!tm) return "";
    const k = this.timerByLabel(tm[0]);
    if (k && k.rang) return `<button class="sb rang" data-stop="${esc(k.key)}">Time's up · OK</button>`;
    if (k) return `<button class="sb run" data-tid="${esc(k.key)}" data-plus="${esc(k.key)}" title="Tap for 5 more minutes"><span class="tl"></span> left</button>`;
    const len = tm[1] >= 120 ? (Math.round(tm[1] / 6) / 10) + " hr" : tm[1] + " min";
    return `<button class="sb set" data-timer='${esc(JSON.stringify(tm))}' title="${esc(tm[0])}">Set ${len} timer</button>`;
  }
  /** A small pie: how many of the dish's parts are done (fills a slice per part). */
  private pieHtml(g: string): string {
    const ps = this.parts(g), n = ps.length, k = ps.filter((t) => this.store.isDone(t.id)).length, f = n ? k / n : 0;
    const r = 7, c = 9;
    let wedge = "";
    if (f >= 1) wedge = `<circle cx="${c}" cy="${c}" r="${r}" fill="currentColor"/>`;
    else if (f > 0) {
      const a = f * 2 * Math.PI, x = c + r * Math.sin(a), y = c - r * Math.cos(a);
      wedge = `<path d="M${c} ${c} L${c} ${c - r} A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="currentColor"/>`;
    }
    const ticks = n > 1 && n <= 12 ? Array.from({ length: n }, (_x, i) => { const a = (i / n) * 2 * Math.PI; return `<line x1="${c}" y1="${c}" x2="${(c + r * Math.sin(a)).toFixed(2)}" y2="${(c - r * Math.cos(a)).toFixed(2)}" stroke="currentColor" stroke-width=".8" opacity=".35"/>`; }).join("") : "";
    return `<svg class="pie" viewBox="0 0 18 18" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.6"/>${ticks}${wedge}</svg>`;
  }
  /** Undo for the part just ticked on this dish (for 10 minutes), shown on the dish's card as it moves on. */
  private undoHtml(g: string): string {
    const l = (this.L.last || {})[g];
    if (!l || Date.now() - l[1] > 10 * 60000 || !this.store.isDone(l[0])) return "";
    return `<button class="ubtn" data-done="${l[0]}" data-g="${g}" title="Undo the last Done on this dish">Undo</button>`;
  }
  private pieLabel(g: string): string { const ps = this.parts(g), k = ps.filter((t) => this.store.isDone(t.id)).length; return k + " of " + ps.length + " parts of this dish done"; }
  private nameHtml(g: string): string {
    return this.recipe(g) ? `<button class="dlink" data-recipe="${g}" title="The whole recipe">${esc(this.gname(g))}</button>` : `<span class="dlink">${esc(this.gname(g))}</span>`;
  }
  /** For a card's time column: the day (if not the day on screen) above the time, and the time never splits. */
  private timeCell(t: Task): string {
    const fm = fmt12(t.hm);
    const full = /AM$/.test(fm) ? fm : fm + " PM";
    return (t.day !== this.viewDay() ? `<span class="dy">${SHORTDAY[t.day]}</span>` : "") + `<span class="hm">${full}</span>`;
  }
  private when(t: Task): string { return (t.day !== this.viewDay() ? SHORTDAY[t.day] + " " : "") + fmt12(t.hm); }
  /** One recipe's card: the part it's on, that part's step and ingredients; ‹ › walk the whole recipe and the time follows. */
  private cardHtml(g: string, cur: Task, due: boolean, foldable = false): string {
    const seq = this.seqs().get(g)!, n = seq.length;
    const start = seq.findIndex((e) => e.t === cur);
    const idx = this.cardIdx(g, cur), e = seq[idx];
    const ahead = e.t !== cur && !this.isDue(e.t);
    const tm = ahead ? null : this.timerOf(e);
    const k = tm ? this.timerByLabel(tm[0]) : undefined;
    const ings = e.s && e.r ? this.stepIngr(e.r, e.s) : [];
    const started = this.ms(e.t) <= Date.now();
    const mins = Math.ceil((this.ms(e.t) - Date.now()) / 60000);
    const badge = !this.isToday() ? "" : ahead ? `<small>later</small>` : due ? (started ? `<small class="now">Now</small>` : `<small>in ${mins} min</small>`) : "";
    const est = e.s && e.s.min ? `<span class="est" title="About how long the work takes${tm ? "; the timer covers the waiting" : ""}">≈ ${e.s.min} min of work</span>` : "";
    if (!this.recipe(g)) {
      // A job outside any recipe: just the time, what to do, a timer if it has one, and a tick.
      return `<div class="tc rem${due ? " due" : ""}${k && k.rang ? " ringing" : ""}"><div class="tt">${this.timeCell(e.t)}${badge}</div>
        <div><div class="x">${esc(e.t.text)}</div></div>
        <div class="acts">${this.timerBtnHtml(tm)}<button class="dbtn" data-done="${e.t.id}" title="${this.pieLabel(g)}" aria-label="Done">${this.pieHtml(g)}Done</button></div></div>`;
    }
    const pips = n > 1 ? `<span class="pips">${seq.map((x, j) => `<i class="${j === idx ? "on" : j < start ? "past" : x.t === e.t ? "part" : ""}"></i>`).join("")}</span>` : "";
    // ‹ › sit on either side of the step itself, like flipping through pages.
    const prev = `<button class="ar" data-step="${g}:${idx - 1}"${idx <= start ? " disabled" : ""} aria-label="Previous step">‹</button>`;
    const next = `<button class="ar" data-step="${g}:${idx + 1}"${idx >= this.dayEnd(g) ? " disabled" : ""} aria-label="Next step">›</button>`;
    return `<div class="tc rc3${due && !ahead ? " due" : ""}${ahead ? " ahead" : ""}${k && k.rang ? " ringing" : ""}">
      <div class="tt">${this.timeCell(e.t)}${badge}</div>
      <div class="hd3"><div class="nm">${this.nameHtml(g)}${n > 1 ? `<span class="sc">step ${idx + 1} of ${n}</span>${pips}` : ""}${est}</div>${e.s ? "" : `<div class="x">${esc(e.t.text)}</div>`}</div>
      <div class="acts">${ahead ? `${foldable ? `<button class="clp" data-collapse="1" title="Fold this card" aria-label="Fold this card">▴</button>` : ""}${this.runsFor(g, e.t).map((i) => this.placeBtn(i, true)).join("")}<button class="sb" data-step="${g}:${start}">Back to now</button>` : `${foldable ? `<button class="clp" data-collapse="1" title="Fold this card" aria-label="Fold this card">▴</button>` : ""}${this.runsFor(g, e.t).map((i) => this.placeBtn(i)).join("")}${this.timerBtnHtml(tm)}${this.undoHtml(g)}<button class="dbtn" data-done="${e.t.id}" data-g="${g}" title="${this.pieLabel(g)}" aria-label="Done with this part">${this.pieHtml(g)}Done</button>`}</div>
      ${this.tipsHtml(e.t)}
      ${e.s || n > 1 ? `<div class="stp${n > 1 ? " car" : ""}">${n > 1 ? prev : ""}${e.s ? `<div class="sb2${ings.length ? " two" : ""}"><p>${esc(this.stepText(e.s.t))}</p>${ings.length ? `<div class="si">${ings.map(([q, it]) => `<b>${esc(q)}</b><span>${esc(it)}</span>`).join("")}</div>` : ""}</div>` : `<div class="sb2"><p class="muted">Nothing more to this step than the line above.</p></div>`}${n > 1 ? next : ""}</div>` : ""}
    </div>`;
  }
  /** "If something slips" help for this part, folded to one line until tapped. */
  private tipsHtml(t: Task): string {
    if (!t.tips || !t.tips.length) return "";
    const open = (this.L.tips || {})[t.id];
    return `<div class="tips">${t.tips.map(([q, a], j) => `<button class="tipq${open ? " on" : ""}" data-tip="${t.id}"><span class="bp">Backup plan</span>${esc(q)}${open ? " ▴" : " ▸"}</button>${open ? `<p class="tipa">${esc(a)}</p>` : ""}`).join("")}</div>`;
  }
  /** Focus mode (three or more things due): a one-line card with its buttons; tap it to open the step. */
  private compactHtml(g: string, cur: Task, due: boolean): string {
    // Folded: the step it's on, and only what's worth seeing at a glance (a running timer, what's on a burner).
    // Done shows here only once you've reached the last step of this part.
    const seq = this.seqs().get(g)!, idx = this.cardIdx(g, cur), e = seq[idx];
    const live = e.t === cur || this.isDue(e.t), t = live ? e.t : cur;
    const tm = this.timerOf(live ? e : seq[seq.findIndex((x) => x.t === cur)]);
    const k = tm ? this.timerByLabel(tm[0]) : undefined;
    const started = this.ms(t) <= Date.now();
    // Done shows folded only after you've stepped through to the end of this part with ›.
    const start = seq.findIndex((x) => x.t === cur);
    const lastOfPart = live && idx > start && (idx === seq.length - 1 || seq[idx + 1].t !== e.t);
    const badge = !this.isToday() || !due ? "" : started ? `<small class="now">Now</small>` : `<small>in ${Math.ceil((this.ms(t) - Date.now()) / 60000)} min</small>`;
    const onNow = this.runsFor(g, t).filter((i) => !!this.placed(i));
    const n = seq.length;
    return `<div class="tc cmp${due ? " due" : ""}${k && k.rang ? " ringing" : ""}" data-open="${g}" title="Tap to open the step">
      <div class="tt">${this.timeCell(t)}${badge}</div>
      <div class="cl"><div class="r1"><b>${esc(this.gname(g))}</b>${n > 1 ? `<span class="sp">Step ${idx + 1} of ${n}</span>` : ""}</div><div class="r2">${esc(live && e.s ? this.stepText(e.s.t) : t.text)}</div><em>▾</em></div>
      <div class="acts">${onNow.map((i) => this.placeBtn(i)).join("")}${k ? this.timerBtnHtml(tm) : ""}${this.undoHtml(g)}${lastOfPart ? `<button class="dbtn" data-done="${t.id}" data-g="${g}" title="${this.pieLabel(g)}" aria-label="Done with this part">${this.pieHtml(g)}Done</button>` : ""}</div></div>`;
  }
  /** A part just ticked off, kept a moment with undo and what's next for that recipe. */
  private doneHtml(g: string, t: Task): string {
    const finished = this.parts(g).every((x) => this.store.isDone(x.id));
    return `<div class="tc done"><div class="tt">${this.timeCell(t)}</div>
      <div><div class="nm">${this.nameHtml(g)}</div><div class="nxt">${finished ? "All done." : "Done for today."}</div></div>
      <div class="acts"><span class="donetag" title="${this.pieLabel(g)}">${this.pieHtml(g)}Done</span><button class="ubtn" data-done="${t.id}" data-g="${g}" aria-label="Undo">Undo</button></div></div>`;
  }
  private behindHtml(t: Task): string {
    return `<div class="tc done late"><div class="tt">${this.timeCell(t)}</div><div>${t.rid ? `<div class="nm">${esc(this.gname(t.rid))}</div>` : ""}<div class="x">${esc(t.text)}</div></div>
      <div class="acts"><button class="dbtn" data-done="${t.id}" data-g="${this.gid(t)}" title="${this.pieLabel(this.gid(t))}" aria-label="Done">${this.pieHtml(this.gid(t))}Done</button></div></div>`;
  }
  private nowHtml(): string {
    const { due, done, next, behind } = this.cards();
    const d = this.viewDay();
    const list = this.plan.tasks.filter((t) => t.day === d && !!t.rid);
    const title = !this.isToday() ? this.plan.dayNames[d] : this.inFinalHour() ? "The final hour" : due.length ? "Do these now" : next.length ? "Coming up" : "All done for " + this.plan.dayNames[d].toLowerCase();
    const listCards = !due.length;
    // Every card is one line until you open it (tap, or Pik: "open the turkey card"). Which one is open is shared.
    const openG = this.store.focus();
    const dayBtns = this.echo ? "" : `<span class="dayseg">${Object.keys(this.plan.days).map((k) => `<button class="${k === d ? "on" : ""}" data-day="${k === this.currentDay() ? "" : k}">${SHORTDAY[k]}</button>`).join("")}</span>`;
    const shown = listCards ? next : next.slice(0, 3);
    return `<div class="lc">
      <div class="nowh"><h2 class="serif">${title}</h2>${!this.isToday() ? `<span class="prev">Previewing · <button class="sb" data-day="">Back to now</button></span>` : `<span class="prev">${due.length > 1 ? due.length + " now · tap a dish to open it" : list.filter((t) => !this.store.isDone(t.id)).length + " of " + list.length + " left today"}</span>`}${dayBtns}</div>
      ${this.missingPackage ? `<div class="flag"><b>Not shared yet</b><span>The holiday package isn't installed in Home Assistant, so progress is saved on this screen only.</span></div>` : ""}
      <div class="tlist">
        ${behind.length ? `<details class="earl"${this.keep.earl ? " open" : ""}><summary>${behind.length} earlier ${behind.length === 1 ? "part isn't" : "parts aren't"} ticked off ▸</summary>${behind.map((t) => this.behindHtml(t)).join("")}</details>` : ""}
        ${due.map((x) => (x.g === openG ? this.cardHtml(x.g, x.cur, true, true) : this.compactHtml(x.g, x.cur, true))).join("")}
        ${listCards ? shown.map((x) => (x.g === openG ? this.cardHtml(x.g, x.cur, false, true) : this.compactHtml(x.g, x.cur, false))).join("") : ""}
        ${done.length ? `<div class="donehd">Done for today</div>${done.map((x) => this.doneHtml(x.g, x.t)).join("")}` : ""}
      </div>
      ${!listCards && shown.length ? `<div class="nextbox"><span class="eb">Next</span>${shown.map((x) => `<div class="nx"><span class="tt">${esc(this.when(x.cur))}</span><span>${this.gname(x.g) ? `<b>${esc(this.gname(x.g))}</b> · ` : ""}${esc(x.cur.text)}</span></div>`).join("")}</div>` : ""}
    </div>`;
  }

  // ---------------------------------------------------------------- right column, ribbon

  private timersHtml(): string {
    const onTasks = new Set<string>();
    this.cards().due.forEach((x) => { const e = this.seqs().get(x.g)![this.cardIdx(x.g, x.cur)]; const tm = e.t === x.cur ? this.timerOf(e) : null; if (tm) onTasks.add(tm[0]); });
    const all = this.store.timers().sort((a, b) => (a.rang === b.rang ? a.end - b.end : a.rang ? -1 : 1));
    const rest = all.filter((t) => !onTasks.has(t.label) || t.rang);
    if (!rest.length) return "";
    const hidden = all.length - rest.length;
    return `<div class="rcard2"><span class="eb">Timers · ${all.length} running${hidden ? " · " + hidden + " shown on the cards" : ""}</span>
      ${rest.length ? `<div class="tgrid">${rest.map((t) => `<div class="tg${t.rang ? " ring" : ""}" data-tid="${esc(t.key)}"><span class="l"><i class="k ${t.kind}"></i>${esc(t.label)}</span><span class="tl"></span><span class="mini">${t.rang ? "" : `<button data-plus="${esc(t.key)}">+5</button>`}<button data-stop="${esc(t.key)}">${t.rang ? "OK" : "×"}</button></span></div>`).join("")}</div>` : ""}</div>`;
  }
  private ribbonHtml(): string {
    if (this.echo) return "";
    const d = this.viewDay();
    const list = this.plan.tasks.filter((t) => t.day === d);
    const hrs = list.map((t) => { const [h, m] = t.hm.split(":").map(Number); return h + m / 60; });
    const a = Math.floor(Math.min(...hrs)), b = Math.ceil(Math.max(...hrs) + 0.01);
    const pct = (h: number) => (((h - a) / (b - a)) * 100).toFixed(2);
    const now = new Date(); const nh = now.getHours() + now.getMinutes() / 60;
    const showNow = this.isToday() && nh >= a && nh <= b;
    const hours: string[] = [];
    for (let h = a; h < b; h++) hours.push(`<span class="hr" style="left:${pct(h)}%">${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}</span>`);
    const fh = d === this.plan.hotCheck.day ? `<span class="fh" style="left:${pct(15)}%;width:${(Number(pct(16)) - Number(pct(15))).toFixed(2)}%"></span>` : "";
    return `<div class="rbn"><div class="days">${Object.keys(this.plan.days).map((k) => `<button class="${k === d ? "on" : ""}" data-day="${k === this.currentDay() ? "" : k}">${SHORTDAY[k]}</button>`).join("")}</div>
      <div class="track" data-schedule="${d}" title="Open the full schedule"><div class="ln"></div>${fh}${hours.join("")}${list.map((t, i) => `<span class="d ${t.lane}${this.store.isDone(t.id) ? " past" : ""}" style="left:${pct(hrs[i])}%"></span>`).join("")}${showNow ? `<span class="nowl" style="left:${pct(nh)}%"></span>` : ""}</div></div>`;
  }

  // ---------------------------------------------------------------- the Plan & recipes sheet

  private sheetHtml(): string {
    const sh = this.sheet!;
    const segs: Array<[Seg, string]> = [["recipes", "Recipes"], ["schedule", "Full schedule"]];
    let body = "";
    if (sh.seg === "recipes" && sh.recipe) body = this.recipeHtml(this.recipe(sh.recipe)!);
    else if (sh.seg === "recipes") body = `<div class="rgrid">${this.plan.recipes.map((r) => `<button class="rcard" data-recipe="${r.id}"><span class="dic">${DISH_ICON[r.id] || ""}</span><span class="n">${r.n}</span><span class="nm">${esc(r.name)}</span><span class="tags"><span class="pill">${esc(r.gf)}</span>${r.tag.indexOf("Family") === 0 ? `<span class="pill ab">Family</span>` : ""}</span></button>`).join("")}</div>`;
    else body = this.scheduleHtml(sh.day || this.viewDay());
    return `<button class="scrim2" data-close="1" aria-label="Close"></button><div class="psheet">
      <div style="display:flex;align-items:center;gap:12px"><h2 class="serif" style="margin:0;font-size:32px">Plan &amp; recipes</h2><span style="flex:1"></span><button class="btn" data-close="1">Back to the kitchen</button></div>
      <div class="seg">${segs.map(([k, v]) => `<button class="${sh.seg === k ? "on" : ""}" data-seg="${k}">${v}</button>`).join("")}</div>${body}${this.settingsHtml()}</div>`;
  }
  private recipeHtml(r: Recipe): string {
    const flagHtml = (r.flags || []).map(([k, h, t]) => `<div class="flag ${k === "conf" || k === "jc" ? "conf" : ""}"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("");
    const byDay = Object.keys(this.plan.days).map((d) => [d, r.steps.map((s, i) => ({ s, i })).filter((x) => x.s.d === d)] as const).filter((x) => x[1].length);
    return `<div><button class="btn sm" data-recipe="">‹ All recipes</button></div>
      <div class="rhd"><span class="dic">${DISH_ICON[r.id] || ""}</span><div><span class="eb">${esc(r.tag)}</span><h2 class="serif" style="font-size:36px;margin:0">${r.n}. ${esc(r.name)}</h2></div></div>
      <div class="rdet"><div>
      <div class="meta"><div>Yield<b>${esc(r.yield)}</b></div><div>Gluten<b style="font-size:13px">${esc(r.gf)}</b></div><div>Active<b>${esc(r.active)}</b></div><div>Passive<b style="font-size:13px">${esc(r.passive)}</b></div></div>
      <h3>Ingredients</h3><ul class="ing">${r.ingr.map(([q, it, nt]) => q === "—" ? `<li style="grid-template-columns:1fr"><span class="eb" style="padding-top:6px">${esc(it)}</span></li>` : `<li><b>${esc(q)}</b><span>${esc(it)}${nt ? `<i>${esc(nt)}</i>` : ""}</span></li>`).join("")}</ul>
      <h3 style="margin-top:18px">Equipment</h3><p class="muted" style="font-size:14px">${r.equip.map(esc).join(" · ")}</p>
      <h3>How you know it's done</h3><p style="font-size:14px">${esc(r.done)}</p>
      <h3>Make ahead</h3><p style="font-size:14px">${esc(r.ahead)}</p>
      <h3>Storage</h3><p style="font-size:14px">${esc(r.store)}</p>
      ${r.src ? `<p class="note">Original: <a href="${esc(r.src[1])}" target="_blank" rel="noopener">${esc(r.src[0])}</a>. Steps here are a short summary in our own words.</p>` : `<p class="note">Your family's recipe, as you gave it.</p>`}
      </div><div>${flagHtml}
      ${byDay.map(([d, arr]) => `<h3 class="dayhd">${this.plan.dayNames[d]}</h3><ol class="steps">${arr.map(({ s, i }) => `<li><span class="num">${i + 1}</span><span class="tx">${esc(s.t)}${s.min ? ` <em class="est">≈ ${s.min} min</em>` : ""}${this.stepIngr(r, s).length ? `<small>${this.stepIngr(r, s).map(([q, it]) => esc((q ? q + " " : "") + it)).join(" · ")}</small>` : ""}</span><span>${this.timerBtnHtml(s.tm || null)}</span></li>`).join("")}</ol>`).join("")}
      </div></div>`;
  }
  private scheduleHtml(d: string): string {
    const list = this.plan.tasks.filter((t) => t.day === d);
    const times = [...new Set(list.map((t) => t.hm))].sort();
    const hasSmoker = list.some((t) => t.lane === "smoker") && d === this.plan.hotCheck.day;
    const lanes = hasSmoker ? ["smoker", "oven", "stove", "prep"] : ["oven", "stove", "prep", "fridge"];
    const laneOf = (t: Task) => (lanes.includes(t.lane) ? t.lane : "prep");
    return `<div class="daybar">${Object.keys(this.plan.days).map((k) => `<button class="btn sm${d === k ? " ink" : ""}" data-schedule="${k}">${this.plan.dayNames[k]}</button>`).join("")}<span class="note">Every task for the day. Tick or undo any of them here.</span></div>
      <div class="planhead"><span></span>${lanes.map((l) => `<span class="eb"><span class="lane l-${l}"></span>${LANES[l]}${l === "prep" && hasSmoker ? " · fridge" : ""}</span>`).join("")}</div>
      ${times.map((hm) => `<div class="planrow"><div class="t">${fmt12(hm)}</div>${lanes.map((l) => `<div class="cell">${list.filter((t) => t.hm === hm && laneOf(t) === l).map((t) => `<div class="blk ${t.lane}${this.store.isDone(t.id) ? " done" : ""}">${esc(t.text)}<button class="btick${this.store.isDone(t.id) ? " on" : ""}" data-done="${t.id}">${this.store.isDone(t.id) ? "✓ Done" : "Tick off"}</button></div>`).join("")}</div>`).join("")}</div>`).join("")}`;
  }
  /** Rarely needed: moving progress between the backup page and the hub, and starting over. */
  private settingsHtml(): string {
    const local = this.store as LocalStore;
    return `<details class="settings"${this.keep.settings ? " open" : ""}><summary>Settings</summary><div class="card">
      ${this.store.live ? `<p>Started on the backup page? There, open Plan &amp; recipes → Settings and tap <b>Copy progress for the hub</b>, then paste it here.</p>
        <textarea id="imp" rows="3" placeholder="Paste the progress code"></textarea>
        <div><button class="btn sm ink" data-import="1">Bring it over</button></div>`
      : `<p>Moving to the hub? Copy this code, then paste it into the hub's Plan &amp; recipes → Settings.</p>
        <textarea id="exp" rows="3" readonly>${esc(local.exportCode ? local.exportCode() : "")}</textarea>
        <div><button class="btn sm ink" data-export="1">Copy progress for the hub</button></div>`}
      <p style="margin-top:14px">Start over: clears every tick, step, turkey reading and timer${this.store.live ? " on every screen" : " on this screen"}.</p>
      <div>${this.askReset ? `<b style="margin-right:10px">Clear everything?</b><button class="btn sm ink" data-resetall="yes">Yes, reset</button> <button class="btn sm" data-resetall="no">Cancel</button>` : `<button class="btn sm" data-resetall="ask">Reset all progress</button>`}</div></div></details>`;
  }

  // ---------------------------------------------------------------- turkey pad

  private padHtml(): string {
    const p = this.turkeyPad!;
    const tf = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `<button class="scrim2" data-padclose="1" aria-label="Close"></button><div class="tpop" role="dialog" aria-label="Turkey temperature">
      <div class="tph"><div><h3 class="serif">Turkey temperature</h3><p>It's done when the breast, thigh and wing all read 165°F.</p></div><button class="btn sm" data-padclose="1">Done</button></div>
      <div class="spots">${SPOTS.map((k, i) => { const x = this.store.latest(k); return `<button class="${i === p.spot ? "on" : ""}${x && x.f >= 165 ? " ok" : ""}" data-spot="${i}"><span class="sp">${SPOTNAME[k]}</span><b>${x ? x.f + "°" : "—"}</b><span>${x ? tf(x.t) : "no reading yet"}</span></button>`; }).join("")}</div>
      <div class="entry">${p.entry ? esc(p.entry) + "°F" : `<span class="muted">Type the ${SPOTNAME[SPOTS[p.spot]].toLowerCase()} reading</span>`}</div>
      <div class="pad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((k) => `<button class="${k === "✓" ? "go" : ""}" data-key="${k}" aria-label="${k === "✓" ? "Save" : k === "⌫" ? "Delete" : k}">${k === "✓" ? "Save" : k}</button>`).join("")}</div>
      <p class="tpn">Save moves on to the next spot. Or just tell the Echo: “the breast is 162.”</p></div>`;
  }
  private padKey(k: string): void {
    const p = this.turkeyPad!;
    if (k === "⌫") p.entry = p.entry.slice(0, -1);
    else if (k === "✓") {
      const v = parseInt(p.entry, 10);
      if (!(v > 30 && v < 250)) { this.flash("Type a reading between 31 and 249."); return; }
      const loc = SPOTS[p.spot];
      const after = SPOTS.map((s) => (s === loc ? v : (this.store.latest(s) || { f: 0 }).f));
      this.store.logTemps({ [loc]: v });
      this.flash(SPOTNAME[loc] + ": " + v + "°F logged.");
      p.entry = ""; p.spot = (p.spot + 1) % 3;
      if (after.every((f) => f >= 165)) this.pushAlert("done", hmNow(), "Turkey is done: 165°F in breast, thigh and wing. Off the smoker, tent, rest.");
    } else if (p.entry.length < 3) p.entry += k;
    this.requestUpdate();
  }

  // ---------------------------------------------------------------- events

  private onClick = (e: Event): void => {
    const el = (e.target as HTMLElement).closest("[data-collapse],[data-tip],[data-open],[data-place],[data-pick],[data-pickclose],[data-day],[data-done],[data-timer],[data-recipe],[data-stop],[data-plus],[data-step],[data-finish],[data-close],[data-seg],[data-schedule],[data-plan],[data-turkey],[data-padclose],[data-spot],[data-key],[data-hot],[data-dish],[data-alldishes],[data-alarms],[data-import],[data-export],[data-resetall],[data-ack]") as HTMLElement | null;
    if (!el) return;
    const ds = el.dataset;
    if (ds.ack) { this.ackAlerts(); return; }
    if (ds.tip) { this.L.tips = Object.assign({}, this.L.tips, { [ds.tip]: !(this.L.tips || {})[ds.tip] }); this.saveL(); this.requestUpdate(); return; }
    if (ds.open) { this.store.setFocus(this.store.focus() === ds.open ? "-" : ds.open); this.requestUpdate(); return; }
    if (ds.collapse) { this.store.setFocus("-"); this.requestUpdate(); return; }
    if (ds.place) {
      const i = Number(ds.place), u = this.runs[i], pl = this.placed(i);
      if (pl) { this.store.setPlace(i, null, this.alive); this.flash(u.l + ": off " + (pl.st[0] === "b" ? "burner " + pl.st.slice(1) : "the " + pl.st) + "."); }
      else if (u.st[0] === "b" && this.onNow().some((x) => x.p.st === u.st)) this.picker = { i };
      else { this.store.setPlace(i, u.st, this.alive); this.flash(u.l + ": " + onWords(u.st) + "."); }
      this.requestUpdate(); return;
    }
    if (ds.pick) { const [i, st] = ds.pick.split(":"); this.store.setPlace(Number(i), st, this.alive); this.flash(this.runs[Number(i)].l + ": " + onWords(st) + "."); this.picker = null; this.requestUpdate(); return; }
    if (ds.pickclose) { this.picker = null; this.requestUpdate(); return; }
    if (ds.day !== undefined) { this.L.day = ds.day || null; this.saveL(); this.requestUpdate(); return; }
    if (ds.done) {
      // Ticking (or undoing) a part puts that recipe's card back on the part it's now on.
      const t = this.plan.tasks.find((x) => x.id === ds.done);
      this.store.setDone(ds.done, !this.store.isDone(ds.done));
      if (t && t.rid) { this.L.last = Object.assign({}, this.L.last, { [t.rid]: [t.id, Date.now()] as [string, number] }); this.saveL(); }
      if (t && this.store.getStep(this.gid(t)) > 0) { const f = this.store.focus(); this.store.setStep(this.gid(t), 0); this.store.setFocus(f); }
      this.requestUpdate(); return;
    }
    if (ds.timer) {
      const [l, m, k] = JSON.parse(ds.timer) as TimerSpec;
      this.unlockAudio();
      this.store.startTimer(l, m, k).then((err) => { if (err) this.flash(err); this.requestUpdate(); });
      return;
    }
    if (ds.stop) { this.store.stopTimer(ds.stop); this.requestUpdate(); return; }
    if (ds.plus) { this.store.plus5(ds.plus); this.flash("5 more minutes."); this.requestUpdate(); return; }
    if (ds.step) { const [g, i] = ds.step.split(":"); if (Number(i) >= 0) this.store.setStep(g, Number(i)); this.requestUpdate(); return; } // also tells Pik which recipe "next step" means
    if (ds.finish) { this.store.setDone(ds.finish, true); this.L.open = null; this.saveL(); this.flash("Ticked off."); this.requestUpdate(); return; }
    if (ds.plan !== undefined) { this.keep.resetSheet = true; this.sheet = { seg: "recipes", recipe: null, day: null }; this.requestUpdate(); return; }
    if (ds.recipe !== undefined) { this.keep.resetSheet = true; this.sheet = { seg: "recipes", recipe: ds.recipe || null, day: null }; this.requestUpdate(); return; }
    if (ds.dish) { this.keep.resetSheet = true; this.sheet = { seg: "recipes", recipe: ds.dish, day: null }; this.requestUpdate(); return; }
    if (ds.schedule) { this.keep.resetSheet = true; this.sheet = { seg: "schedule", recipe: null, day: ds.schedule }; this.requestUpdate(); return; }
    if (ds.seg) { this.keep.resetSheet = true; this.sheet = { seg: ds.seg as Seg, recipe: null, day: null }; this.requestUpdate(); return; }
    if (ds.close) { this.sheet = null; this.requestUpdate(); return; }
    if (ds.turkey) { this.turkeyPad = { spot: 0, entry: "" }; this.requestUpdate(); return; }
    if (ds.padclose) { this.turkeyPad = null; this.requestUpdate(); return; }
    if (ds.spot) { this.turkeyPad = { spot: Number(ds.spot), entry: "" }; this.requestUpdate(); return; }
    if (ds.key) { this.padKey(ds.key); return; }
    if (ds.hot) { this.store.setHot(ds.hot, true); this.flash("Checked: 140°F or hotter."); this.requestUpdate(); return; }
    if (ds.alldishes) { this.L.allDishes = !this.L.allDishes; this.saveL(); this.requestUpdate(); return; }
    if (ds.alarms) { this.store.setAlarms(!this.store.alarmsOn()); this.requestUpdate(); return; }
    if (ds.import) { this.importProgress(); return; }
    if (ds.export) { this.copyExport(); return; }
    if (ds.resetall) {
      if (ds.resetall === "yes") {
        this.store.resetAll(this.plan.tasks.map((t) => t.id).concat(this.plan.dishes.map((d) => "hot_" + d.id)));
        // Back to the start: nothing ticked, every alarm due before now treated as already heard.
        const now = Date.now(), fired: Record<string, number> = {};
        this.plan.tasks.forEach((t) => { if (this.ms(t) <= now) fired[t.id] = 1; });
        this.L = { day: null, open: null, fired, rung: {}, allDishes: false, tips: {} }; this.saveL();
        this.Q = []; this.ringStart = 0; this.sheet = null; this.askReset = false;
        this.flash("Reset. Everything is back to the start.");
      } else this.askReset = ds.resetall === "ask";
      this.requestUpdate(); return;
    }
  };

  private async copyExport(): Promise<void> {
    const ta = (this.renderRoot as ShadowRoot).querySelector<HTMLTextAreaElement>("#exp");
    if (!ta) return;
    let ok = false;
    try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (e) { /* blocked */ }
    if (!ok) { ta.focus(); ta.select(); try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ } }
    this.flash(ok ? "Copied. Paste it into the hub's Plan & recipes → Settings." : "Select the code and copy it (Ctrl+C).");
  }

  /** Progress code from the backup page. v1 (old page) and v2 (this card in local mode) both work. */
  private async importProgress(): Promise<void> {
    const ta = (this.renderRoot as ShadowRoot).querySelector<HTMLTextAreaElement>("#imp");
    const code = ta ? ta.value.trim() : "";
    if (!code) { this.flash("Paste the progress code first."); return; }
    let data: { v: number; done: string[]; steps?: Record<string, number>; hot?: string[]; places?: Place[]; temps: Array<{ loc: string; f: number; t: number }>; timers: Array<{ label: string; kind: TimerKind; end: number }> };
    try { data = JSON.parse(decodeURIComponent(escape(atob(code.replace(/\s+/g, ""))))); } catch (e) { this.flash("That code didn't read. Copy it again from the page."); return; }
    const known = new Set(this.plan.tasks.map((t) => t.id));
    const ids = (data.done || []).filter((i) => known.has(i));
    this.store.setMany(ids, true);
    Object.keys(data.steps || {}).forEach((k) => { if (this.seqs().has(k)) this.store.setStep(k, data.steps![k]); });
    (data.hot || []).forEach((d) => this.store.setHot(d, true));
    (data.places || []).forEach((p) => { if (this.runs[p.i] && this.alive(p)) this.store.setPlace(p.i, p.st, this.alive); });
    const latest: Record<string, number> = {};
    (data.temps || []).forEach((r) => { latest[r.loc] = r.f; });
    if (Object.keys(latest).length) this.store.logTemps(latest);
    const now = Date.now();
    let nt = 0;
    for (const t of data.timers || []) {
      const left = (t.end - now) / 60000;
      if (left > 0.1) { await this.store.startTimer(t.label, Math.round(left * 10) / 10, t.kind); nt++; }
    }
    ids.forEach((i) => (this.L.fired[i] = 1)); this.saveL();
    if (ta) ta.value = "";
    this.flash("Brought over " + ids.length + " ticked tasks" + (Object.keys(latest).length ? ", turkey readings" : "") + (nt ? " and " + nt + (nt === 1 ? " timer" : " timers") : "") + ".");
    this.requestUpdate();
  }

  // ---------------------------------------------------------------- render

  render() {
    const now = new Date();
    const left = Date.parse(this.plan.dinner) - now.getTime();
    const count = left > 86400000 ? Math.floor(left / 86400000) + " d " + Math.floor((left % 86400000) / 3600000) + " h" : left > 0 ? fmtDur(left).replace(/:\d\d$/, "") : "Happy " + this.plan.title;
    const ts = this.turkeyStatus();
    const d = this.currentDay();
    const todayLeft = this.plan.tasks.filter((t) => t.day === d && !!t.rid && !this.store.isDone(t.id)).length;
    const sub = this.inFinalHour() ? "Everything hot by 4:00 · " + todayLeft + " left" : todayLeft + (todayLeft === 1 ? " task" : " tasks") + " left today" + (this.store.live ? "" : " · this screen only");
    const a = this.Q[this.Q.length - 1];
    return html`<div class="op" @click=${this.onClick}>
<header><div class="hd">
  <div class="clock" id="clock"></div>
  ${a ? html`<div class="ringbar" role="alert"><b>${a.when}</b><span>${a.text}</span>${this.Q.length > 1 ? html`<small>+${this.Q.length - 1} more</small>` : nothing}<button data-ack="1">Got it</button></div>`
      : html`<div class="ttl"><b>${this.todayKey() ? this.plan.dayNames[d] + " · " + this.plan.title : this.plan.title + " prep starts " + this.plan.dayNames[Object.keys(this.plan.days)[0]]}</b><span>${sub}</span></div>`}
  ${this.soundOff ? html`<button class="sndb" title="Browsers keep sound off until the screen is tapped once">🔇 Tap for sound</button>` : nothing}
  <button class="tkb" data-turkey="1"><span class="dot ${ts.cls}">${ts.sym}</span><span class="t"><b>${ts.head}</b><span>${ts.sub}</span></span></button>
  <button class="ico ${this.store.alarmsOn() ? "" : "off"}" data-alarms="1" title=${this.store.alarmsOn() ? "Echos read tasks out loud. Tap to mute." : "Echos are muted. Tap to turn back on."}>${this.store.alarmsOn() ? "🔊" : "🔇"}</button>
  <button class="ibtn" data-plan="1">Plan &amp; recipes</button>
  <div class="cdn"><span class="eb">${left > 0 ? "Dinner in" : "Dinner"}</span><div class="big">${count}</div></div>
</div></header>
${unsafeHTML(this.stationsHtml())}
<div class="bdy${this.inFinalHour() ? " fh" : ""}">${unsafeHTML(this.nowHtml())}<div class="rc">${unsafeHTML(this.timersHtml())}${unsafeHTML(this.dishesHtml())}</div></div>

${this.sheet ? unsafeHTML(this.sheetHtml()) : nothing}
${this.turkeyPad ? unsafeHTML(this.padHtml()) : nothing}
${this.picker ? unsafeHTML(this.pickerHtml()) : nothing}

${this.toast ? html`<div class="toast" role="status">${this.toast}</div>` : nothing}
</div>`;
  }

  /** Every render rebuilds the page's HTML; keep where each list was scrolled and which folds were open. */
  protected willUpdate(): void {
    const r = this.renderRoot as ShadowRoot;
    if (!r || !r.querySelector) return;
    for (const sel of [".tlist", ".psheet", ".dlist"]) { const el = r.querySelector<HTMLElement>(sel); if (el) this.keep.scroll[sel] = el.scrollTop; }
    const earl = r.querySelector<HTMLDetailsElement>("details.earl"), st = r.querySelector<HTMLDetailsElement>("details.settings");
    if (earl) this.keep.earl = earl.open;
    if (st) this.keep.settings = st.open;
    if (this.keep.resetSheet || !this.sheet) { this.keep.scroll[".psheet"] = 0; this.keep.resetSheet = false; }
  }
  updated(): void {
    const r = this.renderRoot as ShadowRoot;
    for (const sel of Object.keys(this.keep.scroll)) { const el = r.querySelector<HTMLElement>(sel); if (el && el.scrollTop !== this.keep.scroll[sel]) el.scrollTop = this.keep.scroll[sel]; }
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
  w.customCards.push({ type: "pik-holiday-card", name: "Pik holiday cooking", description: "Runs a big meal's plan on one page: tasks with recipe steps, timers, alarms, stations and dishes.", preview: false });
}
