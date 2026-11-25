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
import "./plants/plants-card";
import "./cellar/cellar-card";
import { energySheet, plantsSheet, homeSheet } from "./views";
import { ALL, CAP, GROUPS, INITIAL, PLANT_TOTAL, LABELS, PAUSE, PLAY, QUESTIONS, QUEUE, type FeedCard, type Group, type PikState } from "./mock-data";
import { cellarTotals, condWord, fetchEvents, whenWord, type CalEvent, liveGroups, localStamp, num, parseDesc, parseQuiet, plantTotal, poolTimers, today, writeQuiet, type Hass, type LiveConfig, type TodoItem } from "./live";

const FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";

export interface PikHouseCardConfig extends LiveConfig {
  type: string;
  mock?: boolean;
  /** auto (default): wide on the Chromebook, "mid" on an unfolded phone or tablet, "narrow" on a phone. */
  layout?: "auto" | "wide" | "mid" | "narrow";
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
  private _vs = "";
  private _hideOv?: number;
  // live mode
  private feedItems: TodoItem[] = [];
  private plantItems: TodoItem[] = [];
  private cellarItems: TodoItem[] = [];
  private calEvents: CalEvent[] = [];
  private calAt = 0;
  private calBusy = false;
  private low: number | null = null;
  private unsubs: Array<() => void> = [];
  private subscribing = false;
  private rangSeen = new Set<string>();
  private size: "wide" | "mid" | "narrow" = "wide";
  private onResize = () => this.measure();
  private _ro?: ResizeObserver;

  /** Which layout fits the screen: the fixed 1280×800 kitchen design, or one that flows for a phone. */
  private measure(): void {
    const forced = this.config.layout && this.config.layout !== "auto" ? this.config.layout : null;
    // The room the card actually has (the sidebar and header take some), not just the window.
    const r = this.isConnected ? this.getBoundingClientRect() : null;
    const w = window.innerWidth - (r ? Math.max(0, r.left) : 0);
    const hAvail = window.innerHeight - (r ? Math.max(0, r.top + (window.scrollY || 0)) : 0);
    const next = forced || (w >= 1000 ? "wide" : w >= 600 ? "mid" : "narrow");
    if (next !== this.size) { this.size = next; this.toggleAttribute("flow", next !== "wide"); this.requestUpdate(); }
    // The kitchen design is a fixed 1280×800: shrink it to fit rather than cut it off.
    const z = next === "wide" ? Math.min(1, w / 1280, Math.max(0.6, hAvail / 800)) : 1;
    const zs = z < 0.995 ? z.toFixed(3) : "";
    if ((this.style as unknown as { zoom: string }).zoom !== zs) (this.style as unknown as { zoom: string }).zoom = zs;
  }
  private _ac?: AudioContext;
  private _last?: { count: number; curIdx: number; urgent: boolean };

  // ---- Home Assistant card API ----

  setConfig(config: PikHouseCardConfig): void {
    if (!config) throw new Error("pik-house-card: missing config");
    this.config = config;
    if (this.isConnected) this.measure();
    this.requestUpdate();
  }

  set hass(hass: unknown) {
    const was = this.isMock;
    this._hass = hass;
    if (!this.isMock) { if (!this.unsubs.length && !this.subscribing) this.subscribe(); this.refreshCal(); this.syncVoice(); this.requestUpdate(); }
    else if (was !== this.isMock) this.requestUpdate();
  }

  private get H(): Hass { return this._hass as Hass; }
  private get C(): PikHouseCardConfig { return this.config; }
  private S(id?: string) { return id ? this.H.states[id] : undefined; }

  /** Live: follow the feed list, the plant catalog and the daily forecast. */
  private async subscribe(): Promise<void> {
    const c = this.H && this.H.connection;
    if (!c) return;
    this.subscribing = true;
    const subs: Array<Promise<() => void>> = [];
    if (this.C.feed_list) subs.push(c.subscribeMessage<{ items: TodoItem[] }>((m) => { this.feedItems = m.items || []; this.requestUpdate(); }, { type: "todo/item/subscribe", entity_id: this.C.feed_list }));
    if (this.C.plants_list) subs.push(c.subscribeMessage<{ items: TodoItem[] }>((m) => { this.plantItems = m.items || []; this.requestUpdate(); }, { type: "todo/item/subscribe", entity_id: this.C.plants_list }));
    if (this.C.cellar && this.C.cellar.list) subs.push(c.subscribeMessage<{ items: TodoItem[] }>((m) => { this.cellarItems = m.items || []; this.requestUpdate(); }, { type: "todo/item/subscribe", entity_id: this.C.cellar.list }));
    if (this.C.weather) subs.push(c.subscribeMessage<{ forecast?: Array<{ templow?: number }> }>((m) => { const f = (m.forecast || [])[0]; this.low = f && typeof f.templow === "number" ? Math.round(f.templow) : null; this.requestUpdate(); }, { type: "weather/subscribe_forecast", entity_id: this.C.weather, forecast_type: "daily" }));
    const v = this.C.voice;
    if (v && v.satellite && c.subscribeEvents) subs.push(c.subscribeEvents<{ data: { entity_id?: string; stt_text?: string; tts_text?: string } }>((e) => {
      const d = e.data || {};
      if (!this.V || d.entity_id !== v.satellite) return;
      this.setState({ q: d.stt_text || this.st.q || "", a: d.tts_text || "" });
    }, "voice_satellite_chat"));
    const got = await Promise.allSettled(subs);
    got.forEach((r) => { if (r.status === "fulfilled") this.unsubs.push(r.value); });
    this.subscribing = false;
  }

  /** Live: the shared calendar's next two weeks, refreshed every 10 minutes (and when the calendar first appears). */
  private refreshCal(): void {
    const id = this.C.calendar;
    if (!id || !this.S(id) || this.calBusy || Date.now() - this.calAt < 600000) return;
    this.calBusy = true;
    fetchEvents(this.H, id).then((ev) => { this.calEvents = ev; this.calAt = Date.now(); this.requestUpdate(); })
      .catch(() => { this.calAt = Date.now() - 480000; }).finally(() => { this.calBusy = false; });
  }

  /** Live voice: Pik's face follows the Voice Satellite (listening, thinking, speaking), and the answer stays up a few seconds after. */
  private syncVoice(): void {
    const v = this.V;
    const e = v && this.S(v.satellite);
    if (!e || e.state === this._vs) return;
    const prev = this._vs;
    this._vs = e.state;
    const map: Record<string, Talk> = { listening: "listen", processing: "think", responding: "speak" };
    const t = map[e.state];
    if (t) {
      clearTimeout(this._t3);
      this.setState(t === "listen" && prev !== "responding" ? { talk: t, q: "", a: "" } : { talk: t });
    } else if (this.st.talk) {
      clearTimeout(this._t3);
      if (this.st.talk === "speak" && this.st.a) this._t3 = window.setTimeout(() => this.setState({ talk: null }), 7000);
      else this.setState({ talk: null });
    }
  }

  /** The voice config, only on the screen whose browser is bound to that satellite (so a phone tap never wakes the kitchen). */
  private get V(): { satellite: string; mute?: string } | undefined {
    const v = this.C.voice;
    if (!v || this.isMock) return undefined;
    try { return localStorage.getItem("vs-satellite-entity") === v.satellite ? v : undefined; } catch (_) { return undefined; }
  }

  private get voiceMuted(): boolean {
    const v = this.V;
    const e = v ? this.S(v.satellite) : undefined;
    return e ? !!(e.attributes && (e.attributes as Record<string, unknown>).muted) : !!this.st.muted;
  }

  /** Voice Satellite draws its own full-screen overlay; on this screen Pik's face does that job instead. */
  private hideOverlay(on: boolean): void {
    const el = document.getElementById("voice-satellite-ui");
    if (!el) return;
    if (on && el.style.display !== "none") { el.style.display = "none"; el.dataset.pikHidden = "1"; }
    if (!on && el.dataset.pikHidden) { el.style.display = ""; delete el.dataset.pikHidden; }
  }

  private svc(domain: string, service: string, data: Record<string, unknown> = {}, target?: Record<string, unknown>): void {
    this.H.callService(domain, service, data, target).catch((e: Error) => this.flash("That didn't work: " + e.message));
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
    this.measure();
    window.addEventListener("resize", this.onResize);
    if (typeof ResizeObserver !== "undefined" && this.parentElement) { this._ro = new ResizeObserver(() => this.measure()); this._ro.observe(this.parentElement); }
    window.setTimeout(() => this.measure(), 300);
    this._tick = window.setInterval(() => this.setState({ now: Date.now() }), 30000);
    // When nothing is urgent, Pik moves to the next item every 25 seconds (paused for a minute after you page by hand).
    this._cycle = window.setInterval(() => this.autoAdvance(), 25000);
    this._sec = window.setInterval(() => this.tickTimers(), 1000);
    this._hideOv = window.setInterval(() => { if (this.V) this.hideOverlay(true); }, 400);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.onResize);
    if (this._ro) { this._ro.disconnect(); this._ro = undefined; }
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    clearInterval(this._tick);
    clearInterval(this._cycle);
    clearInterval(this._sec);
    clearInterval(this._hideOv);
    this.hideOverlay(false);
    this._vs = "";
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
    if (!this.isMock) {
      // Kitchen timers come from the shared pool; chime once when one finishes, and keep the countdown moving.
      const pool = poolTimers(this.H, this.C.timers || 12);
      pool.forEach((t) => { const k = t.id + "@" + t.end; if (t.rang && !this.rangSeen.has(k)) { this.rangSeen.add(k); if (Date.now() - t.end < 60000) this.chime(); } });
      if (pool.length) this.setState({ sec: Date.now() });
      return;
    }
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

  /** The plant groups with their current moisture: the demo's, or the real sensors and catalog. */
  private grp(moist: Record<string, number>): Array<Group & { live?: boolean }> {
    if (this.isMock) return GROUPS.map((g) => Object.assign({}, g, { m: moist[g.id], live: true }));
    return liveGroups(this.C, this.H, this.plantItems);
  }

  private quiet(): Record<string, number> { return parseQuiet(this.S(this.C.plants_quiet)?.state); }

  private thirsty(moist: Record<string, number>) {
    const q = this.isMock ? {} : this.quiet(), now = Date.now();
    return this.grp(moist).filter((g) => g.live && g.m < g.thr && !((q[g.id] || 0) > now));
  }

  /** Live: hide groups from the thirsty list for a while (Watered = 12 hours, Snooze = 1 day). */
  private quietGroups(ids: string[], hours: number): void {
    if (!this.C.plants_quiet) return;
    const q = this.quiet(), until = Date.now() + hours * 3600000;
    ids.forEach((id) => { q[id] = until; });
    this.svc("input_text", "set_value", { value: writeQuiet(q) }, { entity_id: this.C.plants_quiet });
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

  /** Live energy from the Powerwall's sensors, or null when they aren't set up (the tile then hides). */
  private liveEnergy(dark: boolean): Energy | null {
    const en = this.C.energy;
    if (!en || !this.S(en.battery_level)) return null;
    const v = (id?: string) => num(this.S(id)) || 0;
    // Home Assistant: battery power > 0 = discharging, grid (site) power > 0 = importing. Here: bat > 0 = charging, grid > 0 = exporting.
    const out = !!en.grid_status && this.S(en.grid_status)?.state === "off";
    const e: Energy = { solar: Math.max(0, v(en.solar_power)), house: Math.max(0, v(en.load_power)), bat: -v(en.battery_power), grid: out ? null : -v(en.grid_power), pct: Math.round(v(en.battery_level)) };
    if (Math.abs(e.solar) > 50 || Math.abs(e.house) > 50) { e.solar /= 1000; e.house /= 1000; e.bat /= 1000; if (e.grid !== null) e.grid /= 1000; } // watts → kW
    e.hours = e.bat < -0.05 ? Math.round((e.pct / 100) * (en.capacity_kwh || CAP) / -e.bat) : null;
    if (out) { e.main = "Power's out. The Powerwall has it."; e.sub = e.hours ? "About " + e.hours + " hours left at this rate" : "Solar is keeping it charged"; }
    else if (e.solar > 0.1 && e.solar >= e.house) { e.main = "The sun is running the house"; e.sub = e.bat > 0.05 ? "Charging the Powerwall" + ((e.grid || 0) > 0.05 ? " · sending the extra to the grid" : "") : (e.grid || 0) > 0.05 ? "Sending the extra to the grid" : "Right on balance"; }
    else if (e.bat < -0.05) { e.main = "The Powerwall is running the house"; e.sub = dark ? "Solar's asleep until morning" : "Solar is topping it up a little"; }
    else { e.main = "The grid is running the house"; e.sub = "The Powerwall is resting at " + e.pct + "%"; }
    return e;
  }

  private navigate(path: string): void {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  private moreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  /** Live feed: the House feed list, plus the plant card and any holiday cooking mode that's on today. */
  private liveEntries(thirsty: Array<Group>, plantCard: () => FeedCard) {
    const out: Array<{ id: string; urgent: boolean; c: FeedCard; onPrimary: () => void; onSecondary: () => void }> = [];
    const d = today();
    (this.C.holiday || []).filter((x) => x.from <= d && d <= x.to).forEach((x) => {
      out.push({ id: "holiday-" + x.path, urgent: false, c: { cat: "reminder", label: "Cooking mode", title: x.name + " cooking mode is on", detail: "Today's tasks, timers and recipes are on the " + x.name + " screen.", primary: "Open it", secondary: "Not now", toast: "" },
        onPrimary: () => this.navigate(x.path), onSecondary: () => { this.flash("Okay. It's in the sidebar when you need it."); } });
    });
    const now = Date.now();
    this.feedItems.filter((it) => it.status === "needs_action" && !(it.due && Date.parse(it.due) > now)).forEach((it) => {
      const j = parseDesc(it.description);
      if (j.expires && Date.parse(j.expires) < now) return;
      const p = j.primary || {}, sec = j.secondary || null;
      const done = () => this.svc("todo", "update_item", { item: it.uid, status: "completed" }, { entity_id: this.C.feed_list });
      const c: FeedCard = { cat: j.category || "home", label: j.label || "", title: it.summary, detail: j.detail || "", primary: p.label || "Got it", secondary: sec && sec.label ? sec.label : undefined, urgent: !!j.urgent, toast: p.toast || "" };
      out.push({ id: it.uid, urgent: !!j.urgent, c,
        onPrimary: () => {
          if (p.script && /^script\.[a-z0-9_]+$/.test(p.script)) this.svc("script", p.script.slice(7));
          if (p.open === "camera" && this.C.doorbell?.camera) this.moreInfo(this.C.doorbell.camera);
          else if (p.open === "energy" || p.open === "plants") this.go(p.open);
          else if (p.open === "home") this.go("controls");
          else if (p.open && p.open.startsWith("/")) this.navigate(p.open);
          else if (p.open && /^https:\/\//.test(p.open)) { window.open(p.open, "_blank", "noopener"); return; } // a live map link: keep the card
          done();
          if (c.toast) this.flash(c.toast);
        },
        onSecondary: () => {
          if (sec && sec.kind === "snooze") { this.svc("todo", "update_item", { item: it.uid, due_datetime: localStamp(now + (sec.minutes || 60) * 60000) }, { entity_id: this.C.feed_list }); this.flash("Okay. I'll bring it back " + ((sec.minutes || 60) >= 1440 ? "tomorrow." : "in " + ((sec.minutes || 60) >= 60 ? Math.round((sec.minutes || 60) / 60) + " hour" + ((sec.minutes || 60) >= 120 ? "s." : ".") : (sec.minutes || 60) + " minutes."))); }
          else { done(); this.flash("Okay, dismissed."); }
        } });
    });
    if (thirsty.length) {
      const c = plantCard();
      out.push({ id: "plants", urgent: false, c, onPrimary: () => { this.quietGroups(thirsty.map((g) => g.id), 12); this.flash(c.toast); }, onSecondary: () => { this.quietGroups(thirsty.map((g) => g.id), 24); this.flash("Snoozed. I'll bring it back tomorrow."); } });
    }
    return out;
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
    if (!this.isMock) {
      const v = this.V;
      if (!v || !this.S(v.satellite)) { this.flash("Pik's voice isn't hooked up on this screen. Say the wake word on the kitchen screen."); return; }
      if (this.voiceMuted) { this.flash("My mic is off. Tap “Mic off” to turn it back on."); return; }
      if (st.talk) return;
      this.svc("voice_satellite", "wake", {}, { entity_id: v.satellite });
      return;
    }
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
    const Lv = !this.isMock;
    const sunSt = Lv ? this.S(this.C.sun) : undefined;
    const dark = Lv && sunSt && !st.mode ? sunSt.state === "below_horizon" : h >= 17 || h < 7;
    const d = new Date(st.now || Date.now());
    const mins = d.getMinutes();
    let clock: string, ampm: string;
    if (st.mode === "day") { clock = "4:32"; ampm = "PM"; }
    else if (st.mode === "night") { clock = "11:42"; ampm = "PM"; }
    else { clock = (h % 12 === 0 ? 12 : h % 12) + ":" + (mins < 10 ? "0" : "") + mins; ampm = h < 12 ? "AM" : "PM"; }
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // plants
    const G = this.grp(s.moist);
    const thirsty = this.thirsty(s.moist);
    const thirstyIds = thirsty.map((g) => g.id);
    const routeOn = thirsty.length >= 2;
    const qmap = this.isMock ? {} : this.quiet();
    const groups = G.map((g) => {
      const m = g.m;
      const resting = (qmap[g.id] || 0) > Date.now();
      const tone = !g.live ? "ok" : m < g.thr && !resting ? "dry" : m >= 55 ? "wet" : "ok";
      const stop = routeOn ? thirstyIds.indexOf(g.id) + 1 : 0;
      const status = !g.live ? "No reading" : tone === "dry" ? "Thirsty" : m < g.thr ? "Just watered" : tone === "wet" ? "Moist" : "Steady";
      return {
        id: g.id,
        cls: "prow " + tone,
        room: g.room,
        sub: g.ind.charAt(0).toUpperCase() + g.ind.slice(1) + " · " + g.plants + " plants",
        m: g.live ? m : 0,
        mTxt: g.live ? m + "%" : "–",
        status,
        fill: "width:" + Math.min(100, (Math.max(0, m) / 70) * 100).toFixed(0) + "%",
        tick: "left:" + ((g.thr / 70) * 100).toFixed(0) + "%",
        hasStop: stop > 0,
        isDry: tone === "dry",
        stop,
        tap: () => {
          if (tone === "dry") {
            if (this.isMock) this.water([g.id]); else this.quietGroups([g.id], 12);
            this.flash("Logged: " + g.room.toLowerCase() + " group watered.");
          } else this.flash(g.room + " is at " + m + "%. No water needed.");
        },
      };
    });
    const plantsNeeded = thirsty.reduce((a, g) => a + g.plants, 0);
    const moistOf = (id: string) => (G.find((g) => g.id === id) || { m: 0 }).m;
    const plantCard = (): FeedCard => {
      const one = thirsty.length === 1;
      return {
        cat: "plant",
        label: "Plants · soil sensors",
        title: one ? (thirsty[0].id === "kitchen" ? "The nerve plant has fainted again" : "The " + thirsty[0].room.toLowerCase() + " group is thirsty") : thirsty.length + " plant groups need water",
        detail: one ? "The " + thirsty[0].ind + " is at " + moistOf(thirsty[0].id) + "%. Water all " + thirsty[0].plants + " plants in the " + thirsty[0].room.toLowerCase() + " group" + (thirsty[0].id === "kitchen" ? ". It perks up within the hour." : ".") : thirsty.map((g) => g.room).join(" → ") + ". " + plantsNeeded + " plants, about " + plantsNeeded + " minutes. Tap Plants for the route.",
        primary: one ? "Watered" : "Watered them all",
        secondary: "Snooze 1 day",
        toast: one ? "Logged: " + thirsty[0].room.toLowerCase() + " group watered." : "Logged: " + thirsty.length + " groups watered.",
      };
    };

    // cards: the demo's, or the live feed
    type Entry = { id: string; urgent: boolean; c: FeedCard; onPrimary: () => void; onSecondary: () => void };
    let entries: Entry[];
    if (this.isMock) {
      entries = s.cards.filter((id) => id !== "plants" || thirsty.length > 0).map((id) => {
        const c = id === "plants" ? plantCard() : ALL[id];
        return {
          id, urgent: !!c.urgent, c,
          onPrimary: () => { if (id === "plants") this.water(thirstyIds); this.resolve(id, c.toast, false, c.fx); },
          onSecondary: () => this.resolve(id, c.secondary === "Snooze 1 day" ? "Snoozed. I'll bring it back tomorrow." : c.secondary === "In an hour" ? "Okay. I'll remind you in an hour." : "Okay, dismissed.", c.secondary === "Snooze 1 day" || c.secondary === "In an hour", null),
        };
      });
    } else entries = this.liveEntries(thirsty, plantCard);
    const byId: Record<string, Entry> = {};
    entries.forEach((e) => { byId[e.id] = e; });
    const isUrg = (id: string) => !!(byId[id] && byId[id].urgent);
    const ids = entries.map((e) => e.id);
    let visibleIds = quiet ? ids.filter(isUrg) : ids;
    // Urgent first.
    visibleIds = visibleIds.filter(isUrg).concat(visibleIds.filter((id) => !isUrg(id)));
    const waiting = ids.length - visibleIds.length;
    const cards = visibleIds.map((id) => {
      const e = byId[id], c = e.c;
      return {
        cat: c.cat,
        urgent: !!c.urgent,
        label: c.label,
        title: c.title,
        detail: c.detail,
        primary: c.primary,
        secondary: c.secondary || "",
        hasSecondary: !!c.secondary,
        onPrimary: e.onPrimary,
        onSecondary: e.onSecondary,
      };
    });
    const count = visibleIds.length;
    const urgent = ids.some(isUrg);

    // live house: weather, heat, lights, watering, Now playing
    const wx = Lv ? this.S(this.C.weather) : undefined;
    const outTemp = Lv ? (wx && wx.attributes.temperature != null ? Math.round(Number(wx.attributes.temperature)) + "°" : "") : (dark ? "31°" : "48°");
    const outLine = Lv ? (wx ? condWord(wx.state) + (this.low !== null ? " · low " + this.low + "°" : "") : "") : (dark ? "Clear" : "Sunny") + " · low 28°";
    const pm = Lv ? num(this.S(this.C.air_pm25)) : null;
    const airShort = Lv ? (pm === null ? "" : pm > 35 ? "air smoky" : "air good") : s.smoky ? "air smoky" : "air good";
    const th = Lv ? this.S(this.C.thermostat) : undefined;
    const thA = th ? th.attributes : {};
    const dual = !!th && th.state === "heat_cool";
    const inside = Lv ? (thA.current_temperature != null ? Math.round(Number(thA.current_temperature)) + "°" : "") : "68°";
    const setRaw = Lv ? (dual ? thA.target_temp_low : thA.temperature) : s.setpoint;
    const setpoint = setRaw != null && setRaw !== "" ? Math.round(Number(setRaw)) : null;
    const act = String(thA.hvac_action || "");
    const heatWord = Lv ? (!th ? "" : th.state === "off" ? "off" : act === "heating" ? "heating" : act === "cooling" ? "cooling" : "holding") : s.setpoint > 68 ? "heating" : "holding";
    const setHeat = (dd: number) => {
      if (!Lv) { this.setState({ setpoint: Math.min(78, Math.max(60, s.setpoint + dd)) }); return; }
      if (setpoint === null || !this.C.thermostat) return;
      const t = setpoint + dd;
      if (dual) this.svc("climate", "set_temperature", { target_temp_low: t, target_temp_high: Math.max(t + 3, Math.round(Number(thA.target_temp_high || t + 4))) }, { entity_id: this.C.thermostat });
      else this.svc("climate", "set_temperature", { temperature: t }, { entity_id: this.C.thermostat });
      this.flash("Set to " + t + "°.");
    };
    const lightList = Lv
      ? (this.C.lights || []).map((l) => {
          const n = l.entities.filter((x) => this.S(x)?.state === "on").length, on = n > 0;
          return { name: l.name, on, n, of: l.entities.length, toggle: () => this.svc("homeassistant", on ? "turn_off" : "turn_on", {}, { entity_id: l.entities }) };
        })
      : ([["living", "Living room"], ["porch", "Porch"], ["kitchen", "Kitchen"]] as const).map((x) => ({ name: x[1] as string, on: s.lights[x[0]], n: s.lights[x[0]] ? 1 : 0, of: 1, toggle: () => { const nl = Object.assign({}, s.lights); nl[x[0]] = !s.lights[x[0]]; this.setState({ lights: nl }); } }));
    const yard = Lv ? this.C.watering?.yard : undefined, garden = Lv ? this.C.watering?.garden : undefined;
    const paused = (z?: { standby: string }) => !!z && this.S(z.standby)?.state === "on";
    const waterWord = Lv ? [yard ? (paused(yard) ? "Yard paused" : "Yard on schedule") : "", garden ? (paused(garden) ? "garden paused" : "garden on") : ""].filter(Boolean).join(" · ") : s.garden ? "Freeze skip · drip on" : "Both paused";
    const mp = Lv ? this.S(this.C.echo?.media_player) : undefined;
    const np: NowPlaying | null = Lv
      ? (mp && (mp.state === "playing" || mp.state === "paused") && mp.attributes.media_title ? { kind: "music", title: String(mp.attributes.media_title), sub: String(mp.attributes.app_name || mp.attributes.media_artist || ""), playing: mp.state === "playing" } : null)
      : s.np;
    const mpCall = (svc: string) => { if (this.C.echo?.media_player) this.svc("media_player", svc, {}, { entity_id: this.C.echo.media_player }); };

    // energy
    const eLive = Lv ? this.liveEnergy(dark) : null;
    const hasEnergy = !Lv || !!eLive;
    const outNow = Lv ? !!eLive && eLive.grid === null : s.outage;
    const e = eLive || this.energy(s, dark);
    const batH = (e.pct * 0.34).toFixed(1);
    const gridFlow = e.grid === null ? "flow w-grid" : e.grid > 0 ? "flow w-grid on rev" : e.grid < 0 ? "flow w-grid on" : "flow w-grid";

    // cellar and out & about (live only, when configured)
    const cel = Lv && this.C.cellar ? cellarTotals(this.cellarItems) : null;
    const liveFeed = Lv ? this.feedItems.filter((it) => it.status === "needs_action").map((it) => ({ it, j: parseDesc(it.description) })) : [];
    const dlv = liveFeed.find((x) => (x.j.id || "").startsWith("delivery-"));
    const lots = Lv && this.C.airport ? this.C.airport.lots.map((l) => ({ name: l.name, short: l.short, n: num(this.S(l.entity)) })).filter((l) => l.n !== null) as Array<{ name: string; short?: string; n: number }> : [];
    const nowMs = Date.now();
    const upcoming = Lv ? this.calEvents.filter((ev) => Date.parse(ev.end || ev.start) > nowMs) : [];
    const flight = upcoming.find((ev) => /\bflight\b/i.test(ev.summary) && /T/.test(ev.start) && Date.parse(ev.start) - nowMs < 864e5);
    const calOn = Lv && !!this.C.calendar && !!this.S(this.C.calendar);
    const best = lots.find((l) => l.n > 0);
    const out = dlv
      ? (() => {
          const what = dlv.it.summary.replace(/^[^:]*:\s*/, ""), app = (dlv.j.label || "Delivery").split(" · ")[0];
          const eta = what.match(/arriving\s+(.+)/i), done = /delivered/i.test(what);
          const map = dlv.j.primary && dlv.j.primary.open && /^https:\/\//.test(dlv.j.primary.open) ? dlv.j.primary.open : "";
          return { eb: app + (done ? "" : " · on the way"), big: done ? "Here" : eta ? eta[1] : "On its way", small: done ? "delivered" : "", line: (map ? "Tap for the live map · " : "") + (dlv.j.detail || what), map };
        })()
      : lots.length
        ? { eb: (this.C.airport?.name || "RNO") + (flight ? " · flight " + new Date(flight.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : " parking"), big: best ? String(best.n) : "Full", small: best ? best.short || best.name : "every lot", line: lots.filter((l) => l !== best).map((l) => (l.short || l.name) + " " + (l.n > 0 ? l.n : "full")).join(" · "), map: "" }
        : null;
    const nPebs = (np ? 1 : 0) + (hasEnergy ? 1 : 0) + 3 + (cel ? 1 : 0) + (out ? 1 : 0);

    // pik
    // nowMs: set above
    const tlist = Lv ? poolTimers(this.H, this.C.timers || 12).slice(0, 3) : st.timers || [];
    const timerDone = tlist.some((x) => x.end <= nowMs);
    const muted = this.voiceMuted;
    const pik: PikState = st.talk || (urgent || timerDone ? "alert" : muted ? "muted" : "rest");

    const page = st.page || "home";
    // Count single lights (a room tile can hold several).
    const nOn = lightList.reduce((a, l) => a + l.n, 0);
    const nLights = lightList.reduce((a, l) => a + l.of, 0);
    const stops = thirsty.map((g, i) => ({ n: i + 1, room: g.room, plants: g.plants }));

    const anyUrg = visibleIds.some(isUrg);
    const focusOk = !!st.focus && visibleIds.indexOf(st.focus) >= 0 && (!anyUrg || isUrg(st.focus));
    const curIdx = focusOk ? visibleIds.indexOf(st.focus!) : anyUrg ? 0 : Math.min(st.idx || 0, Math.max(0, count - 1));
    this._last = { count, curIdx, urgent: anyUrg };
    const curCard = cards[curIdx] || { cat: "", label: "", title: "", detail: "", primary: "", secondary: "", hasSecondary: false, urgent: false, onPrimary: () => {}, onSecondary: () => {} };
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
      showMic: !Lv || !!(this.V && this.S(this.V.satellite)),
      micCls: muted ? "mic off" : "mic",
      micPressed: muted ? "true" : "false",
      micLabel: muted ? "Mic off" : "Mic on",
      micSlash: muted ? "M3 3l18 18" : "",
      toggleMic: () => {
        const v = this.V;
        if (Lv && v && this.S(v.satellite)) { this.svc("switch", muted ? "turn_off" : "turn_on", {}, { entity_id: v.mute || v.satellite.replace("assist_satellite.", "switch.") + "_mute" }); return; }
        this.clearTalk(); this.setState({ muted: !st.muted, talk: null });
      },
      clock,
      ampm,
      dayName: days[d.getDay()],
      monthDay: months[d.getMonth()] + " " + d.getDate(),
      outTemp,
      outLine,
      airShort,
      inside,
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
          left: done ? "Done" : secs >= 3600 ? Math.floor(secs / 3600) + ":" + ("0" + Math.floor((secs % 3600) / 60)).slice(-2) + ":" + ("0" + (secs % 60)).slice(-2) : Math.floor(secs / 60) + ":" + ("0" + (secs % 60)).slice(-2),
          label: x.label,
          dash: "stroke-dashoffset:" + (163.4 * (1 - left / x.total)).toFixed(1),
          btn: done ? "Stop" : "×",
          aria: done ? "Stop the " + x.label + " timer" : "Cancel the " + x.label + " timer",
          stop: () => { if (Lv) this.svc("script", "kitchen_timer_stop", { slot: x.id }); else this.stopTimer(x.id); if (!done) this.flash(x.label + " timer canceled."); },
        };
      }),

      // pebbles
      pebsCls: nPebs >= 6 ? "pebs five six" : nPebs >= 5 ? "pebs five" : "pebs",
      cel,
      showUpc: Lv,
      upcOn: calOn,
      upc: upcoming.slice(0, 2).map((ev) => ({ when: whenWord(ev.start, nowMs), what: ev.summary, where: (ev.location || "").split(",")[0] })),
      celBig: cel ? String(cel.bottles) : "",
      celLine: cel ? (cel.bottles ? "Worth about $" + Math.round(cel.value).toLocaleString() : "Send Pik a bottle photo") : "",
      openCellar: () => this.navigate((this.C.cellar && this.C.cellar.path) || "/dashboard-cellar/cellar"),
      out,
      np,
      npTitle: np ? np.title : "",
      npSub: np ? (np.playing ? "" : "Paused · ") + "Echo Show" + (np.sub ? " · " + np.sub : "") : "",
      eqCls: np && np.playing ? "eq on" : "eq",
      npIcon: np && np.playing ? PAUSE : PLAY,
      npToggleLbl: np && np.playing ? "Pause" : "Play",
      npToggle: () => { if (Lv) { mpCall("media_play_pause"); return; } if (s.np) this.setState({ np: Object.assign({}, s.np, { playing: !s.np.playing }) }); },
      volDown: () => { if (Lv) { mpCall("volume_down"); return; } const v = Math.max(1, (st.vol || 5) - 1); this.setState({ vol: v }); this.flash("Echo volume " + v); },
      volUp: () => { if (Lv) { mpCall("volume_up"); return; } const v = Math.min(10, (st.vol || 5) + 1); this.setState({ vol: v }); this.flash("Echo volume " + v); },
      npStop: () => { if (Lv) { mpCall("media_stop"); this.flash("Stopped the Echo Show."); return; } this.setState({ np: null }); this.flash("Stopped the Echo Show."); },
      hasEnergy,
      pebEnCls: "peb" + (outNow ? " out" : ""),
      modeTxt: outNow ? "Grid outage" : dark ? "After dark" : "Solar day",
      bfillCls: "bfill" + (e.bat > 0 ? " chg" : e.bat < 0 ? " dis" : "") + (outNow ? " out" : ""),
      bfillStyle: "width:" + e.pct + "%",
      pebEnLine: Lv ? (outNow ? "Grid's down · tap for details" : e.main || "") : outNow ? "Grid's down · tap for details" : dark ? "The battery is running the house" : "Charging from the sun",
      pebPlCls: "pv" + (thirsty.length ? " dry" : ""),
      plBig: thirsty.length ? String(thirsty.length) : String(Lv ? plantTotal(this.plantItems) : PLANT_TOTAL),
      plBigSub: thirsty.length ? (thirsty.length === 1 ? "group thirsty" : "groups thirsty") : "plants happy",
      gdots: groups.map((g) => (g.isDry ? "dry" : g.cls.endsWith("wet") ? "wet" : "")),
      groupCount: G.length,
      plShort: thirsty.length ? thirsty.map((g) => g.room).join(" → ") : "Everyone's had a drink",
      setpoint: setpoint === null ? "–" : String(setpoint),
      heatWord,
      insideLine: inside ? "It's " + inside + " inside" : "",
      nOn,
      nLights,
      lightsCls: lightList.length > 4 ? "lights many" : "lights",
      waterWord,

      // sheets
      page,
      sheetOpen: page !== "home",
      goHome: page_("home"),
      openEnergy: page_("energy"),
      openPlants: page_("plants"),
      openControls: page_("controls"),

      // energy sheet
      e,
      ewinCls: "ewin" + (outNow ? " out" : ""),
      energyAria: e.main + ". " + e.sub + ".",
      solarFlow: e.solar > 0 ? "flow w-sun on" : "flow w-sun",
      gridFlow,
      batFlow: e.bat < 0 ? "flow w-bat on" : e.bat > 0 ? "flow w-bat on rev" : "flow w-bat",
      solarLbl: dark ? "SOLAR · ASLEEP" : "SOLAR",
      solarVal: kw(e.solar),
      houseVal: kw(e.house),
      gridLbl: outNow ? "GRID · DOWN" : (e.grid || 0) > 0 ? "GRID · EXPORT" : (e.grid || 0) < 0 ? "GRID · IMPORT" : "GRID · IDLE",
      gridVal: outNow ? "Offline" : kw(e.grid),
      batStyle: "height:" + batH + "px;y:" + (17 - Number(batH)).toFixed(1) + "px",
      batVal: e.pct + "% · " + (e.bat > 0 ? "+" : "−") + kw(e.bat),
      gridStat: outNow ? "Down" : (e.grid || 0) > 0 ? "Sending " + kw(e.grid) : (e.grid || 0) < 0 ? "Using " + kw(e.grid) : "Idle",
      showEssentials: outNow && !s.essentials,
      essentialsOn: () => { this.applyFx("essentials"); this.setState({ cards: this.cur().cards.filter((x) => x !== "outage") }); this.flash("Essentials only. That roughly doubles the time left."); },

      // plants sheet
      groups,
      plantsEb: "Plants · " + (Lv ? plantTotal(this.plantItems) : PLANT_TOTAL) + " in " + G.length + " groups",
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
      down: () => setHeat(-1),
      up: () => setHeat(1),
      thermoSub: (heatWord ? heatWord.charAt(0).toUpperCase() + heatWord.slice(1) : "") + (inside ? " · it's " + inside + " inside" : ""),
      lightsEb: Lv ? "Lights" : "Lights · Wemo + Leviton",
      lights: lightList.map((l) => ({
        name: l.name,
        cls: l.on ? "lp on" : "lp",
        state: !l.on ? "Off" : l.of > 1 && l.n < l.of ? l.n + " of " + l.of + " on" : "On",
        pressed: l.on ? "true" : "false",
        toggle: l.toggle,
      })),
      // watering: the demo's yard and garden, or the real Rachio (and B-Hyve once it's connected)
      hasYard: !Lv || !!yard,
      yardName: Lv ? "Yard · " + (yard?.name || "Rachio") : "Yard · Rachio",
      yardTxt: Lv ? (paused(yard) ? "On standby · not watering" : "Running its schedule") : "Skipping while it's freezing",
      hasYardBtn: Lv && !!yard,
      yardBtn: paused(yard) ? "Resume" : "Pause",
      toggleYard: () => { if (!yard) return; const p = paused(yard); this.svc("switch", p ? "turn_off" : "turn_on", {}, { entity_id: yard.standby }); this.flash(p ? "The yard sprinklers are back on their schedule." : "The yard sprinklers are on standby."); },
      hasGarden: !Lv || !!garden,
      gardenName: Lv ? "Garden · " + (garden?.name || "B-Hyve") : "Garden · B-Hyve",
      gardenTxt: Lv ? (paused(garden) ? "Paused" : "Running its schedule") : s.garden ? "Drip runs on its schedule" : "Paused until March 1",
      gardenBtn: Lv ? (paused(garden) ? "Resume" : "Pause") : s.garden ? "Pause until March" : "Resume",
      toggleGarden: () => {
        if (Lv) { if (!garden) return; const p = paused(garden); this.svc("switch", p ? "turn_off" : "turn_on", {}, { entity_id: garden.standby }); this.flash(p ? "The garden is back on its schedule." : "The garden watering is paused."); return; }
        this.setState({ garden: !s.garden }); this.flash(s.garden ? "The garden drip is paused until March 1." : "The garden drip is back on schedule.");
      },
      hasCamera: !Lv || !!this.C.doorbell?.camera,
      camLabel: Lv ? (this.C.doorbell?.name || "Ring") + " live view" : "Ring live view",
      camera: () => { if (Lv && this.C.doorbell?.camera) this.moreInfo(this.C.doorbell.camera); else this.flash("Opening the front door camera."); },

      hasToast: !!st.toast,
      toast: st.toast || "",
    };
  }

  // ---- render ----

  render() {
    const v = this.renderVals();
    const cur = v.cur;
    return html`<div class="app ${v.appCls} ${v.themeCls}${this.size === "wide" ? "" : " flow " + this.size}">
<header class="top">
<div class="clock">${v.clock}<span>${v.ampm}</span></div>
<div class="date">${v.dayName}<br>${v.monthDay}</div>
<div class="sep"></div>
${v.outTemp ? html`<div class="wx"><b>${v.outTemp}</b>${v.outLine}${v.airShort ? html` · <span class=${v.airCls2}>${v.airShort}</span>` : nothing}</div>
<div class="sep"></div>` : nothing}
${v.inside ? html`<div class="wx"><b>${v.inside}</b>inside</div>` : nothing}
${v.showUpc ? html`<div class=${"upc" + (v.upcOn ? "" : " ph")}>
<span class="eb">Coming up</span>
${!v.upcOn ? html`<span class="ul">Plans you send Pik show here once the shared calendar is connected.</span>`
  : v.upc.length ? v.upc.map((u) => html`<span class="ul"><b>${u.when}</b> ${u.what}${u.where ? html`<i> · ${u.where}</i>` : nothing}</span>`)
  : html`<span class="ul">Nothing on the calendar this week.</span>`}
</div>` : nothing}
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
<div class="pikname"><b>Pik</b><span class=${v.pillCls}>${v.pikLabel}</span>${v.showMic ? html`<button type="button" class=${v.micCls} aria-pressed=${v.micPressed} aria-label=${v.micLabel} @click=${v.toggleMic}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3"></path><path d=${v.micSlash}></path></svg></button>` : nothing}</div>
${v.timers.length ? html`<div class="timers">${repeat(v.timers, (tm) => tm.id, (tm) => html`<div class=${tm.cls}><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle class="tr-bg" cx="32" cy="32" r="26"></circle><circle class="tr-fg" cx="32" cy="32" r="26" style=${tm.dash}></circle></svg><div class="tt"><b>${tm.left}</b><span>${tm.label}</span></div><button type="button" class="tx" aria-label=${tm.aria} @click=${tm.stop}>${tm.btn}</button></div>`)}</div>` : nothing}
</div>
<div class=${v.bubbleCls} aria-live="polite">
${v.showTalk ? html`<div class="btop"><span class="eb">You asked</span></div>
<p class="q">“${v.q}”</p>
<p class=${"ans " + (v.a.length > 260 ? "s4" : v.a.length > 170 ? "s3" : v.a.length > 100 ? "s2" : "s1")}>${v.a}</p>` : nothing}
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
${v.hasEnergy ? html`<button type="button" class=${v.pebEnCls} @click=${v.openEnergy}>
<span class="eb">Energy · ${v.modeTxt}</span>
<span class="pv">${v.e.pct}%<small>Powerwall</small></span>
<span class="bbar"><span class=${v.bfillCls} style=${v.bfillStyle}></span></span>
<span class="ps">${v.pebEnLine}</span>
</button>` : nothing}
<button type="button" class="peb" @click=${v.openPlants}>
<span class="eb">Plants · ${v.groupCount} groups</span>
<span class=${v.pebPlCls}>${v.plBig}<small>${v.plBigSub}</small></span>
<span class="gd">${v.gdots.map((c) => html`<i class=${c}></i>`)}</span>
<span class="ps">${v.plShort}</span>
</button>
${v.cel ? html`<button type="button" class="peb" @click=${v.openCellar}>
<span class="eb">Cellar</span>
<span class="pv">${v.celBig}<small>${v.celBig === "1" ? "bottle" : "bottles"}</small></span>
<span class="ps">${v.celLine}</span>
</button>` : nothing}
${v.out ? html`<button type="button" class=${"peb outab" + (v.out.map ? " map" : "")} @click=${() => { if (v.out && v.out.map) window.open(v.out.map, "_blank", "noopener"); }}>
<span class="eb">${v.out.eb}</span>
<span class="pv">${v.out.big}<small>${v.out.small}</small></span>
<span class="ps">${v.out.line}</span>
</button>` : nothing}
<button type="button" class="peb" @click=${v.openControls}>
<span class="eb">Heat · Ecobee</span>
<span class="pv">${v.setpoint}°<small>${v.heatWord}</small></span>
<span class="ps">${v.insideLine}</span>
</button>
<button type="button" class="peb" @click=${v.openControls}>
<span class="eb">Lights &amp; watering</span>
<span class="pv">${v.nOn}<small>of ${v.nLights} lights on</small></span>
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
