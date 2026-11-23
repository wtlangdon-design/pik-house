// Pik House Feed: a Home Assistant dashboard card for the kitchen Chromebook.
//
// Phase 0: the card runs on the prototype's fake data (mock mode). The logic below is a
// port of reference/daylight-reference.html; where that file and SPEC.md disagree, the
// prototype wins on looks and the spec wins on behavior.
import { LitElement, html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { keyed } from "lit/directives/keyed.js";
import { adjustStyles, daylightStyles, hostStyles } from "./styles";
import { pikArt } from "./pik-art";
// Holiday cooking mode ships in the same bundle: <pik-holiday-card>.
import "./holiday/holiday-card";
import "./smoke/smoke-card";
import { energySheet, plantsSheet, homeSheet } from "./views";
import { ALL, CAP, GROUPS, INITIAL, PLANT_TOTAL, LABELS, PAUSE, PLAY, QUESTIONS, QUEUE, type FeedCard, type PikState } from "./mock-data";

const FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";

export interface PikHouseCardConfig {
  type: string;
  mock?: boolean;
  [key: string]: unknown;
}

interface NowPlaying { kind: string; title: string; sub: string; playing: boolean }
interface Timer { id: number; label: string; total: number; end: number; rang: boolean }
type Lights = Record<"living" | "porch" | "kitchen", boolean>;
type Page = "home" | "energy" | "plants" | "controls";
type Talk = "listen" | "think" | "speak";

interface State {
  now?: number;
  sec?: number;
  cards?: string[];
  queue?: string[];
  newest?: string | null;
  focus?: string | null;
  moist?: Record<string, number>;
  setpoint?: number;
  lights?: Lights;
  garden?: boolean;
  outage?: boolean;
  essentials?: boolean;
  smoky?: boolean;
  np?: NowPlaying | null;
  mode?: "day" | "night" | null;
  page?: Page;
  talk?: Talk | null;
  q?: string;
  a?: string;
  qi?: number;
  muted?: boolean;
  timers?: Timer[];
  idx?: number;
  toast?: string;
  vol?: number;
}

export interface Energy {
  solar: number;
  house: number;
  bat: number;
  grid: number | null;
  pct: number;
  hours?: number | null;
  main?: string;
  sub?: string;
}

function kw(v: number | null): string {
  return Math.abs(v || 0).toFixed(1) + " kW";
}

export class PikHouseCard extends LitElement {
  static styles = [hostStyles, daylightStyles, adjustStyles];

  private config: PikHouseCardConfig = { type: "custom:pik-house-card", mock: true };
  private _hass: unknown = undefined;
  private st: State = {};
  private toastN = 0;

  private _tick?: number;
  private _cycle?: number;
  private _sec?: number;
  private _toastT?: number;
  private _idle?: number;
  private _t1?: number;
  private _t2?: number;
  private _t3?: number;
  private _hold = 0;
  private _ac?: AudioContext;
  private _last?: { count: number; curIdx: number; urgent: boolean };

  // ---- Home Assistant card API ----

  setConfig(config: PikHouseCardConfig): void {
    if (!config) throw new Error("pik-house-card: missing config");
    this.config = config;
    this.requestUpdate();
  }

  set hass(hass: unknown) {
    const was = this.isMock;
    this._hass = hass;
    if (was !== this.isMock) this.requestUpdate();
  }

  get hass(): unknown {
    return this._hass;
  }

  getCardSize(): number {
    return 16;
  }

  static getStubConfig(): PikHouseCardConfig {
    return { type: "custom:pik-house-card", mock: true };
  }

  /** Mock mode: `mock: true` in the config, or no Home Assistant connection at all. */
  get isMock(): boolean {
    return this.config.mock === true || !this._hass;
  }

  // ---- lifecycle ----

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts();
    this._tick = window.setInterval(() => this.setState({ now: Date.now() }), 30000);
    // When nothing is urgent, Pik moves to the next item every 25 seconds (paused for a minute after you page by hand).
    this._cycle = window.setInterval(() => this.autoAdvance(), 25000);
    this._sec = window.setInterval(() => this.tickTimers(), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._tick);
    clearInterval(this._cycle);
    clearInterval(this._sec);
    clearTimeout(this._toastT);
    clearTimeout(this._idle);
    this.clearTalk();
  }

  private setState(p: Partial<State>): void {
    this.st = Object.assign({}, this.st, p);
    this.requestUpdate();
  }

  // ---- timers ----

  private tickTimers(): void {
    const ts = this.st.timers || [];
    if (!ts.length) return;
    const now = Date.now();
    let rang = false;
    const next = ts.map((x) => {
      if (!x.rang && x.end <= now) { rang = true; return Object.assign({}, x, { rang: true }); }
      return x;
    });
    if (rang) this.chime();
    this.setState({ timers: next, sec: now });
  }

  private chime(): void {
    // Three soft beeps. Browsers may block sound until the screen has been tapped once.
    try {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = this._ac || (this._ac = new A());
      [0, 0.35, 0.7].forEach((off) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        const t0 = ctx.currentTime + off;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        o.start(t0); o.stop(t0 + 0.3);
      });
    } catch (err) { /* no sound available */ }
  }

  private addTimer(label: string, ms: number): void {
    const now = Date.now();
    const ts = (this.st.timers || []).concat([{ id: now, label, total: ms, end: now + ms, rang: false }]).slice(-2);
    this.setState({ timers: ts });
  }

  private stopTimer(id: number): void {
    this.setState({ timers: (this.st.timers || []).filter((x) => x.id !== id) });
  }

  // ---- paging, sheets, talk ----

  private autoAdvance(): void {
    const L = this._last;
    const st = this.st;
    if (!L || L.count < 2 || L.urgent || st.talk || (st.page && st.page !== "home")) return;
    if (Date.now() < this._hold) return;
    this.setState({ idx: (L.curIdx + 1) % L.count, focus: null });
  }

  private go(page: Page): void {
    clearTimeout(this._idle);
    this.clearTalk();
    this.setState({ page, talk: null });
    // A detail page drifts back home after 90 seconds untouched.
    if (page !== "home") this._idle = window.setTimeout(() => this.setState({ page: "home" }), 90000);
  }

  private clearTalk(): void {
    clearTimeout(this._t1);
    clearTimeout(this._t2);
    clearTimeout(this._t3);
  }

  private cur() {
    const s = this.st;
    let m = s.moist;
    if (!m) { m = {}; GROUPS.forEach((g) => { m![g.id] = g.m; }); }
    return {
      cards: s.cards || INITIAL.slice(),
      queue: s.queue || QUEUE.slice(),
      newest: s.newest || null,
      moist: m,
      setpoint: s.setpoint || 70,
      lights: s.lights || { living: true, porch: true, kitchen: false },
      garden: s.garden === undefined ? true : s.garden,
      outage: !!s.outage,
      essentials: !!s.essentials,
      smoky: !!s.smoky,
      np: s.np === undefined ? { kind: "video", title: "Judy Justice", sub: "Prime Video", playing: true } : s.np,
    };
  }

  private hour(): number {
    const st = this.st;
    if (st.mode === "day") return 16;
    if (st.mode === "night") return 23;
    return new Date(st.now || Date.now()).getHours();
  }

  private thirsty(moist: Record<string, number>) {
    return GROUPS.filter((g) => moist[g.id] < g.thr);
  }

  private energy(s: ReturnType<PikHouseCard["cur"]>, dark: boolean): Energy {
    let e: Energy;
    if (s.outage) {
      const house = dark ? (s.essentials ? 0.7 : 1.4) : (s.essentials ? 0.9 : 1.7);
      e = dark ? { solar: 0, house, bat: -house, grid: null, pct: 71 } : { solar: 4.8, house, bat: 4.8 - house, grid: null, pct: 82 };
    } else if (dark) {
      e = { solar: 0, house: 1.5, bat: -1.5, grid: 0, pct: 71 };
    } else {
      e = { solar: 4.8, house: 1.6, bat: 2.1, grid: 1.1, pct: 78 };
    }
    e.hours = e.bat < 0 ? Math.round((e.pct / 100) * CAP / -e.bat) : null;
    if (s.outage && dark) { e.main = "Power's out. The Powerwall has it."; e.sub = (s.essentials ? "Essentials only · about " : "About ") + e.hours + " hours left at this rate"; }
    else if (s.outage) { e.main = "Power's out. Solar and the Powerwall have it."; e.sub = "Still charging the battery while the grid is down"; }
    else if (dark) { e.main = "The Powerwall is running the house"; e.sub = "Solar's asleep until about 7 AM"; }
    else { e.main = "The sun is running the house"; e.sub = "Charging the Powerwall · sending the extra to the grid"; }
    return e;
  }

  private flash(msg: string): void {
    clearTimeout(this._toastT);
    this.toastN++;
    this.setState({ toast: msg });
    this._toastT = window.setTimeout(() => this.setState({ toast: "" }), 2600);
  }

  private water(ids: string[]) {
    const s = this.cur();
    const m = Object.assign({}, s.moist);
    GROUPS.forEach((g) => { if (ids.indexOf(g.id) >= 0) m[g.id] = Math.min(60, g.thr + 22); });
    this.setState({ moist: m });
    return m;
  }

  private applyFx(fx: string): void {
    const s = this.cur();
    if (fx === "heat64") this.setState({ setpoint: 64 });
    if (fx === "gardenOff") this.setState({ garden: false });
    if (fx === "livingOff") this.setState({ lights: Object.assign({}, s.lights, { living: false }) });
    if (fx === "porchOff") this.setState({ lights: Object.assign({}, s.lights, { porch: false }) });
    if (fx === "essentials") this.setState({ essentials: true });
    if (fx === "outageOn") this.setState({ outage: true, essentials: false });
    if (fx === "outageOff") this.setState({ outage: false, essentials: false });
    if (fx === "smokeOn") this.setState({ smoky: true });
    if (fx === "smokeOff") this.setState({ smoky: false });
  }

  private resolve(id: string, msg: string, snooze: boolean, fx?: string | null): void {
    const s = this.cur();
    const queue = snooze ? s.queue.concat([id]) : s.queue;
    this.setState({ cards: s.cards.filter((x) => x !== id), queue, newest: null, focus: null });
    if (fx) this.applyFx(fx);
    this.flash(msg);
  }

  /** "Simulate event": the next item from the demo queue arrives. */
  private next(): void {
    const s = this.cur();
    if (!s.queue.length) {
      const m: Record<string, number> = {}; GROUPS.forEach((g) => { m[g.id] = g.m; });
      this.setState({ cards: INITIAL.slice(), queue: QUEUE.slice(), newest: null, moist: m, setpoint: 70, garden: true, outage: false, essentials: false, smoky: false, lights: { living: true, porch: true, kitchen: false }, timers: [], np: undefined });
      this.flash("Demo restarted.");
      return;
    }
    const id = s.queue[0];
    const rest = s.queue.slice(1);
    if (id === "ferns") {
      const g = GROUPS.find((x) => x.id === "kitchen")!;
      const mm = Object.assign({}, s.moist); mm.kitchen = g.thr - 12;
      this.setState({ moist: mm, cards: ["plants"].concat(s.cards.filter((x) => x !== "plants")), queue: rest, newest: "plants", focus: "plants" });
      return;
    }
    if (ALL[id] && ALL[id].arrive) this.applyFx(ALL[id].arrive!);
    // Urgent items close any open sheet.
    if (ALL[id] && ALL[id].urgent) { clearTimeout(this._idle); this.setState({ page: "home" }); }
    this.setState({ cards: [id].concat(s.cards.filter((x) => x !== id)), queue: rest, newest: id, focus: id });
  }

  private answer(i: number): string {
    const s = this.cur();
    const dark = this.hour() >= 17 || this.hour() < 7;
    const e = this.energy(s, dark);
    const q = QUESTIONS[i];
    if (q.indexOf("pasta timer") >= 0) { this.addTimer("Pasta", 60000); return "Pasta timer, one minute. Starting now."; }
    if (q.indexOf("Robyn") >= 0) { this.setState({ np: { kind: "music", title: "Robyn", sub: "Amazon Music", playing: true } }); return "Playing Robyn on the Echo Show."; }
    if (q.indexOf("Judy") >= 0) { this.setState({ np: { kind: "video", title: "Judy Justice", sub: "Prime Video", playing: true } }); return "Judy Justice is back on the Echo Show. Court is in session."; }
    if (q.indexOf("tonight") >= 0) return (dark ? "31° now" : "48° now") + ", down to 28° tonight. It's the first freeze, so the patio pots should come in.";
    if (q.indexOf("Powerwall") >= 0) {
      if (s.outage) return "The grid's down. The Powerwall is at " + e.pct + "%" + (e.hours ? " with about " + e.hours + " hours left." : " and still charging from solar.");
      if (dark) return "It's at " + e.pct + "% and running the house. Solar picks back up around 7.";
      return "Solar's making 4.8 kW, the house is using 1.6, and the Powerwall is at 78% and charging. Smug, but earned.";
    }
    if (q.indexOf("plants") >= 0) {
      const t = this.thirsty(s.moist);
      if (!t.length) return "Nobody. All 7 groups are fine.";
      const n = t.reduce((a, g) => a + g.plants, 0);
      return t.map((g) => g.room).join(", then ") + ". That's " + n + " plants, about " + n + " minutes. The " + t[0].ind + " is doing most of the complaining.";
    }
    this.applyFx("porchOff");
    return "Done. The porch light is off.";
  }

  /** Mock conversation: tapping Pik walks through listening, thinking and speaking. */
  private talk(): void {
    const st = this.st;
    if (st.muted) { this.flash("My mic is off. Tap “Mic off” to turn it back on."); return; }
    if (st.talk) return;
    const i = (st.qi || 0) % QUESTIONS.length;
    this.clearTalk();
    this.setState({ talk: "listen", q: QUESTIONS[i], a: "", qi: i + 1 });
    this._t1 = window.setTimeout(() => this.setState({ talk: "think" }), 1600);
    this._t2 = window.setTimeout(() => this.setState({ talk: "speak", a: this.answer(i) }), 2900);
    this._t3 = window.setTimeout(() => this.setState({ talk: null }), 8000);
  }

  // ---- view model ----

  renderVals() {
    const s = this.cur();
    const st = this.st;
    const h = this.hour();
    const quiet = h >= 23 || h < 7;
    const dark = h >= 17 || h < 7;
    const d = new Date(st.now || Date.now());
    const mins = d.getMinutes();
    let clock: string, ampm: string;
    if (st.mode === "day") { clock = "4:32"; ampm = "PM"; }
    else if (st.mode === "night") { clock = "11:42"; ampm = "PM"; }
    else { clock = (h % 12 === 0 ? 12 : h % 12) + ":" + (mins < 10 ? "0" : "") + mins; ampm = h < 12 ? "AM" : "PM"; }
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // plants
    const thirsty = this.thirsty(s.moist);
    const thirstyIds = thirsty.map((g) => g.id);
    const routeOn = thirsty.length >= 2;
    const groups = GROUPS.map((g) => {
      const m = s.moist[g.id];
      const tone = m < g.thr ? "dry" : m >= 55 ? "wet" : "ok";
      const stop = routeOn ? thirstyIds.indexOf(g.id) + 1 : 0;
      const status = tone === "dry" ? "Thirsty" : tone === "wet" ? "Moist" : "Steady";
      return {
        id: g.id,
        cls: "prow " + tone,
        room: g.room,
        sub: g.ind.charAt(0).toUpperCase() + g.ind.slice(1) + " · " + g.plants + " plants",
        m,
        status,
        fill: "width:" + Math.min(100, (m / 70) * 100).toFixed(0) + "%",
        tick: "left:" + ((g.thr / 70) * 100).toFixed(0) + "%",
        hasStop: stop > 0,
        isDry: tone === "dry",
        stop,
        tap: () => {
          if (s.moist[g.id] < g.thr) { this.water([g.id]); this.flash("Logged: " + g.room.toLowerCase() + " group watered."); }
          else this.flash(g.room + " is at " + m + "%. No water needed.");
        },
      };
    });
    const plantsNeeded = thirsty.reduce((a, g) => a + g.plants, 0);

    // cards
    const isUrg = (id: string) => !!(ALL[id] && ALL[id].urgent);
    const ids = s.cards.filter((id) => id !== "plants" || thirsty.length > 0);
    let visibleIds = quiet ? ids.filter(isUrg) : ids;
    // Urgent first.
    visibleIds = visibleIds.filter(isUrg).concat(visibleIds.filter((id) => !isUrg(id)));
    const waiting = ids.length - visibleIds.length;
    const cards = visibleIds.map((id) => {
      let c: FeedCard = ALL[id];
      if (id === "plants") {
        const one = thirsty.length === 1;
        c = {
          cat: "plant",
          label: "Plants · indicator sensors",
          title: one ? (thirsty[0].id === "kitchen" ? "The nerve plant has fainted again" : "The " + thirsty[0].room.toLowerCase() + " group is thirsty") : thirsty.length + " plant groups need water",
          detail: one ? "The " + thirsty[0].ind + " is at " + s.moist[thirsty[0].id] + "%. Water all " + thirsty[0].plants + " plants in the " + thirsty[0].room.toLowerCase() + " group" + (thirsty[0].id === "kitchen" ? ". It perks up within the hour." : ".") : thirsty.map((g) => g.room).join(" → ") + ". " + plantsNeeded + " plants, about " + plantsNeeded + " minutes. Tap Plants for the route.",
          primary: one ? "Watered" : "Watered them all",
          secondary: "Snooze 1 day",
          toast: one ? "Logged: " + thirsty[0].room.toLowerCase() + " group watered." : "Logged: " + thirsty.length + " groups watered.",
        };
      }
      return {
        cat: c.cat,
        urgent: !!c.urgent,
        label: c.label,
        title: c.title,
        detail: c.detail,
        primary: c.primary,
        secondary: c.secondary || "",
        hasSecondary: !!c.secondary,
        onPrimary: () => {
          if (id === "plants") this.water(thirstyIds);
          this.resolve(id, c.toast, false, c.fx);
        },
        onSecondary: () => this.resolve(id, c.secondary === "Snooze 1 day" ? "Snoozed. I'll bring it back tomorrow." : c.secondary === "In an hour" ? "Okay. I'll remind you in an hour." : "Okay, dismissed.", c.secondary === "Snooze 1 day" || c.secondary === "In an hour", null),
      };
    });
    const count = visibleIds.length;
    const urgent = ids.some(isUrg);

    // energy
    const e = this.energy(s, dark);
    const batH = (e.pct * 0.34).toFixed(1);
    const gridFlow = e.grid === null ? "flow w-grid" : e.grid > 0 ? "flow w-grid on rev" : e.grid < 0 ? "flow w-grid on" : "flow w-grid";

    // pik
    const nowMs = Date.now();
    const tlist = st.timers || [];
    const timerDone = tlist.some((x) => x.end <= nowMs);
    const pik: PikState = st.talk || (urgent || timerDone ? "alert" : st.muted ? "muted" : "rest");

    const page = st.page || "home";
    const nOn = (["living", "porch", "kitchen"] as const).filter((k) => s.lights[k]).length;
    const stops = thirsty.map((g, i) => ({ n: i + 1, room: g.room, plants: g.plants }));

    const anyUrg = visibleIds.some(isUrg);
    const focusOk = !!st.focus && visibleIds.indexOf(st.focus) >= 0 && (!anyUrg || isUrg(st.focus));
    const curIdx = focusOk ? visibleIds.indexOf(st.focus!) : anyUrg ? 0 : Math.min(st.idx || 0, Math.max(0, count - 1));
    this._last = { count, curIdx, urgent: anyUrg };
    const curCard = cards[curIdx] || { cat: "", label: "", title: "", detail: "", primary: "", secondary: "", hasSecondary: false, urgent: false, onPrimary: () => {}, onSecondary: () => {} };
    const L = s.lights;
    const page_ = (p: Page) => () => this.go(p);

    return {
      appCls: (quiet ? "night " : "") + (dark ? "dark" : ""),
      themeCls: dark ? "" : "light",
      pik,
      pikAria: "Pik: " + LABELS[pik],
      pikLabel: LABELS[pik],
      pillCls: pik === "alert" ? "pill alert" : "pill",
      talk: () => this.talk(),
      q: st.q || "",
      a: st.talk === "listen" ? "Listening…" : st.talk === "think" ? "Thinking…" : (st.a || ""),
      micCls: st.muted ? "mic off" : "mic",
      micPressed: st.muted ? "true" : "false",
      micLabel: st.muted ? "Mic off" : "Mic on",
      micSlash: st.muted ? "M3 3l18 18" : "",
      toggleMic: () => { this.clearTalk(); this.setState({ muted: !st.muted, talk: null }); },
      clock,
      ampm,
      dayName: days[d.getDay()],
      monthDay: months[d.getMonth()] + " " + d.getDate(),
      outTemp: dark ? "31°" : "48°",
      outLine: (dark ? "Clear" : "Sunny") + " · low 28°",
      airShort: s.smoky ? "air smoky" : "air good",
      airCls2: s.smoky ? "" : "airok",
      demoLabel: s.queue.length ? "Simulate event" : "Restart demo",
      next: () => this.next(),
      dayBtnCls: st.mode === "day" ? "ghost on" : "ghost",
      dayBtn: st.mode === "day" ? "Back to live" : "Preview day",
      previewDay: () => this.setState({ mode: st.mode === "day" ? null : "day" }),
      nightBtnCls: st.mode === "night" ? "ghost on" : "ghost",
      nightBtn: st.mode === "night" ? "Back to live" : "Preview night",
      previewNight: () => this.setState({ mode: st.mode === "night" ? null : "night" }),

      // bubble
      showTalk: !!st.talk,
      showCard: !st.talk && count > 0,
      showEmpty: !st.talk && count === 0,
      bubbleCls: "bubble" + (!st.talk && curCard.urgent ? " urgent" : ""),
      cur: curCard,
      pagerTxt: count === 1 ? "1 thing for you" : (curIdx + 1) + " of " + count,
      pdots: count > 1 ? visibleIds.map((_x, i) => (i === curIdx ? "on" : "")) : [],
      hasWaiting: quiet && waiting > 0,
      waiting,
      prevCls: count > 1 ? "nbtn" : "nbtn dim",
      nextCls: count > 1 ? "nbtn" : "nbtn dim",
      goPrev: () => { if (count > 1) { this._hold = Date.now() + 60000; this.setState({ idx: (curIdx - 1 + count) % count, focus: null }); } },
      goNext: () => { if (count > 1) { this._hold = Date.now() + 60000; this.setState({ idx: (curIdx + 1) % count, focus: null }); } },
      hasPeek: count > 1,
      peekTitle: count > 1 ? cards[(curIdx + 1) % count].title : "",
      emptyEb: quiet ? "Quiet hours" : "Pik's list",
      emptyT: quiet ? "Nothing urgent" : "All caught up",
      emptyS: quiet ? (waiting > 0 ? waiting + (waiting === 1 ? " thing is" : " things are") + " waiting for 7 AM. Sleep well." : "Nothing is waiting. Sleep well.") : "Even the nerve plant has nothing to say.",

      // timers
      tmodeCls: tlist.length ? "tmode" : "",
      timers: tlist.map((x) => {
        const left = Math.max(0, x.end - nowMs);
        const secs = Math.ceil(left / 1000);
        const done = left <= 0;
        return {
          id: x.id,
          cls: "tchip" + (done ? " tdone" : ""),
          left: done ? "Done" : Math.floor(secs / 60) + ":" + ("0" + (secs % 60)).slice(-2),
          label: x.label,
          dash: "stroke-dashoffset:" + (163.4 * (1 - left / x.total)).toFixed(1),
          btn: done ? "Stop" : "×",
          aria: done ? "Stop the " + x.label + " timer" : "Cancel the " + x.label + " timer",
          stop: () => { this.stopTimer(x.id); if (!done) this.flash(x.label + " timer canceled."); },
        };
      }),

      // pebbles
      pebsCls: s.np ? "pebs five" : "pebs",
      np: s.np,
      npTitle: s.np ? s.np.title : "",
      npSub: s.np ? (s.np.playing ? "" : "Paused · ") + "Echo Show · " + s.np.sub : "",
      eqCls: s.np && s.np.playing ? "eq on" : "eq",
      npIcon: s.np && s.np.playing ? PAUSE : PLAY,
      npToggleLbl: s.np && s.np.playing ? "Pause" : "Play",
      npToggle: () => { if (s.np) this.setState({ np: Object.assign({}, s.np, { playing: !s.np.playing }) }); },
      volDown: () => { const v = Math.max(1, (st.vol || 5) - 1); this.setState({ vol: v }); this.flash("Echo volume " + v); },
      volUp: () => { const v = Math.min(10, (st.vol || 5) + 1); this.setState({ vol: v }); this.flash("Echo volume " + v); },
      npStop: () => { this.setState({ np: null }); this.flash("Stopped the Echo Show."); },
      pebEnCls: "peb" + (s.outage ? " out" : ""),
      modeTxt: s.outage ? "Grid outage" : dark ? "After dark" : "Solar day",
      bfillCls: "bfill" + (e.bat > 0 ? " chg" : e.bat < 0 ? " dis" : "") + (s.outage ? " out" : ""),
      bfillStyle: "width:" + e.pct + "%",
      pebEnLine: s.outage ? "Grid's down · tap for details" : dark ? "The battery is running the house" : "Charging from the sun",
      pebPlCls: "pv" + (thirsty.length ? " dry" : ""),
      plBig: thirsty.length ? String(thirsty.length) : String(PLANT_TOTAL),
      plBigSub: thirsty.length ? (thirsty.length === 1 ? "group thirsty" : "groups thirsty") : "plants happy",
      gdots: GROUPS.map((g) => { const m = s.moist[g.id]; return m < g.thr ? "dry" : m >= 55 ? "wet" : ""; }),
      plShort: thirsty.length ? thirsty.map((g) => g.room).join(" → ") : "Everyone's had a drink",
      setpoint: s.setpoint,
      heatWord: s.setpoint > 68 ? "heating" : "holding",
      nOn,
      waterWord: s.garden ? "Freeze skip · drip on" : "Both paused",

      // sheets
      page,
      sheetOpen: page !== "home",
      goHome: page_("home"),
      openEnergy: page_("energy"),
      openPlants: page_("plants"),
      openControls: page_("controls"),

      // energy sheet
      e,
      ewinCls: "ewin" + (s.outage ? " out" : ""),
      energyAria: e.main + ". " + e.sub + ".",
      solarFlow: e.solar > 0 ? "flow w-sun on" : "flow w-sun",
      gridFlow,
      batFlow: e.bat < 0 ? "flow w-bat on" : e.bat > 0 ? "flow w-bat on rev" : "flow w-bat",
      solarLbl: dark ? "SOLAR · ASLEEP" : "SOLAR",
      solarVal: kw(e.solar),
      houseVal: kw(e.house),
      gridLbl: s.outage ? "GRID · DOWN" : (e.grid || 0) > 0 ? "GRID · EXPORT" : (e.grid || 0) < 0 ? "GRID · IMPORT" : "GRID · IDLE",
      gridVal: s.outage ? "Offline" : kw(e.grid),
      batStyle: "height:" + batH + "px;y:" + (17 - Number(batH)).toFixed(1) + "px",
      batVal: e.pct + "% · " + (e.bat > 0 ? "+" : "−") + kw(e.bat),
      gridStat: s.outage ? "Down" : (e.grid || 0) > 0 ? "Sending " + kw(e.grid) : (e.grid || 0) < 0 ? "Using " + kw(e.grid) : "Idle",
      showEssentials: s.outage && !s.essentials,
      essentialsOn: () => { this.applyFx("essentials"); this.setState({ cards: this.cur().cards.filter((x) => x !== "outage") }); this.flash("Essentials only. That roughly doubles the time left."); },

      // plants sheet
      groups,
      plantsEb: "Plants · " + PLANT_TOTAL + " in " + GROUPS.length + " groups",
      plHead: thirsty.length ? thirsty.length + " thirsty" : "All happy",
      routeLbl: thirsty.length ? "Watering route" : "All caught up",
      routeHead: thirsty.length > 1 ? thirsty.length + " stops, about " + plantsNeeded + " minutes" : thirsty.length ? "One stop, about " + plantsNeeded + " minutes" : "Nothing to water today",
      routeStops: stops,
      hasRoute: thirsty.length > 0,
      routeBtn: routeOn ? "Log the whole route" : "Log it",
      logRoute: () => {
        this.water(thirstyIds);
        this.setState({ cards: this.cur().cards.filter((x) => x !== "plants") });
        this.flash(routeOn ? "Logged: " + thirsty.length + " groups watered." : "Logged: watered.");
      },

      // home sheet
      down: () => this.setState({ setpoint: Math.max(60, s.setpoint - 1) }),
      up: () => this.setState({ setpoint: Math.min(78, s.setpoint + 1) }),
      thermoSub: s.setpoint > 68 ? "Heating · it's 68° inside" : "Holding · it's 68° inside",
      lights: ([["living", "Living room"], ["porch", "Porch"], ["kitchen", "Kitchen"]] as const).map((x) => ({
        name: x[1],
        cls: L[x[0]] ? "lp on" : "lp",
        state: L[x[0]] ? "On" : "Off",
        pressed: L[x[0]] ? "true" : "false",
        toggle: () => { const nl = Object.assign({}, L); nl[x[0]] = !L[x[0]]; this.setState({ lights: nl }); },
      })),
      gardenTxt: s.garden ? "Drip runs on its schedule" : "Paused until March 1",
      gardenBtn: s.garden ? "Pause until March" : "Resume",
      toggleGarden: () => { this.setState({ garden: !s.garden }); this.flash(s.garden ? "The garden drip is paused until March 1." : "The garden drip is back on schedule."); },
      camera: () => this.flash("Opening the front door camera."),

      hasToast: !!st.toast,
      toast: st.toast || "",
    };
  }

  // ---- render ----

  render() {
    const v = this.renderVals();
    const cur = v.cur;
    return html`<div class="app ${v.appCls} ${v.themeCls}">
<header class="top">
<div class="clock">${v.clock}<span>${v.ampm}</span></div>
<div class="date">${v.dayName}<br>${v.monthDay}</div>
<div class="sep"></div>
<div class="wx"><b>${v.outTemp}</b>${v.outLine} · <span class=${v.airCls2}>${v.airShort}</span></div>
<div class="sep"></div>
<div class="wx"><b>68°</b>inside</div>
${this.isMock ? html`<div class="demo">
<button type="button" class="dbtn" @click=${v.next}>＋ ${v.demoLabel}</button>
<button type="button" class=${v.dayBtnCls} @click=${v.previewDay}>${v.dayBtn}</button>
<button type="button" class=${v.nightBtnCls} @click=${v.previewNight}>${v.nightBtn}</button>
</div>` : nothing}
</header>
<section class="stage">
<div class="pikcol ${v.tmodeCls}">
<button type="button" class="pikbtn pik p-${v.pik}" aria-label="Talk to Pik" @click=${v.talk}>
${pikArt(v.pikAria)}
</button>
<div class="pikname"><b>Pik</b><span class=${v.pillCls}>${v.pikLabel}</span><button type="button" class=${v.micCls} aria-pressed=${v.micPressed} aria-label=${v.micLabel} @click=${v.toggleMic}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3"></path><path d=${v.micSlash}></path></svg></button></div>
${v.timers.length ? html`<div class="timers">${repeat(v.timers, (tm) => tm.id, (tm) => html`<div class=${tm.cls}><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle class="tr-bg" cx="32" cy="32" r="26"></circle><circle class="tr-fg" cx="32" cy="32" r="26" style=${tm.dash}></circle></svg><div class="tt"><b>${tm.left}</b><span>${tm.label}</span></div><button type="button" class="tx" aria-label=${tm.aria} @click=${tm.stop}>${tm.btn}</button></div>`)}</div>` : nothing}
</div>
<div class=${v.bubbleCls} aria-live="polite">
${v.showTalk ? html`<div class="btop"><span class="eb">You asked</span></div>
<p class="q">“${v.q}”</p>
<p class="ans">${v.a}</p>` : nothing}
${v.showCard ? html`<div class="btop"><span class="eb">${v.pagerTxt}</span><span class="pdots">${v.pdots.map((c) => html`<i class=${c}></i>`)}</span>${v.hasWaiting ? html`<span class="wait">· ${v.waiting} waiting for morning</span>` : nothing}
<span class="nav"><button type="button" class=${v.prevCls} aria-label="Previous" @click=${v.goPrev}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button><button type="button" class=${v.nextCls} aria-label="Next" @click=${v.goNext}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button></span></div>
<div class="cat"><i class="cd ${cur.cat}"></i><span class="eb">${cur.urgent ? html`<span class="utag">Urgent · </span>` : nothing}${cur.label}</span></div>
<h2 class="btitle">${cur.title}</h2>
<p class="bdetail">${cur.detail}</p>
<div class="acts"><button type="button" class="pbtn" @click=${cur.onPrimary}>${cur.primary}</button>${cur.hasSecondary ? html`<button type="button" class="sbtn" @click=${cur.onSecondary}>${cur.secondary}</button>` : nothing}${v.hasPeek ? html`<button type="button" class="peek" @click=${v.goNext}><span class="eb">Next</span><span class="pt">${v.peekTitle}</span><span aria-hidden="true">›</span></button>` : nothing}</div>` : nothing}
${v.showEmpty ? html`<div class="btop"><span class="eb">${v.emptyEb}</span></div>
<h2 class="btitle" style="margin-top: 26px">${v.emptyT}</h2>
<p class="bdetail">${v.emptyS}</p>` : nothing}
</div>
</section>
<section class=${v.pebsCls}>
${v.np ? html`<div class="peb np">
<span class="nphead"><span class=${v.eqCls}><i></i><i></i><i></i></span><span class="eb">Now playing</span></span>
<span class="npt">${v.npTitle}</span>
<span class="ps" style="margin-top: 4px">${v.npSub}</span>
<span class="npc">
<button type="button" class="nc main" aria-label=${v.npToggleLbl} @click=${v.npToggle}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d=${v.npIcon}></path></svg></button>
<button type="button" class="nc" aria-label="Volume down" @click=${v.volDown}>−</button>
<button type="button" class="nc" aria-label="Volume up" @click=${v.volUp}>+</button>
<button type="button" class="nc" aria-label="Stop" @click=${v.npStop}>×</button>
</span>
</div>` : nothing}
<button type="button" class=${v.pebEnCls} @click=${v.openEnergy}>
<span class="eb">Energy · ${v.modeTxt}</span>
<span class="pv">${v.e.pct}%<small>Powerwall</small></span>
<span class="bbar"><span class=${v.bfillCls} style=${v.bfillStyle}></span></span>
<span class="ps">${v.pebEnLine}</span>
</button>
<button type="button" class="peb" @click=${v.openPlants}>
<span class="eb">Plants · ${GROUPS.length} groups</span>
<span class=${v.pebPlCls}>${v.plBig}<small>${v.plBigSub}</small></span>
<span class="gd">${v.gdots.map((c) => html`<i class=${c}></i>`)}</span>
<span class="ps">${v.plShort}</span>
</button>
<button type="button" class="peb" @click=${v.openControls}>
<span class="eb">Heat · Ecobee</span>
<span class="pv">${v.setpoint}°<small>${v.heatWord}</small></span>
<span class="ps">It's 68° inside</span>
</button>
<button type="button" class="peb" @click=${v.openControls}>
<span class="eb">Lights &amp; watering</span>
<span class="pv">${v.nOn}<small>of 3 lights on</small></span>
<span class="ps">${v.waterWord}</span>
</button>
</section>
${v.sheetOpen ? html`<button type="button" class="scrim" aria-label="Close" @click=${v.goHome}></button>` : nothing}
${v.page === "energy" ? energySheet(v) : nothing}
${v.page === "plants" ? plantsSheet(v) : nothing}
${v.page === "controls" ? homeSheet(v) : nothing}
${v.hasToast ? keyed(this.toastN, html`<div class="toast" role="status">${v.toast}</div>`) : nothing}
</div>`;
  }
}

export type Vals = ReturnType<PikHouseCard["renderVals"]>;

function loadFonts(): void {
  if (document.querySelector('link[data-pik-fonts], link[href*="family=Instrument+Serif"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONTS;
  link.dataset.pikFonts = "";
  document.head.appendChild(link);
}

if (!customElements.get("pik-house-card")) {
  customElements.define("pik-house-card", PikHouseCard);
  const w = window as unknown as { customCards?: Array<Record<string, unknown>> };
  w.customCards = w.customCards || [];
  w.customCards.push({
    type: "pik-house-card",
    name: "Pik House Feed",
    description: "Pik, the kitchen counter house feed (Daylight design).",
    preview: false,
  });
}
