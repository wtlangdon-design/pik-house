// Holiday cooking mode: one full-screen page that runs a big meal's plan.
//
// One page, driven by the clock (design: "Holiday cooking: one page v3" on the design canvas):
//   header     clock · the alarm when a task's time comes · turkey · Echo mute · Plan & recipes · countdown
//   stations   smoker · oven · the five burners, now and next
//   left       what to do now, each with its recipe step and that step's ingredients (‹ › to move), next tasks pinned below
//   right      timers not already shown on a task · the 12 dishes and where each one is
//   bottom     the day at a glance (Chromebook only); tap it for the full schedule
//   one sheet  Plan & recipes: recipes, full schedule with ticks, shopping check, notes & safety
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
import { PLANS, type Plan, type Recipe, type Task, type TimerKind, type TimerSpec } from "./plan";
import { HaStore, LocalStore, SPOTS, type Hass, type KTimer, type Store } from "./store";

export interface HolidayConfig { type: string; plan?: string; prefix?: string; timers?: number; mock?: boolean; layout?: string }

type Seg = "recipes" | "schedule" | "shop" | "notes";
interface Alert { kind: string; when: string; text: string }
interface Local { day: string | null; open: string | null; fired: Record<string, number>; rung: Record<string, number>; allDishes: boolean }

const LANES: Record<string, string> = { smoker: "Smoker", oven: "Oven", stove: "Stove", prep: "Counter", fridge: "Fridge" };
const SPOTNAME: Record<string, string> = { breast: "Breast", thigh: "Thigh", wing: "Wing" };
const SHORTDAY: Record<string, string> = { tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun", mon: "Mon" };

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
function fmt12(hm: string): string { let [h, m] = hm.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + (ap === "PM" ? "" : " AM"); }
function fmtDur(ms: number): string { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0"); }
function hmNow(): string { const d = new Date(); const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM"); }
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
  private lastSig = "";
  private soundOff = true;
  private toast = "";
  private _toastT?: number;
  private _sec?: number;
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
    this.Q.push({ kind, when, text });
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
  private stepIdx(t: Task): number { const n = this.stepsOf(t).length; return Math.max(0, Math.min(this.store.getStep(t.id), n - 1)); }
  /** The timer that goes with where this task is now: the current step's, or the task's own. */
  private timerFor(t: Task): TimerSpec | null {
    const st = this.stepsOf(t);
    if (!st.length) return t.tm;
    const cur = st[this.stepIdx(t)];
    if (cur.s.tm) return cur.s.tm;
    return st.some((x) => x.s.tm) ? null : t.tm;
  }
  private timerByLabel(label: string): KTimer | undefined { return this.store.timers().find((x) => x.label === label); }
  private isToday(): boolean { return !this.L.day || this.L.day === this.currentDay(); }

  private windowTasks() {
    const d = this.viewDay(), now = Date.now(), order = Object.keys(this.plan.days);
    const list = this.plan.tasks.filter((t) => t.day === d);
    const soon = now + 10 * 60000, recent = now - 15 * 60000;
    if (!this.isToday()) return { list, due: [] as Task[], earlier: [] as Task[], next: list.filter((t) => !this.store.isDone(t.id)) };
    const pending = list.filter((t) => !this.store.isDone(t.id));
    const prior = this.plan.tasks.filter((t) => order.indexOf(t.day) < order.indexOf(d) && !this.store.isDone(t.id));
    const earlier = prior.concat(pending.filter((t) => this.at(t.day, t.hm).getTime() < recent));
    const due = list.filter((t) => { const x = this.at(t.day, t.hm).getTime(); return x >= recent && x <= soon; });
    const next = pending.filter((t) => this.at(t.day, t.hm).getTime() > soon);
    return { list, due, earlier, next };
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
    const nextTxt = nxt ? (nxt[0] === this.todayKey() ? fmt12(nxt[1]) : SHORTDAY[nxt[0]] + " " + fmt12(nxt[1])) + " · " + nxt[4] + (nxt[3] && !/^(lowest|high|dropping|off|warm)$/.test(nxt[3]) ? " " + nxt[3] : "") : "";
    return { cur, nextTxt };
  }
  private stationsHtml(): string {
    const big = (name: string, label: string) => {
      const sn = this.segNow(name);
      let cur = sn.cur;
      const nextTxt = sn.nextTxt;
      // The plan says the turkey is off by 2:45; if the thermometer disagrees, the smoker tile says so.
      if (name === "smoker" && cur && cur[0] === this.plan.hotCheck.day && !this.store.isDone("thu_1445_turkey")) {
        const r = SPOTS.map((k) => this.store.latest(k));
        if (r.some((x) => x) && !r.every((x) => x && x.f >= 165) && cur[2] > "14:45") cur = [cur[0], cur[1], cur[2], "325–350°F", "Turkey · not 165°F yet"];
      }
      return `<div class="sn ${name}${cur ? "" : " idle"}"><span class="eb">${label} ${cur && cur[3] ? `<span class="tp">${esc(cur[3])}</span>` : ""}</span><b>${esc(cur ? cur[4] : "Off")}</b><i>${esc(nextTxt ? "Next: " + nextTxt : " ")}</i></div>`;
    };
    const burners = [1, 2, 3, 4, 5].map((n) => {
      const { cur, nextTxt } = this.segNow("b" + n);
      return `<div class="bn${cur ? "" : " free"}"><span class="n">${n}</span><div><b>${esc(cur ? cur[4] + (cur[3] ? ", " + cur[3] : "") : "Free")}</b><i>${esc(nextTxt || " ")}</i></div></div>`;
    }).join("");
    return `<div class="stn">${big("smoker", "Smoker")}${big("oven", "Oven")}<div class="stovebox"><span class="eb">Stove</span><div class="burners">${burners}</div></div></div>`;
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
      if (active) { state = state === "hot" ? "hot" : "act"; words = "Now: " + clip(active.text.replace(/^Burner \d: /, ""), 30); }
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
    return `<div class="rcard2 dcard"><span class="eb">${title}</span><span class="dkey">Blue: cold, ready · amber: being made · red: cooking · green: hot and checked</span>
      <div class="dlist">${shown.map(row).join("")}${foot}</div></div>`;
  }

  // ---------------------------------------------------------------- the Now list

  private timerBtnHtml(tm: TimerSpec | null): string {
    if (!tm) return "";
    const k = this.timerByLabel(tm[0]);
    if (k && k.rang) return `<button class="sb rang" data-stop="${esc(k.key)}">Time's up · OK</button>`;
    const word = tm[2] === "check" ? "Check in " : tm[2] === "temp" ? "Temp check in " : "Done in ";
    if (k) return `<button class="sb run" data-tid="${esc(k.key)}" data-plus="${esc(k.key)}" title="Tap for 5 more minutes">${word}<span class="tl"></span></button>`;
    const cls = tm[2] === "check" ? "chk" : tm[2] === "temp" ? "tp" : "dn";
    return `<button class="sb ${cls}" data-timer='${esc(JSON.stringify(tm))}'>${word}${tm[1] >= 120 ? Math.round(tm[1] / 60) + " h" : tm[1] + " min"}</button>`;
  }
  private taskHtml(t: Task, due: boolean): string {
    const done = this.store.isDone(t.id);
    const st = this.stepsOf(t), tm = done ? null : this.timerFor(t);
    const k = tm ? this.timerByLabel(tm[0]) : undefined;
    let step = "";
    if (!done && st.length) {
      // The task's recipe step is always shown; ‹ › walk through the task's steps (shared with every screen and Pik).
      const i = this.stepIdx(t), cur = st[i], n = st.length;
      const dn = (this.plan.dishes.find((x) => x.id === cur.r.id) || { name: cur.r.name }).name;
      const ings = this.stepIngr(cur.r, cur.s);
      step = `<div class="stp">
        <div class="sh"><button class="dlink" data-recipe="${cur.r.id}" title="The whole recipe">${esc(dn)}</button>${n > 1 ? `<span>· step ${i + 1} of ${n}</span><span class="pips">${st.map((_x, j) => `<i class="${j === i ? "on" : j < i ? "past" : ""}"></i>`).join("")}</span>` : ""}
          ${n > 1 ? `<span class="arr"><button class="ar" data-step="${t.id}:${i - 1}"${i === 0 ? " disabled" : ""} aria-label="Previous step">‹</button><button class="ar" data-step="${t.id}:${i + 1}"${i === n - 1 ? " disabled" : ""} aria-label="Next step">›</button></span>` : ""}</div>
        <p>${esc(this.stepText(cur.s.t))}</p>
        ${ings.length ? `<div class="si">${ings.map(([q, it]) => `<span>${q ? `<b>${esc(q)}</b> ` : ""}${esc(it)}</span>`).join("")}</div>` : ""}
      </div>`;
    }
    return `<div class="tc${done ? " done" : due ? " due" : ""}${k && k.rang ? " ringing" : ""}">
      <div class="tt">${t.day !== this.viewDay() ? SHORTDAY[t.day] + " " : ""}${fmt12(t.hm)}</div>
      <div><div class="x">${esc(t.text)}</div><div class="meta">${LANES[t.lane] || ""}</div></div>
      <div class="acts">${this.timerBtnHtml(tm)}<button class="tick${done ? " on" : ""}" data-done="${t.id}" aria-label="${done ? "Ticked off; tap to undo" : "Tick off"}">${done ? "✓" : ""}</button></div>
      ${step}</div>`;
  }
  private nowHtml(): string {
    const { due, earlier, next, list } = this.windowTasks();
    const d = this.viewDay();
    const undone = due.filter((t) => !this.store.isDone(t.id));
    const title = !this.isToday() ? this.plan.dayNames[d] : this.inFinalHour() ? "The final hour" : undone.length ? "Do these now" : next.length ? "Coming up" : "All done for " + this.plan.dayNames[d].toLowerCase();
    const ordered = undone.concat(due.filter((t) => this.store.isDone(t.id)));
    const showNextInList = !due.length;
    const nextList = showNextInList ? next.slice(0, 8) : next.slice(0, 3);
    return `<div class="lc">
      <div class="nowh"><h2 class="serif">${title}</h2>${!this.isToday() ? `<span class="prev">Previewing · <button class="sb" data-day="">Back to now</button></span>` : `<span class="prev">${list.filter((t) => !this.store.isDone(t.id)).length} of ${list.length} left today</span>`}</div>
      ${this.missingPackage ? `<div class="flag"><b>Not shared yet</b><span>The holiday package isn't installed in Home Assistant, so progress is saved on this screen only.</span></div>` : ""}
      <div class="tlist">
        ${earlier.length ? `<details class="earl"><summary>${earlier.length} earlier ${earlier.length === 1 ? "task isn't" : "tasks aren't"} ticked off ▸</summary>${earlier.map((t) => this.taskHtml(t, false)).join("")}</details>` : ""}
        ${ordered.map((t) => this.taskHtml(t, true)).join("")}
        ${showNextInList ? nextList.map((t) => this.taskHtml(t, false)).join("") : ""}
      </div>
      ${!showNextInList && nextList.length ? `<div class="nextbox"><span class="eb">Next</span>${nextList.map((t) => `<div class="nx"><span class="tt">${fmt12(t.hm)}</span><span>${esc(t.text)}</span></div>`).join("")}</div>` : ""}
    </div>`;
  }

  // ---------------------------------------------------------------- right column, ribbon

  private timersHtml(): string {
    const onTasks = new Set<string>();
    this.windowTasks().due.forEach((t) => { if (!this.store.isDone(t.id)) { const tm = this.timerFor(t); if (tm) onTasks.add(tm[0]); } });
    const all = this.store.timers().sort((a, b) => (a.rang === b.rang ? a.end - b.end : a.rang ? -1 : 1));
    const rest = all.filter((t) => !onTasks.has(t.label) || t.rang);
    if (!rest.length) return "";
    const hidden = all.length - rest.length;
    return `<div class="rcard2"><span class="eb">Timers · ${all.length} running${hidden ? " · " + hidden + " shown on the tasks" : ""}</span>
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
    const segs: Array<[Seg, string]> = [["recipes", "Recipes"], ["schedule", "Full schedule"], ["shop", "Shopping check"], ["notes", "Notes & safety"]];
    let body = "";
    if (sh.seg === "recipes" && sh.recipe) body = this.recipeHtml(this.recipe(sh.recipe)!);
    else if (sh.seg === "recipes") body = `<div class="rgrid">${this.plan.recipes.map((r) => `<button class="rcard" data-recipe="${r.id}"><span class="n">${r.n}</span><span class="nm">${esc(r.name)}</span><span class="tags"><span class="pill">${esc(r.gf)}</span>${r.tag.indexOf("Family") === 0 ? `<span class="pill ab">Family</span>` : ""}</span></button>`).join("")}</div>`;
    else if (sh.seg === "schedule") body = this.scheduleHtml(sh.day || this.viewDay());
    else if (sh.seg === "shop") body = this.shopHtml();
    else body = this.notesHtml();
    return `<button class="scrim2" data-close="1" aria-label="Close"></button><div class="psheet">
      <div style="display:flex;align-items:center;gap:12px"><h2 class="serif" style="margin:0;font-size:32px">Plan &amp; recipes</h2><span style="flex:1"></span><button class="btn" data-close="1">Back to the kitchen</button></div>
      <div class="seg">${segs.map(([k, v]) => `<button class="${sh.seg === k ? "on" : ""}" data-seg="${k}">${v}</button>`).join("")}</div>${body}</div>`;
  }
  private recipeHtml(r: Recipe): string {
    const flagHtml = (r.flags || []).map(([k, h, t]) => `<div class="flag ${k === "conf" || k === "jc" ? "conf" : ""}"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("");
    const byDay = Object.keys(this.plan.days).map((d) => [d, r.steps.map((s, i) => ({ s, i })).filter((x) => x.s.d === d)] as const).filter((x) => x[1].length);
    return `<div><button class="btn sm" data-recipe="">‹ All recipes</button></div>
      <span class="eb">${esc(r.tag)}</span><h2 class="serif" style="font-size:36px;margin:0">${r.n}. ${esc(r.name)}</h2>
      <div class="rdet"><div>
      <div class="meta"><div>Yield<b>${esc(r.yield)}</b></div><div>Gluten<b style="font-size:13px">${esc(r.gf)}</b></div><div>Active<b>${esc(r.active)}</b></div><div>Passive<b style="font-size:13px">${esc(r.passive)}</b></div></div>
      <h3>Ingredients</h3><ul class="ing">${r.ingr.map(([q, it, nt]) => q === "—" ? `<li style="grid-template-columns:1fr"><span class="eb" style="padding-top:6px">${esc(it)}</span></li>` : `<li><b>${esc(q)}</b><span>${esc(it)}${nt ? `<i>${esc(nt)}</i>` : ""}</span></li>`).join("")}</ul>
      <h3 style="margin-top:18px">Equipment</h3><p class="muted" style="font-size:14px">${r.equip.map(esc).join(" · ")}</p>
      <h3>How you know it's done</h3><p style="font-size:14px">${esc(r.done)}</p>
      <h3>Make ahead</h3><p style="font-size:14px">${esc(r.ahead)}</p>
      <h3>Storage</h3><p style="font-size:14px">${esc(r.store)}</p>
      ${r.src ? `<p class="note">Original: <a href="${esc(r.src[1])}" target="_blank" rel="noopener">${esc(r.src[0])}</a>. Steps here are a short summary in our own words.</p>` : `<p class="note">Your family's recipe, as you gave it.</p>`}
      </div><div>${flagHtml}
      ${byDay.map(([d, arr]) => `<h3 class="dayhd">${this.plan.dayNames[d]}</h3><ol class="steps">${arr.map(({ s, i }) => `<li><span class="num">${i + 1}</span><span class="tx">${esc(s.t)}${this.stepIngr(r, s).length ? `<small>${this.stepIngr(r, s).map(([q, it]) => esc((q ? q + " " : "") + it)).join(" · ")}</small>` : ""}</span><span>${this.timerBtnHtml(s.tm || null)}</span></li>`).join("")}</ol>`).join("")}
      </div></div>`;
  }
  private scheduleHtml(d: string): string {
    const list = this.plan.tasks.filter((t) => t.day === d);
    const times = [...new Set(list.map((t) => t.hm))].sort();
    const hasSmoker = list.some((t) => t.lane === "smoker") && d === this.plan.hotCheck.day;
    const lanes = hasSmoker ? ["smoker", "oven", "stove", "prep"] : ["oven", "stove", "prep", "fridge"];
    const laneOf = (t: Task) => (lanes.includes(t.lane) ? t.lane : "prep");
    return `<div class="daybar">${Object.keys(this.plan.days).map((k) => `<button class="btn sm${d === k ? " ink" : ""}" data-schedule="${k}">${this.plan.dayNames[k]}</button>`).join("")}<span class="note">Every task for the day. Tick or undo any of them here.</span></div>
      <div class="planhead" style="top:0"><span></span>${lanes.map((l) => `<span class="eb"><span class="lane l-${l}"></span>${LANES[l]}${l === "prep" && hasSmoker ? " · fridge" : ""}</span>`).join("")}</div>
      ${times.map((hm) => `<div class="planrow"><div class="t">${fmt12(hm)}</div>${lanes.map((l) => `<div class="cell">${list.filter((t) => t.hm === hm && laneOf(t) === l).map((t) => `<div class="blk ${t.lane}${this.store.isDone(t.id) ? " done" : ""}">${esc(t.text)}<button class="btick${this.store.isDone(t.id) ? " on" : ""}" data-done="${t.id}">${this.store.isDone(t.id) ? "✓ Done" : "Tick off"}</button></div>`).join("")}</div>`).join("")}</div>`).join("")}`;
  }
  private shopHtml(): string {
    const lbl: Record<string, string> = { ok: "OK", chk: "Confirm", miss: "Missing", jc: "Judgment call", no: "Ordered, not used" };
    return `<div class="card"><table><tr><th>Item</th><th>Needed</th><th>Ordered / on hand</th><th>Status</th><th>Note</th></tr>
      ${this.plan.shop.map(([a, b, c, s, n]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td>${esc(c)}</td><td><span class="st ${s}">${lbl[s]}</span></td><td class="muted">${esc(n)}</td></tr>`).join("")}</table></div>`;
  }
  private notesHtml(): string {
    const local = this.store as LocalStore;
    return `<div class="grid2"><div style="display:flex;flex-direction:column;gap:16px">
      <div class="card"><span class="eb">Screens and Echos</span>
        <p style="margin-top:8px">${this.store.live ? "Every screen shows the same ticks, steps, timers and turkey readings." : "This screen keeps its own progress."} Echos read each task out loud: <b>${this.store.alarmsOn() ? "on" : "off"}</b>. <button class="btn sm" data-alarms="1">${this.store.alarmsOn() ? "Turn off" : "Turn on"}</button></p>
        ${this.store.live ? `<p style="margin-top:10px">Started on the Thanksgiving page? There, open Plan &amp; recipes → Notes &amp; safety and tap <b>Copy progress for the hub</b>, then paste it here.</p>
        <textarea id="imp" rows="3" style="width:100%;border-radius:14px;border:1px solid var(--line);padding:10px;font:13px monospace" placeholder="Paste the progress code"></textarea>
        <div style="margin-top:8px"><button class="btn sm ink" data-import="1">Bring it over</button></div>`
        : `<p style="margin-top:10px">Moving to the hub? Copy this code, then paste it into the hub's Plan &amp; recipes → Notes &amp; safety.</p>
        <textarea id="exp" rows="3" readonly style="width:100%;border-radius:14px;border:1px solid var(--line);padding:10px;font:12px monospace">${esc(local.exportCode ? local.exportCode() : "")}</textarea>
        <div style="margin-top:8px"><button class="btn sm ink" data-export="1">Copy progress for the hub</button></div>`}
      </div>
      <div class="card"><span class="eb">If something slips</span>${this.plan.ifs.map(([h, t]) => `<div class="flag"><b>${esc(h)}</b><span>${esc(t)}</span></div>`).join("")}</div>
      <div class="card"><span class="eb">Assumptions</span><ul style="margin:10px 0 0;padding-left:18px;line-height:1.55">${this.plan.assume.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="card"><span class="eb">Optional ideas (not in the plan)</span><ul style="margin:10px 0 0;padding-left:18px;line-height:1.55">${this.plan.optional.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
    <div class="card"><span class="eb">USDA food safety used in this plan</span>
      ${this.plan.safe.map(([h, t, u]) => `<div class="flag safe"><b>${esc(h)}</b><span>${esc(t)} <a href="${esc(u)}" target="_blank" rel="noopener">USDA</a></span></div>`).join("")}
      <p class="note">Leftovers: shallow containers, fridge within 2 hours, eat within 3–4 days, reheat to 165°F.</p>
      <div style="margin-top:12px"><button class="btn sm" data-resetall="1">Reset all progress${this.store.live ? " (every screen)" : " on this screen"}</button></div></div></div>`;
  }

  // ---------------------------------------------------------------- turkey pad

  private padHtml(): string {
    const p = this.turkeyPad!;
    const tf = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `<button class="scrim2" data-padclose="1" aria-label="Close"></button><div class="tpop">
      <div style="display:flex;align-items:center"><span class="eb">Log a turkey reading · done only at 165°F in all three</span><span style="flex:1"></span><button class="btn sm" data-padclose="1">Done</button></div>
      <div class="spots">${SPOTS.map((k, i) => { const x = this.store.latest(k); return `<button class="${i === p.spot ? "on" : ""}" data-spot="${i}"><span>${SPOTNAME[k]}</span><b>${x ? x.f + "°" : "—"}</b><span>${x ? "at " + tf(x.t) : "no reading"}</span></button>`; }).join("")}</div>
      <div class="entry">${p.entry ? esc(p.entry) + "°F" : `<span class="muted" style="font-size:15px;font-weight:500">${SPOTNAME[SPOTS[p.spot]]}: type the reading</span>`}</div>
      <div class="pad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((k) => `<button class="${k === "✓" ? "go" : ""}" data-key="${k}">${k}</button>`).join("")}</div>
      <p class="note">Tap ✓ to log it; it moves to the next spot. Or tell Pik: “the breast is 162.”</p></div>`;
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
    const el = (e.target as HTMLElement).closest("[data-day],[data-done],[data-timer],[data-recipe],[data-stop],[data-plus],[data-step],[data-finish],[data-close],[data-seg],[data-schedule],[data-plan],[data-turkey],[data-padclose],[data-spot],[data-key],[data-hot],[data-dish],[data-alldishes],[data-alarms],[data-import],[data-export],[data-resetall],[data-ack]") as HTMLElement | null;
    if (!el) return;
    const ds = el.dataset;
    if (ds.ack) { this.ackAlerts(); return; }
    if (ds.day !== undefined) { this.L.day = ds.day || null; this.saveL(); this.requestUpdate(); return; }
    if (ds.done) { this.store.setDone(ds.done, !this.store.isDone(ds.done)); this.requestUpdate(); return; }
    if (ds.timer) {
      const [l, m, k] = JSON.parse(ds.timer) as TimerSpec;
      this.unlockAudio();
      this.store.startTimer(l, m, k).then((err) => { if (err) this.flash(err); this.requestUpdate(); });
      return;
    }
    if (ds.stop) { this.store.stopTimer(ds.stop); this.requestUpdate(); return; }
    if (ds.plus) { this.store.plus5(ds.plus); this.flash("5 more minutes."); this.requestUpdate(); return; }
    if (ds.step) { const [id, i] = ds.step.split(":"); if (Number(i) >= 0) this.store.setStep(id, Number(i)); this.requestUpdate(); return; } // also tells Pik which recipe "next step" means
    if (ds.finish) { this.store.setDone(ds.finish, true); this.L.open = null; this.saveL(); this.flash("Ticked off."); this.requestUpdate(); return; }
    if (ds.plan !== undefined) { this.sheet = { seg: "recipes", recipe: null, day: null }; this.requestUpdate(); return; }
    if (ds.recipe !== undefined) { this.sheet = { seg: "recipes", recipe: ds.recipe || null, day: null }; this.requestUpdate(); return; }
    if (ds.dish) { this.sheet = { seg: "recipes", recipe: ds.dish, day: null }; this.requestUpdate(); return; }
    if (ds.schedule) { this.sheet = { seg: "schedule", recipe: null, day: ds.schedule }; this.requestUpdate(); return; }
    if (ds.seg) { this.sheet = { seg: ds.seg as Seg, recipe: null, day: null }; this.requestUpdate(); return; }
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
      if (confirm("Clear all ticks, steps, turkey readings and timers" + (this.store.live ? " on every screen?" : " on this screen?"))) {
        this.store.resetAll(this.plan.tasks.map((t) => t.id).concat(this.plan.dishes.map((d) => "hot_" + d.id)));
        this.L = { day: null, open: null, fired: {}, rung: {}, allDishes: false }; this.saveL(); this.requestUpdate();
      }
    }
  };

  private async copyExport(): Promise<void> {
    const ta = (this.renderRoot as ShadowRoot).querySelector<HTMLTextAreaElement>("#exp");
    if (!ta) return;
    let ok = false;
    try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (e) { /* blocked */ }
    if (!ok) { ta.focus(); ta.select(); try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ } }
    this.flash(ok ? "Copied. Paste it into the hub's Notes & safety." : "Select the code and copy it (Ctrl+C).");
  }

  /** Progress code from the backup page. v1 (old page) and v2 (this card in local mode) both work. */
  private async importProgress(): Promise<void> {
    const ta = (this.renderRoot as ShadowRoot).querySelector<HTMLTextAreaElement>("#imp");
    const code = ta ? ta.value.trim() : "";
    if (!code) { this.flash("Paste the progress code first."); return; }
    let data: { v: number; done: string[]; steps?: Record<string, number>; hot?: string[]; temps: Array<{ loc: string; f: number; t: number }>; timers: Array<{ label: string; kind: TimerKind; end: number }> };
    try { data = JSON.parse(decodeURIComponent(escape(atob(code.replace(/\s+/g, ""))))); } catch (e) { this.flash("That code didn't read. Copy it again from the page."); return; }
    const known = new Set(this.plan.tasks.map((t) => t.id));
    const ids = (data.done || []).filter((i) => known.has(i));
    this.store.setMany(ids, true);
    Object.keys(data.steps || {}).forEach((k) => { if (known.has(k) && !ids.includes(k)) this.store.setStep(k, data.steps![k]); });
    (data.hot || []).forEach((d) => this.store.setHot(d, true));
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
    const todayLeft = this.plan.tasks.filter((t) => t.day === d && !this.store.isDone(t.id)).length;
    const sub = this.inFinalHour() ? "Everything hot by 4:00 · " + todayLeft + " left" : todayLeft + (todayLeft === 1 ? " task" : " tasks") + " left today" + (this.store.live ? "" : " · this screen only");
    const a = this.Q[this.Q.length - 1];
    return html`<div class="op" @click=${this.onClick}>
<header><div class="hd">
  <div class="clock" id="clock"></div>
  ${a ? html`<div class="ringbar" role="alert"><b>${a.when}</b><span>${a.text}</span>${this.Q.length > 1 ? html`<small>+${this.Q.length - 1} more</small>` : nothing}<button data-ack="1">Got it</button></div>`
      : html`<div class="ttl"><b>${this.todayKey() ? this.plan.dayNames[d] + " · " + this.plan.title : this.plan.title + " starts " + this.plan.dayNames[Object.keys(this.plan.days)[0]].toLowerCase()}</b><span>${sub}</span></div>`}
  <button class="tkb" data-turkey="1"><span class="dot ${ts.cls}">${ts.sym}</span><span class="t"><b>${ts.head}</b><span>${ts.sub}</span></span></button>
  <button class="ico ${this.store.alarmsOn() ? "" : "off"}" data-alarms="1" title=${this.store.alarmsOn() ? "Echos read tasks out loud. Tap to mute." : "Echos are muted. Tap to turn back on."}>${this.store.alarmsOn() ? "🔊" : "🔇"}</button>
  <button class="ibtn" data-plan="1">Plan &amp; recipes</button>
  <div class="cdn"><span class="eb">${left > 0 ? "Dinner in" : "Dinner"}</span><div class="big">${count}</div></div>
</div></header>
${unsafeHTML(this.stationsHtml())}
<div class="bdy">${unsafeHTML(this.nowHtml())}<div class="rc">${unsafeHTML(this.timersHtml())}${unsafeHTML(this.dishesHtml())}</div></div>
${unsafeHTML(this.ribbonHtml())}
${this.sheet ? unsafeHTML(this.sheetHtml()) : nothing}
${this.turkeyPad ? unsafeHTML(this.padHtml()) : nothing}
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
  w.customCards.push({ type: "pik-holiday-card", name: "Pik holiday cooking", description: "Runs a big meal's plan on one page: tasks with recipe steps, timers, alarms, stations and dishes.", preview: false });
}
