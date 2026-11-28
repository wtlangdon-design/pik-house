// The Pik House system screen (custom:pik-home-card): the kitchen screen redesign.
//
// Three layers, and Pik decides which one is on screen:
//   Home      the everyday screen: the two of you, today together, what your Piks sent, and the house
//   Ambient   full-screen stories when nobody has touched the screen for a couple of minutes
//   Moments   time to go, the doorbell, a finished timer, a storm, a cooking step: they take over, then step aside
//
// It adapts. Every tap, open, dismissal and skip goes to Home Assistant as a pik_screen event; the
// sensor in ha/packages/pik_screen.yaml keeps a fading score per topic (and per part of the day) and the
// card ranks stories and house tiles with it. Rules you tell Pik ("less wine in the morning") live in
// todo.pik_screen_rules and win over the learning. Moments are never learned away.
import { LitElement, html, nothing, svg, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { homeStyles } from "./home-styles";
import { batteryGauge, energyChart, groupRing, niche, plantIcon, type DayHist, type Pt, type Wine } from "./art";
import { pikStyles } from "../styles";
import { pikArt } from "../pik-art";
import { condWord, fetchEvents, liveGroups, num, parseDesc, parseQuiet, poolTimers, whenWord, type CalEvent, type Hass, type HState, type LiveConfig, type PoolTimer, type TodoItem } from "../live";

const FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap";

interface Person { key: string; name: string; person: string; color: string }
export interface PikHomeConfig extends LiveConfig {
  type: string;
  people?: Person[];
  learning?: string;      // sensor.pik_screen_learning
  rules?: string;         // todo.pik_screen_rules
  headline?: string;      // input_text.pik_headline
  leave?: string;         // input_text.pik_leave_moment
  leaving_script?: string;
  storm?: { alert: string; ends?: string; watch?: string };
  ring?: { ding: string; camera: string; name?: string; light?: string };
  smoke?: { active: string; probes: string[]; path?: string };
  cooking?: { script: string; done_script?: string };
  plants_path?: string;
  sky?: string;
  music_device?: string;  // the Echo's device id, for "play …" quick picks (alexa_devices.send_text_command)
  music_picks?: Array<{ label: string; say: string }>;          // a weather entity with cloud_coverage (the energy scene's clouds)
  energy_today?: { solar?: string; usage?: string; imported?: string; exported?: string };
  ambient_after?: number; // seconds untouched before the stories start (default 120)
  story_seconds?: number; // each story's time on screen (default 12)
  quiet_hours?: [number, number]; // night clock between these hours (default 23 → 7)
  hikes?: { list: string };       // todo.weekend_hikes: the two trails for this weekend (ha/packages/pik_hikes.yaml)
}

type Topic = "calendar" | "piks" | "energy" | "plants" | "cellar" | "weather" | "inside" | "music" | "doorbell" | "deliveries" | "smoker" | "timers" | "cooking" | "hikes";
type Part = "morning" | "midday" | "evening" | "night";
type Talk = "listen" | "think" | "speak";
interface Rule { uid: string; words: string; topic: string; effect: string; when: string; until: string; state: string; why?: string; by?: string }
interface Energy { solar: number; house: number; bat: number; grid: number | null; pct: number; hours: number | null; main: string; sub: string; out: boolean }
interface FeedRow { uid: string; title: string; label: string; detail: string; urgent: boolean; who: string; at: number; cat: string; topic: Topic; primary: () => void; secondary: () => void; secLabel: string }
interface TodayRow { key: string; t: string; tsub?: string; color: string; what: string; note: string; past?: boolean; tap?: () => void }
interface Moment { key: string; kind: "timer" | "doorbell" | "leave" | "storm" | "cooking"; topic: Topic; body: () => TemplateResult }
interface Hike { name: string; kind: string; miles: number; gain: number; drive: number; why: string; url: string; forecast: string; until: number }
interface Story { id: string; topic: Topic; score: number; render: () => TemplateResult; theme: string }

const CAT_TOPIC: Record<string, Topic> = { plant: "plants", water: "plants", weather: "weather", air: "weather", bill: "calendar", reminder: "calendar", home: "inside", light: "inside", package: "deliveries", energy: "energy", door: "doorbell" };
const TOPIC_NAME: Record<string, string> = { calendar: "Plans", piks: "Your Piks", energy: "Energy", plants: "Plants", cellar: "Wine", weather: "Weather", inside: "Heat & lights", music: "Music", doorbell: "Doorbell", deliveries: "Deliveries", smoker: "Smoker", timers: "Timers", cooking: "Cooking", hikes: "Hikes" };
const WHITE = /(chardonnay|riesling|sauvignon blanc|pinot gris|pinot grigio|albari|blanc|white|champagne|prosecco|cava|sparkling|viognier|chenin|gr[üu]ner|vermentino|moscato)/i;
const ROSE = /(ros[ée]|blush)/i;

const p2 = (x: number) => String(x).padStart(2, "0");
function hm(d: Date): string { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, ""); }
function hmA(d: Date): string { return d.toLocaleTimeString([], { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined }); }
function partOf(h: number): Part { return h >= 5 && h < 11 ? "morning" : h >= 11 && h < 16 ? "midday" : h >= 16 && h < 21 ? "evening" : "night"; }
function ago(ms: number): string {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = new Date(ms);
  return d.toLocaleDateString([], { weekday: "long" });
}
function forWho(e: CalEvent): string {
  const m = /^\s*For:\s*(Tyler|Charlie|Both)/im.exec(e.description || "");
  return m ? m[1].toLowerCase() : "both";
}
function fromWho(e: CalEvent): string {
  const m = /from\s+(Tyler|Charlie)/i.exec((e.description || "").split("\n")[0]);
  return m ? m[1] : "";
}
const startMs = (e: CalEvent) => (/T/.test(e.start) ? Date.parse(e.start) : new Date(e.start + "T00:00:00").getTime());
const endMs = (e: CalEvent) => (/T/.test(e.end) ? Date.parse(e.end) : new Date(e.end + "T00:00:00").getTime());

/** Layered ridgelines behind the hikes tile and story. */
function ridge(big = false): TemplateResult {
  return html`<svg class=${"ridge" + (big ? " big" : "")} viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
<path d="M0 70 L40 52 L70 62 L110 34 L150 58 L190 40 L230 60 L270 30 L310 55 L350 44 L400 60 L400 120 L0 120Z" fill="rgba(255,255,255,.10)"></path>
<path d="M0 88 L50 70 L90 82 L140 60 L180 80 L230 66 L280 84 L330 64 L370 78 L400 72 L400 120 L0 120Z" fill="rgba(0,0,0,.16)"></path>
<path d="M0 104 L60 92 L120 100 L170 88 L230 102 L290 90 L350 100 L400 94 L400 120 L0 120Z" fill="rgba(0,0,0,.24)"></path></svg>`;
}

export class PikHomeCard extends LitElement {
  static styles = [homeStyles, pikStyles];

  private config: PikHomeConfig = { type: "custom:pik-home-card" };
  private _hass: unknown = undefined;

  // live data
  private feedItems: TodoItem[] = [];
  private plantItems: TodoItem[] = [];
  private cellarItems: TodoItem[] = [];
  private ruleItems: TodoItem[] = [];
  private hikeItems: TodoItem[] = [];
  private calEvents: CalEvent[] = [];
  private calAt = 0;
  private calBusy = false;
  private hi: number | null = null;
  private low: number | null = null;
  private cook: Record<string, unknown> | null = null;
  private cookAt = 0;
  private hist: DayHist | null = null;
  private histAt = 0;
  private unsubs: Array<() => void> = [];
  private subscribing = false;

  // what's on screen
  private now = Date.now();
  private touched = Date.now();
  private layer: "home" | "ambient" = "home";
  private storyIdx = 0;
  private storyAt = Date.now();
  private sheet: "" | "energy" | "notes" | "lights" = "";
  private lightsRoom = "";
  private snoozed: Record<string, number> = (() => { try { const j = JSON.parse(localStorage.getItem("pik-home-snoozed") || "{}"); const now = Date.now(); return Object.fromEntries(Object.entries(j).filter(([, v]) => typeof v === "number" && v > now)) as Record<string, number>; } catch (_) { return {}; } })();
  private toast = "";
  private _toastT?: number;
  private _tick?: number;
  private _hideOv?: number;

  // voice
  private talk: Talk | null = null;
  private q = "";
  private a = "";
  private capIdx = 0;
  private _vs = "";
  private _cap?: number;
  private _t3?: number;

  private onResize = () => this.measure();
  private _ro?: ResizeObserver;

  setConfig(config: PikHomeConfig): void {
    if (!config) throw new Error("pik-home-card: missing config");
    this.config = config;
    this.requestUpdate();
  }
  set hass(h: unknown) {
    this._hass = h;
    if (!h) return;
    if (!this.unsubs.length && !this.subscribing) this.subscribe();
    this.refreshCal();
    this.refreshCook();
    this.syncVoice();
    this.requestUpdate();
  }
  get hass(): unknown { return this._hass; }
  getCardSize(): number { return 16; }
  static getStubConfig(): PikHomeConfig { return { type: "custom:pik-home-card" }; }

  private get H(): Hass { return this._hass as Hass; }
  private get C(): PikHomeConfig { return this.config; }
  private S(id?: string): HState | undefined { return id && this.H ? this.H.states[id] : undefined; }

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts();
    this.measure();
    window.addEventListener("resize", this.onResize);
    if (typeof ResizeObserver !== "undefined" && this.parentElement) { this._ro = new ResizeObserver(() => this.measure()); this._ro.observe(this.parentElement); }
    window.setTimeout(() => this.measure(), 300);
    this._tick = window.setInterval(() => this.tick(), 1000);
    this._hideOv = window.setInterval(() => { if (this.V) this.hideOverlay(true); }, 400);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.onResize);
    if (this._ro) { this._ro.disconnect(); this._ro = undefined; }
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    clearInterval(this._tick);
    clearInterval(this._hideOv);
    clearTimeout(this._cap);
    clearTimeout(this._t3);
    clearTimeout(this._toastT);
    this.hideOverlay(false);
    this._vs = "";
  }

  /** The design is 1280×800 at heart. On any other screen it scales to fit (up as well as down), and the
   *  extra room on the long side goes to the layout itself, so a 1920×1080 kitchen screen is filled edge to edge
   *  instead of showing a 1280×800 box. On a phone (narrow), the House card's phone layout takes over. */
  private narrow = false;
  private measure(): void {
    const r = this.isConnected ? this.getBoundingClientRect() : null;
    const w = window.innerWidth - (r ? Math.max(0, r.left) : 0);
    const h = window.innerHeight - (r ? Math.max(0, r.top + (window.scrollY || 0)) : 0);
    const narrow = w < 900;
    if (narrow !== this.narrow) { this.narrow = narrow; this.requestUpdate(); }
    const z = narrow ? 1 : Math.min(2, w / 1280, Math.max(0.5, h / 800));
    const zs = Math.abs(z - 1) < 0.005 ? "" : z.toFixed(3);
    const st = this.style as unknown as { zoom: string };
    if (st.zoom !== zs) st.zoom = zs;
    // the room left over once scaled, in design pixels: never smaller than the design itself
    const lw = narrow ? 1280 : Math.max(1280, Math.floor(w / z));
    const lh = narrow ? 800 : Math.max(800, Math.floor(h / z));
    const pw = lw + "px", ph = lh + "px";
    if (this.style.getPropertyValue("--pw") !== pw) this.style.setProperty("--pw", pw);
    if (this.style.getPropertyValue("--ph") !== ph) this.style.setProperty("--ph", ph);
  }

  // ---------------- data ----------------

  private async subscribe(): Promise<void> {
    const c = this.H && this.H.connection;
    if (!c) return;
    this.subscribing = true;
    const subs: Array<Promise<() => void>> = [];
    const todo = (id: string | undefined, set: (items: TodoItem[]) => void) => {
      if (id) subs.push(c.subscribeMessage<{ items: TodoItem[] }>((m) => { set(m.items || []); this.requestUpdate(); }, { type: "todo/item/subscribe", entity_id: id }));
    };
    todo(this.C.feed_list, (i) => { this.feedItems = i; });
    todo(this.C.plants_list, (i) => { this.plantItems = i; });
    todo(this.C.cellar && this.C.cellar.list, (i) => { this.cellarItems = i; });
    todo(this.C.rules, (i) => { this.ruleItems = i; });
    todo(this.C.hikes && this.C.hikes.list, (i) => { this.hikeItems = i; });
    if (this.C.weather) subs.push(c.subscribeMessage<{ forecast?: Array<{ temperature?: number; templow?: number }> }>((m) => {
      const f = (m.forecast || [])[0];
      this.hi = f && typeof f.temperature === "number" ? Math.round(f.temperature) : null;
      this.low = f && typeof f.templow === "number" ? Math.round(f.templow) : null;
      this.requestUpdate();
    }, { type: "weather/subscribe_forecast", entity_id: this.C.weather, forecast_type: "daily" }));
    const v = this.C.voice;
    if (v && v.satellite && c.subscribeEvents) subs.push(c.subscribeEvents<{ data: { entity_id?: string; stt_text?: string; tts_text?: string } }>((e) => {
      const d = e.data || {};
      if (!this.V || d.entity_id !== v.satellite) return;
      this.q = d.stt_text || this.q || "";
      this.a = d.tts_text || "";
      this.capIdx = 0;
      if (this.talk === "speak") this.startCaps();
      this.requestUpdate();
    }, "voice_satellite_chat"));
    const got = await Promise.allSettled(subs);
    got.forEach((r) => { if (r.status === "fulfilled") this.unsubs.push(r.value); });
    this.subscribing = false;
  }

  private refreshCal(): void {
    const id = this.C.calendar;
    if (!id || !this.S(id) || this.calBusy || Date.now() - this.calAt < 300000) return;
    this.calBusy = true;
    fetchEvents(this.H, id, 3).then((ev) => { this.calEvents = ev; this.calAt = Date.now(); this.requestUpdate(); })
      .catch(() => { this.calAt = Date.now() - 240000; }).finally(() => { this.calBusy = false; });
  }

  /** Holiday cooking mode: what's due, from the plan's own script, once a minute while a holiday is on. */
  /** Today's solar, house and Powerwall history for the energy chart, every 5 minutes. */
  private refreshHist(): void {
    const en = this.C.energy;
    if (!en || !this.H.callWS || Date.now() - this.histAt < 300000) return;
    this.histAt = Date.now();
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const t0 = d0.getTime();
    const ids = [en.solar_power, en.load_power, en.battery_level].filter(Boolean) as string[];
    // from yesterday's midnight: today draws bright, yesterday's sun is the faint ghost behind it
    this.H.callWS<Record<string, Array<{ s: string; lu: number }>>>({ type: "history/history_during_period", start_time: new Date(t0 - 864e5).toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false })
      .then((r) => {
        const pts = (id?: string): Pt[] => ((id && r[id]) || []).map((x) => [x.lu * 1000, parseFloat(x.s)] as Pt).filter((p) => isFinite(p[1]));
        const kw = (l: Pt[]) => (l.some((p) => Math.abs(p[1]) > 50) ? l.map((p) => [p[0], p[1] / 1000] as Pt) : l);
        const pos = (l: Pt[]) => l.map((p) => [p[0], Math.max(0, p[1])] as Pt);
        /** Today's points, starting from the last value before midnight. */
        const today = (l: Pt[]): Pt[] => { const before = l.filter((p) => p[0] < t0); const after = l.filter((p) => p[0] >= t0); return before.length ? ([[t0, before[before.length - 1][1]]] as Pt[]).concat(after) : after; };
        const sol = pos(kw(pts(en.solar_power)));
        this.hist = { solar: today(sol), load: today(pos(kw(pts(en.load_power)))), pct: today(pts(en.battery_level)), ysolar: sol.filter((p) => p[0] < t0).map((p) => [p[0] + 864e5, p[1]] as Pt) };
        this.requestUpdate();
      })
      .catch(() => { this.histAt = Date.now() - 240000; });
  }

  private refreshCook(): void {
    const ck = this.C.cooking;
    if (!ck || !this.holiday() || !this.H.callWS || Date.now() - this.cookAt < 60000) return;
    this.cookAt = Date.now();
    const [dom, svcName] = ck.script.split(".");
    this.H.callWS<{ response?: Record<string, unknown> }>({ type: "call_service", domain: dom, service: svcName, return_response: true })
      .then((r) => { const x = (r && r.response) || null; this.cook = x && typeof x.result === "object" ? (x.result as Record<string, unknown>) : x; this.requestUpdate(); })
      .catch(() => { this.cook = null; });
  }

  private holiday(): { name: string; path: string } | null {
    const d = new Date(), t = d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
    return (this.C.holiday || []).find((x) => x.from <= t && t <= x.to) || null;
  }

  // ---------------- learning ----------------

  private get dayPart(): Part { return partOf(new Date(this.now).getHours()); }

  private rules(): Rule[] {
    const out: Rule[] = [];
    this.ruleItems.filter((i) => i.status === "needs_action").forEach((i) => {
      const j = parseDesc(i.description) as Record<string, unknown>;
      out.push({ uid: i.uid, words: i.summary, topic: String(j.topic || ""), effect: String(j.effect || ""), when: String(j.when || "any"), until: String(j.until || ""), state: String(j.state || "on"), why: j.why ? String(j.why) : undefined, by: j.by ? String(j.by) : undefined });
    });
    return out;
  }
  private activeRules(): Rule[] {
    const p = this.dayPart, now = this.now;
    return this.rules().filter((r) => r.state === "on" && (!r.until || Date.parse(r.until) > now) && (r.when === "any" || r.when === p));
  }
  private learned(t: string): number {
    const s = (this.S(this.C.learning)?.attributes.scores || {}) as Record<string, number>;
    return (s[t] || 0) * 0.35 + (s[t + "@" + this.dayPart] || 0) * 0.5;
  }
  /** How much a topic deserves the screen right now: what's happening + what you've taught it. */
  private rank(t: Topic, base: number): number {
    const rs = this.activeRules().filter((r) => r.topic === t);
    if (rs.some((r) => r.effect === "never")) return -99;
    let s = base + this.learned(t);
    rs.forEach((r) => { if (r.effect === "always") s += 50; if (r.effect === "more") s += 3; if (r.effect === "less") s -= 3; });
    return s;
  }
  private whoHere(): string {
    const home = (this.C.people || []).filter((p) => this.S(p.person)?.state === "home");
    return home.length === 1 ? home[0].key : "";
  }
  private log(topic: Topic, action: string, moment = false): void {
    if (!this.H) return;
    const data = { topic, action, who: this.whoHere(), moment };
    const viaScript = () => this.H.callService("script", "pik_screen_log", data).catch(() => undefined);
    if (this.H.callWS) this.H.callWS({ type: "fire_event", event_type: "pik_screen", event_data: data }).catch(viaScript);
    else viaScript();
  }

  // ---------------- ticking, idle, voice ----------------

  private tick(): void {
    this.now = Date.now();
    const idle = (this.now - this.touched) / 1000;
    if (!this.narrow && this.layer === "home" && !this.talk && !this.sheet && idle > (this.C.ambient_after || 120)) { this.layer = "ambient"; this.storyIdx = 0; this.storyAt = this.now; }
    if (this.layer === "ambient" && this.now - this.storyAt > (this.C.story_seconds || 12) * 1000) { this.storyIdx++; this.storyAt = this.now; }
    if (this.sheet && idle > 90) this.sheet = "";
    if (this.H) { this.refreshCal(); this.refreshCook(); this.refreshHist(); }
    this.requestUpdate();
  }
  private wake(): void { this.touched = Date.now(); if (this.layer !== "home") { this.layer = "home"; this.requestUpdate(); } }

  private get V(): { satellite: string; mute?: string } | undefined {
    const v = this.C.voice;
    if (!v || !this.H) return undefined;
    try { return localStorage.getItem("vs-satellite-entity") === v.satellite ? v : undefined; } catch (_) { return undefined; }
  }
  private get muted(): boolean { const v = this.V; const e = v ? this.S(v.satellite) : undefined; return !!(e && (e.attributes as Record<string, unknown>).muted); }
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
      this.wake();
      if (t === "listen" && prev !== "responding") { this.q = ""; this.a = ""; this.capIdx = 0; }
      this.talk = t;
      if (t === "speak") this.startCaps();
    } else if (this.talk) {
      clearTimeout(this._t3);
      if (this.talk === "speak" && this.a) this._t3 = window.setTimeout(() => { this.talk = null; this.requestUpdate(); }, 7000);
      else this.talk = null;
    }
  }
  private pages(a: string): string[] {
    const sents = (a || "").match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [a || ""];
    const out: string[] = [];
    let cur = "";
    sents.forEach((x) => { const t = x.trim(); if (!t) return; if (cur && (cur + " " + t).length > 120) { out.push(cur); cur = t; } else cur = cur ? cur + " " + t : t; });
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }
  private startCaps(): void { clearTimeout(this._cap); this.capIdx = 0; this.nextCap(); }
  private nextCap(): void {
    const p = this.pages(this.a), i = this.capIdx;
    if (i >= p.length - 1) return;
    const words = p[i].split(/\s+/).length;
    this._cap = window.setTimeout(() => { this.capIdx = i + 1; this.requestUpdate(); this.nextCap(); }, Math.max(2400, (words / 2.6) * 1000));
  }
  private hideOverlay(on: boolean): void {
    const el = document.getElementById("voice-satellite-ui");
    if (!el) return;
    if (on && el.style.display !== "none") { el.style.display = "none"; el.dataset.pikHidden = "1"; }
    if (!on && el.dataset.pikHidden) { el.style.display = ""; delete el.dataset.pikHidden; }
  }
  private tapPik(): void {
    const v = this.V;
    if (!v || !this.S(v.satellite)) { this.flash("Say “Hey Luna” to talk to Pik on the kitchen screen."); return; }
    if (this.muted) { this.flash("My mic is off. Tap the mic to turn it back on."); return; }
    if (!this.talk) this.svc("voice_satellite", "wake", {}, { entity_id: v.satellite });
  }
  private toggleMic(): void {
    const v = this.V;
    const sw = v && (v.mute || v.satellite.replace("assist_satellite.", "switch.") + "_mute");
    if (sw && this.S(sw)) this.svc("switch", "toggle", {}, { entity_id: sw });
  }

  // ---------------- actions ----------------

  private svc(domain: string, service: string, data: Record<string, unknown> = {}, target?: Record<string, unknown>): void {
    this.H.callService(domain, service, data, target).catch((e: Error) => this.flash("That didn't work: " + e.message));
  }
  private async svcSay(domain: string, service: string, data: Record<string, unknown> = {}): Promise<void> {
    try {
      if (!this.H.callWS) { await this.H.callService(domain, service, data); return; }
      const r = await this.H.callWS<{ response?: { message?: string } }>({ type: "call_service", domain, service, service_data: data, return_response: true });
      const m = r && r.response && r.response.message;
      if (m) this.flash(m);
    } catch (e) { this.flash("That didn't work: " + (e as Error).message); }
  }
  private flash(msg: string): void {
    clearTimeout(this._toastT);
    this.toast = msg;
    this.requestUpdate();
    this._toastT = window.setTimeout(() => { this.toast = ""; this.requestUpdate(); }, 3200);
  }
  private navigate(path: string): void {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }
  private moreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
  private hide(key: string, ms = 864e5 * 30): void {
    this.snoozed[key] = Date.now() + ms;
    try { localStorage.setItem("pik-home-snoozed", JSON.stringify(this.snoozed)); } catch (_) { /* private mode */ }
    this.requestUpdate();
  }
  private unhide(prefix: string): void {
    Object.keys(this.snoozed).filter((k) => k.startsWith(prefix)).forEach((k) => delete this.snoozed[k]);
    try { localStorage.setItem("pik-home-snoozed", JSON.stringify(this.snoozed)); } catch (_) { /* private mode */ }
    this.wake();
    this.requestUpdate();
  }
  private isHidden(key: string): boolean { return (this.snoozed[key] || 0) > this.now; }
  private open(topic: Topic, fn: () => void): void { this.log(topic, "open"); fn(); }

  // ---------------- view-model helpers ----------------

  private person(key: string): Person | undefined { return (this.C.people || []).find((p) => p.key === key); }
  private colorFor(key: string): string { return key === "both" ? "#5E8A5A" : this.person(key)?.color || "#7A6C5E"; }

  private energy(): Energy | null {
    const en = this.C.energy;
    if (!en || !this.S(en.battery_level)) return null;
    const v = (id?: string) => num(this.S(id)) || 0;
    const out = !!en.grid_status && this.S(en.grid_status)?.state === "off";
    let solar = Math.max(0, v(en.solar_power)), house = Math.max(0, v(en.load_power)), bat = -v(en.battery_power), grid: number | null = out ? null : -v(en.grid_power);
    if (Math.abs(solar) > 50 || Math.abs(house) > 50) { solar /= 1000; house /= 1000; bat /= 1000; if (grid !== null) grid /= 1000; }
    const pct = Math.round(v(en.battery_level));
    const hours = bat < -0.05 ? Math.round((pct / 100) * (en.capacity_kwh || 13.5) / -bat) : null;
    const dark = (this.S(this.C.sun)?.state || "") === "below_horizon";
    let main = "", sub = "";
    if (out) { main = "Power's out. The Powerwall has it."; sub = hours ? "About " + hours + " hours left at this rate" : "Solar is keeping it charged"; }
    else if (solar > 0.1 && solar >= house) { main = "The sun is running the house"; sub = bat > 0.05 ? "Charging the Powerwall, " + pct + "%" : (grid || 0) > 0.05 ? "Sending the extra to the grid" : "Right on balance"; }
    else if (bat < -0.05) { main = "The Powerwall is running the house"; sub = (dark ? "Solar's asleep until morning · " : "") + pct + "% left"; }
    else { main = "The grid is running the house"; sub = "The Powerwall is resting at " + pct + "%"; }
    return { solar, house, bat, grid, pct, hours, main, sub, out };
  }

  private groups() {
    const q = parseQuiet(this.S(this.C.plants_quiet)?.state), now = this.now;
    return liveGroups(this.C, this.H, this.plantItems).map((g) => Object.assign({}, g, { dry: g.live && g.m <= g.thr && !((q[g.id] || 0) > now) }));
  }

  private bottles(): Array<{ name: string; kind: "red" | "rose" | "white"; vintage: number | null }> {
    return this.cellarItems.filter((i) => i.status === "needs_action").map((i) => {
      const t = i.summary + " " + (i.description || "");
      const vm = /\b(19|20)\d\d\b/.exec(i.summary);
      const kind: "red" | "rose" | "white" = ROSE.test(t) ? "rose" : WHITE.test(t) ? "white" : "red";
      return { name: i.summary, kind, vintage: vm ? +vm[0] : null };
    }).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "red" ? -1 : b.kind === "red" ? 1 : a.kind === "white" ? -1 : 1));
  }
  private drinkFirst(): string {
    const y = new Date().getFullYear();
    const c = this.bottles().filter((b) => b.kind !== "red" && b.vintage && b.vintage <= y - 2).sort((a, b) => (a.vintage || 0) - (b.vintage || 0));
    return c.length ? c[0].name : "";
  }

  /** This weekend's trails (moderate first). Gone once the weekend's `until` passes. */
  private hikes(): Hike[] {
    const now = this.now;
    return this.hikeItems.filter((i) => i.status === "needs_action").map((i) => {
      const j = parseDesc(i.description) as Record<string, unknown>;
      const n = (k: string) => (typeof j[k] === "number" ? (j[k] as number) : Number(j[k]) || 0);
      const url = String(j.url || "");
      return { name: i.summary, kind: String(j.kind || ""), miles: n("miles"), gain: n("gain_ft"), drive: n("drive_min"), why: String(j.why || ""), url: /^https:\/\/(www\.)?alltrails\.com\//.test(url) ? url : "", forecast: String(j.forecast || ""), until: j.until ? Date.parse(String(j.until)) : 0 };
    }).filter((h) => !h.until || h.until > now).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "moderate" ? -1 : 1)).slice(0, 2);
  }
  /** Friday evening and weekend mornings are when a hike idea is worth the space. */
  private hikeBoost(): number {
    const d = new Date(this.now), wd = d.getDay(), h = d.getHours();
    if (wd === 5 && h >= 15) return 2.5;
    if ((wd === 6 || wd === 0) && h < 13) return 3;
    if (wd === 6 && h < 17) return 1;
    return 0;
  }
  private hikeStats(h: Hike): string {
    return [h.miles ? h.miles + " mi" : "", h.gain ? h.gain.toLocaleString() + " ft up" : "", h.drive ? h.drive + " min drive" : ""].filter(Boolean).join(" · ");
  }
  private openHike(h: Hike): void {
    this.log("hikes", "open");
    if (h.url) window.open(h.url, "_blank", "noopener");
    else this.flash("No AllTrails link for that one.");
  }

  private feed(): FeedRow[] {
    const now = this.now;
    const out: FeedRow[] = [];
    this.feedItems.filter((it) => it.status === "needs_action" && !(it.due && Date.parse(it.due) > now)).forEach((it) => {
      const j = parseDesc(it.description) as Record<string, unknown> & ReturnType<typeof parseDesc>;
      if (j.expires && Date.parse(j.expires) < now) return;
      const who = String(j.who || "");
      const topic: Topic = who ? "piks" : CAT_TOPIC[j.category || ""] || "calendar";
      const p = j.primary || {}, sec = j.secondary || null;
      const done = () => this.svc("todo", "update_item", { item: it.uid, status: "completed" }, { entity_id: this.C.feed_list });
      out.push({
        uid: it.uid, title: it.summary, label: j.label || "", detail: j.detail || "", urgent: !!j.urgent, who, at: j.at ? Date.parse(String(j.at)) : 0, cat: j.category || "home", topic,
        secLabel: sec && sec.label ? sec.label : "Dismiss",
        primary: () => {
          this.log(topic, "open");
          if (p.script && /^script\.[a-z0-9_]+$/.test(p.script)) this.svc("script", p.script.slice(7));
          if (p.open === "camera" && this.C.doorbell?.camera) this.moreInfo(this.C.doorbell.camera);
          else if (p.open === "energy") this.sheet = "energy";
          else if (p.open === "plants" && this.C.plants_path) this.navigate(this.C.plants_path);
          else if (p.open && p.open.startsWith("/")) this.navigate(p.open);
          else if (p.open && /^https:\/\//.test(p.open)) { window.open(p.open, "_blank", "noopener"); return; }
          done();
          if (p.toast) this.flash(p.toast);
        },
        secondary: () => {
          this.log(topic, "dismiss");
          if (sec && sec.kind === "snooze") {
            const d = new Date(now + (sec.minutes || 60) * 60000);
            this.svc("todo", "update_item", { item: it.uid, due_datetime: d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":00" }, { entity_id: this.C.feed_list });
            this.flash("Okay, I'll bring it back later.");
          } else { done(); this.flash("Okay, cleared."); }
        },
      });
    });
    return out.sort((a, b) => (a.urgent !== b.urgent ? (a.urgent ? -1 : 1) : b.at - a.at));
  }

  private nextFor(key: string): CalEvent | undefined {
    const now = this.now;
    return this.calEvents.find((e) => endMs(e) > now && (forWho(e) === key || forWho(e) === "both"));
  }

  private today(): TodayRow[] {
    const now = this.now;
    const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
    const eod = d0.getTime() + 864e5, eot = eod + 864e5;
    const rows: TodayRow[] = [];
    const hol = this.holiday();
    if (hol) {
      const due = ((this.cook as { due_now?: Array<{ task: string }> } | null)?.due_now || [])[0];
      rows.push(due
        ? { key: "hol", t: "Now", color: "#C2671F", what: due.task, note: "show the step", tap: () => this.unhide("cook-") }
        : { key: "hol", t: "Today", color: "#5E8A5A", what: hol.name + " cooking mode", note: "open the plan", tap: () => this.open("cooking", () => this.navigate(hol.path)) });
    }
    const todays = this.calEvents.filter((e) => endMs(e) > now && startMs(e) < eod);
    const tomorrow = this.calEvents.filter((e) => startMs(e) >= eod && startMs(e) < eot);
    const leave = this.leaveInfo();
    const evRow = (e: CalEvent, tom: boolean): TodayRow => {
      const allDay = !/T/.test(e.start), s = new Date(startMs(e));
      const lv = leave && leave.start && Math.abs(Date.parse(leave.start) - startMs(e)) < 60000 ? "leave " + hm(new Date(leave.at)) : "";
      const from = fromWho(e);
      return { key: e.start + e.summary, t: allDay ? "All day" : hm(s), tsub: tom ? "Tmrw" : undefined, color: this.colorFor(forWho(e)), what: e.summary, note: lv || (e.location ? e.location.split(",")[0] : from ? "from " + from : ""), tap: () => this.open("calendar", () => this.flash(e.summary + (e.location ? " · " + e.location : ""))) };
    };
    todays.forEach((e) => rows.push(evRow(e, false)));
    this.feed().filter((f) => f.cat === "package").forEach((f) => rows.push({ key: f.uid, t: "Today", color: "#5E8A5A", what: f.title, note: f.label, tap: f.primary }));
    if (this.low !== null && this.low <= 32 && new Date(now).getHours() < 22) rows.push({ key: "freeze", t: "Tonight", color: "#6FA3C7", what: "Freeze, low of " + this.low + "°", note: "pots and hoses in" });
    if (rows.length < 4) tomorrow.slice(0, 4 - rows.length).forEach((e) => rows.push(evRow(e, true)));
    return rows.slice(0, 6);
  }

  private leaveInfo(): { t: string; at: number; start: string; drive: string; f: boolean } | null {
    const s = this.S(this.C.leave)?.state || "";
    if (!s.startsWith("{")) return null;
    try { const j = JSON.parse(s); return { t: String(j.t || ""), at: Date.parse(j.at), start: String(j.start || ""), drive: String(j.drive || ""), f: !!j.f }; } catch (_) { return null; }
  }

  private headline(): string {
    const h = this.S(this.C.headline)?.state || "";
    const fresh = h && !["unknown", "unavailable"].includes(h) && Date.now() - Date.parse(this.S(this.C.headline)!.last_changed) < 6 * 3600e3;
    if (fresh) return h;
    const nx = this.calEvents.find((e) => startMs(e) > this.now);
    if (nx) return whenWord(nx.start) + ": " + nx.summary + ".";
    const dry = this.groups().filter((g) => g.dry);
    if (dry.length) return dry.map((g) => g.room).join(" and ") + " could use water today.";
    return "All quiet. Nothing needs you right now.";
  }

  // ---------------- moments ----------------

  private moments(): Moment[] {
    const out: Moment[] = [];
    const now = this.now;
    // A finished kitchen timer
    if (this.H) poolTimers(this.H, this.C.timers || 12).filter((t) => t.rang && now - t.end < 30 * 60000).forEach((t) => {
      const key = "timer-" + t.id + "-" + t.end;
      if (!this.isHidden(key)) out.push({ key, kind: "timer", topic: "timers", body: () => this.timerMoment(t, key) });
    });
    // The doorbell
    const rg = this.C.ring;
    const ding = rg && this.S(rg.ding);
    if (rg && ding && ding.state && !["unknown", "unavailable"].includes(ding.state) && now - Date.parse(ding.state) < 180000) {
      const key = "ding-" + ding.state;
      if (!this.isHidden(key)) out.push({ key, kind: "doorbell", topic: "doorbell", body: () => this.ringMoment(key) });
    }
    // Time to go
    const lv = this.leaveInfo();
    if (lv && now >= lv.at - 30 * 60000 && now <= lv.at + 10 * 60000) {
      const key = "leave-" + lv.at;
      if (!this.isHidden(key)) out.push({ key, kind: "leave", topic: "calendar", body: () => this.leaveMoment(lv, key) });
    }
    // A storm
    const sa = this.C.storm && this.S(this.C.storm.alert);
    if (sa && sa.state && !["none", "unknown", "unavailable", "", "No alerts"].includes(sa.state)) {
      const key = "storm-" + sa.state;
      if (!this.isHidden(key)) out.push({ key, kind: "storm", topic: "weather", body: () => this.stormMoment(sa.state, key) });
    }
    // A cooking step that's due
    const ck = this.cook as { due_now?: Array<{ id: string; when: string; task: string }> } | null;
    if (this.holiday() && ck && ck.due_now && ck.due_now.length) {
      const key = "cook-" + ck.due_now.map((x) => x.id).join(",");
      if (!this.isHidden(key)) out.push({ key, kind: "cooking", topic: "cooking", body: () => this.cookMoment(key) });
    }
    return out;
  }

  private dismissMoment(m: { key: string; topic: Topic }, ms?: number): void { this.log(m.topic, "dismiss", true); this.hide(m.key, ms); this.wake(); }

  private timerMoment(t: PoolTimer, key: string): TemplateResult {
    return html`<div class="mom paper"><div class="mpad" style="justify-content: center; align-items: center; text-align: center; gap: 26px">
${this.pikFace(184, "p-alert")}
<div class="kicker" style="color: var(--clay)">Timer done</div>
<div class="h1" style="font-size: 76px">${t.label}</div>
<div class="mbar" style="justify-content: center"><button type="button" class="pill ink" @click=${() => { this.svc("script", "kitchen_timer_stop", { slot: t.id }); this.hide(key); this.wake(); }}>Got it</button>
<button type="button" class="pill ghost" @click=${() => { this.svc("script", "kitchen_timer_add5", { slot: t.id }); this.hide(key); this.wake(); }}>5 more minutes</button></div>
</div></div>`;
  }

  private ringMoment(key: string): TemplateResult {
    const rg = this.C.ring!;
    const cam = this.S(rg.camera);
    const pic = cam && cam.attributes.entity_picture ? String(cam.attributes.entity_picture) + "&t=" + Math.floor(this.now / 2000) : "";
    const light = rg.light && this.S(rg.light);
    return html`<div class="mom ring"><div class="mpad">
<div class="mbar">${this.pikFace(84, "p-alert")}
<div style="flex: 1"><div class="kicker" style="color: #A9B6D6">${rg.name || "Doorbell"} · ${hmA(new Date(Date.parse(this.S(rg.ding)!.state)))}</div><div class="h1" style="font-size: 46px">Someone's at the ${(rg.name || "door").toLowerCase()}.</div></div></div>
<div class="camwrap">${pic ? html`<img src=${pic} alt="Live view from the ${rg.name || "doorbell"} camera">` : nothing}<div class="camtag"><i></i>Live · Ring</div></div>
<div class="mbar">
${light ? html`<button type="button" class="pill sun" @click=${() => { this.svc("light", light.state === "on" ? "turn_off" : "turn_on", {}, { entity_id: rg.light }); }}>${light.state === "on" ? "Light off" : "Turn the light on"}</button>` : nothing}
<button type="button" class="pill ghost" @click=${() => this.moreInfo(rg.camera)}>Bigger view</button>
<span class="grow"></span>
<button type="button" class="pill ghost" @click=${() => this.dismissMoment({ key, topic: "doorbell" })}>Done</button>
</div></div></div>`;
  }

  private leaveMoment(lv: { t: string; at: number; start: string; drive: string; f: boolean }, key: string): TemplateResult {
    const mins = Math.max(0, Math.ceil((lv.at - this.now) / 60000));
    const frac = Math.max(0, Math.min(1, mins / 30));
    const start = lv.start ? new Date(Date.parse(lv.start)) : null;
    const lots = (this.C.airport && this.C.airport.lots) || [];
    const lotTxt = lots.slice(0, 3).map((l) => ({ n: l.short || l.name, v: this.S(l.entity)?.state })).filter((x) => x.v && /^\d+$/.test(x.v));
    const both = (this.C.people || []).filter((p) => this.S(p.person)?.state === "home").length > 1;
    return html`<div class="mom navy"><div class="mpad">
<div style="display: flex; align-items: center; gap: 40px">
<div class="cnt"><svg width="220" height="220" viewBox="0 0 250 250" aria-hidden="true"><circle cx="125" cy="125" r="112" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="12"></circle><circle cx="125" cy="125" r="112" fill="none" stroke="#F0B25E" stroke-width="12" stroke-linecap="round" stroke-dasharray="704" stroke-dashoffset=${704 * (1 - frac)} transform="rotate(-90 125 125)"></circle></svg>
<div><b>${mins}</b><span>${mins === 1 ? "minute" : "minutes"}</span></div></div>
<div style="flex: 1; min-width: 0"><div class="kicker" style="color: #A9B6D6">Time to go${both ? " · both of you" : ""}</div>
<div class="h1" style="font-size: 60px">${mins > 0 ? "Leave at " + hmA(new Date(lv.at)) + "." : "Time to head out."}</div>
<p style="margin: 12px 0 0; font-size: 20px; line-height: 1.45; color: #C7CEE3">${lv.t}${start ? " at " + hmA(start) : ""}. ${lv.drive ? "It's " + lv.drive + " with traffic right now." : ""}</p></div></div>
<div class="g3">
<div class="mcard"><div class="eb" style="color: #A9B6D6">Where</div><div class="big">${lv.t}</div><div class="sub">${start ? (lv.f ? "Departs " : "Starts ") + hmA(start) : ""}</div></div>
<div class="mcard"><div class="eb" style="color: #A9B6D6">Drive · Google Maps</div><div class="big">${lv.drive || "—"}</div><div class="sub">${lv.f ? "Leaves you two hours for the airport" : "With traffic right now"}</div></div>
${lv.f && lotTxt.length ? html`<div class="mcard"><div class="eb" style="color: #A9B6D6">Parking · ${(this.C.airport && this.C.airport.name) || "airport"} live</div><div class="big">${lotTxt[0].n} · ${lotTxt[0].v} open</div><div class="sub">${lotTxt.slice(1).map((x) => x.n + " " + x.v).join(" · ")}</div></div>`
      : html`<div class="mcard"><div class="eb" style="color: #A9B6D6">Outside</div><div class="big">${this.outTemp()}</div><div class="sub">${this.wxWord()}${this.low !== null ? " · low " + this.low + "°" : ""}</div></div>`}
</div>
${this.ladder(lv)}
<div class="mbar">
${this.pikFace(72, "p-rest")}
<div class="grow">When you head out, tap <b>We're leaving</b>: lights off and the heat down 4°.</div>
<button type="button" class="pill sun" @click=${() => { this.svcSay("script", (this.C.leaving_script || "script.pik_leaving").replace("script.", "")); this.log("calendar", "open", true); this.hide(key); this.wake(); }}>We're leaving</button>
<button type="button" class="pill ghost" @click=${() => this.dismissMoment({ key, topic: "calendar" }, 5 * 60000)}>5 more minutes</button>
</div></div></div>`;
  }

  /** Leave → arrive → starts, from the drive time Google Maps gave the leave alert. */
  private ladder(lv: { t: string; at: number; start: string; drive: string; f: boolean }): TemplateResult {
    const m = /(?:(\d+)\s*h\w*)?\s*(?:(\d+)\s*min)?/i.exec(lv.drive || "");
    const mins = m ? (+(m[1] || 0)) * 60 + (+(m[2] || 0)) : 0;
    const steps: Array<[string, string]> = [["Leave home", hmA(new Date(lv.at))]];
    if (mins) steps.push([lv.f ? "At the airport" : "Arrive", hmA(new Date(lv.at + mins * 60000))]);
    if (lv.start) steps.push([lv.f ? "Departs" : "Starts", hmA(new Date(Date.parse(lv.start)))]);
    return html`<div class="mcard" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; min-height: 0">
<div class="eb" style="color: #A9B6D6">The plan</div>
<div style=${"position: relative; display: grid; grid-template-columns: repeat(" + steps.length + ", minmax(0, 1fr))"}>
<div style="position: absolute; left: 8px; right: 30%; top: 7px; height: 2px; background: rgba(255,255,255,.18)"></div>
${steps.map((st, i) => html`<div style="position: relative"><div style=${"width: 16px; height: 16px; border-radius: 50%; " + (i === 0 ? "background: #F0B25E" : "background: #3A4770; border: 2px solid #A9B6D6")}></div><div class="serif" style="font-size: 30px; margin-top: 10px">${st[1]}</div><div style="font-size: 14px; opacity: .8">${st[0]}</div></div>`)}
</div></div>`;
  }

  private stormMoment(name: string, key: string): TemplateResult {
    const st = this.C.storm!;
    const ends = st.ends ? this.S(st.ends)?.state : "";
    const watch = st.watch ? this.S(st.watch) : undefined;
    const e = this.energy();
    return html`<div class="mom storm"><div class="mpad">
<div style="display: flex; align-items: center; gap: 26px">${this.pikFace(120, "p-alert")}<div><div class="kicker" style="color: #F0B25E">Weather alert · National Weather Service</div>
<div class="h1" style="font-size: 64px">${name}.</div></div></div>
<p style="margin: 0; font-size: 20px; opacity: .85">${ends && !["unknown", "none", ""].includes(ends) ? "Until " + ends + ". " : ""}${e ? "The Powerwall is at " + e.pct + "%." : ""}</p>
<div class="g3"><div class="mcard"><div class="eb" style="color: #B9C2CC">Storm Watch</div><div class="big">${watch ? (watch.state === "on" ? "On" : "Off") : "—"}</div><div class="sub">${watch && watch.state === "on" ? "The Powerwall fills up and holds for an outage." : "Turn it on and the Powerwall fills up and holds."}</div></div>
<div class="mcard"><div class="eb" style="color: #B9C2CC">Outside</div><div class="big">${this.outTemp()}</div><div class="sub">${this.wxWord()}</div></div>
<div class="mcard"><div class="eb" style="color: #B9C2CC">If the power goes</div><div class="big">${e ? (e.hours ? "~" + e.hours + " hours" : e.pct + "%") : "—"}</div><div class="sub">The house switches to the Powerwall on its own.</div></div></div>
<div class="mbar" style="margin-top: auto"><span class="grow"></span>
${watch && watch.state !== "on" ? html`<button type="button" class="pill sun" @click=${() => { this.svc("switch", "turn_on", {}, { entity_id: st.watch }); this.flash("Storm Watch is on."); }}>Turn on Storm Watch</button>` : nothing}
<button type="button" class="pill ghost" @click=${() => this.dismissMoment({ key, topic: "weather" })}>Got it</button></div>
</div></div>`;
  }

  private cookMoment(key: string): TemplateResult {
    const ck = this.cook as { due_now?: Array<{ id: string; when: string; task: string }>; next?: Array<{ id: string; when: string; task: string }>; dinner?: string; turkey_f?: Record<string, string> };
    const due = (ck.due_now || [])[0];
    const nxt = (ck.next || []).slice(0, 3);
    const hol = this.holiday();
    const timers = this.H ? poolTimers(this.H, this.C.timers || 12).filter((t) => !t.rang).slice(0, 3) : [];
    const tf = ck.turkey_f || {};
    const temps = Object.keys(tf).filter((k) => /\d/.test(String(tf[k])));
    return html`<div class="mom paper"><div class="mpad" style="display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px">
<div style="display: flex; flex-direction: column; gap: 16px; min-height: 0">
<div class="kicker" style="color: var(--clay)">${hol ? hol.name : "Cooking"} · due ${due.when.replace(/^\w+ /, "")}</div>
<div class="mcard" style="flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 30px 36px; box-shadow: 0 30px 60px -34px rgba(80,55,30,.35)">
<div class="h1" style="font-size: ${due.task.length > 110 ? 40 : 50}px; margin: 0">${due.task}</div>
${ck.dinner ? html`<div class="sub" style="margin-top: auto">${ck.dinner}</div>` : nothing}</div>
<div class="mbar">
<button type="button" class="pill ink" @click=${() => { this.svc("script", (this.C.cooking!.done_script || "script.holiday_task_done").replace("script.", ""), { task: due.id }); this.log("cooking", "open", true); this.hide(key); this.cookAt = 0; this.wake(); }}>Done</button>
${hol ? html`<button type="button" class="pill ghost" style="color: var(--ink)" @click=${() => this.navigate(hol.path)}>Open the plan</button>` : nothing}
<span class="grow"></span>
<button type="button" class="pill ghost" style="color: var(--ink)" @click=${() => this.dismissMoment({ key, topic: "cooking" }, 10 * 60000)}>In 10 minutes</button></div>
</div>
<div style="display: flex; flex-direction: column; gap: 14px; min-height: 0">
<div style="display: flex; align-items: center; gap: 16px">${this.pikFace(140, "p-rest")}${this.talk || (this.a && this._t3) ? nothing : html`<div style="font-size: 15px; color: var(--mute2); line-height: 1.45">Hands full? Say<br><b style="color: var(--ink)">“Hey Luna, what’s next?”</b></div>`}</div>
${this.voiceBubble(true)}
${timers.length ? html`<div class="tile tmr" style="border-radius: 26px"><span class="eb">Timers</span>${timers.map((t) => html`<div class="trow"><span>${t.label}</span><b>${this.left(t)}</b></div>`)}</div>` : nothing}
${temps.length ? html`<div class="tile smoke" style="border-radius: 26px"><span class="eb">Turkey</span>${temps.map((k) => html`<div class="trow"><span>${k}</span><b>${tf[k]}</b></div>`)}</div>` : nothing}
<div class="tile" style="border-radius: 26px"><span class="eb">Next</span>${nxt.map((n) => html`<div style="padding: 6px 0; border-top: 1px solid var(--line2)"><b style="font-size: 14px">${n.when.replace(/^\w+ /, "").replace(/ \(moved.*\)/, "")}</b><div class="sub">${n.task}</div></div>`)}</div>
</div></div></div>`;
  }

  /** Pik on a moment: follows the voice (listening, thinking, speaking) and is tap-to-talk, like on Home. */
  private pikFace(size: number, idle: string): TemplateResult {
    const cls = this.muted ? "p-muted" : this.talk ? "p-" + this.talk : idle;
    return html`<button type="button" class=${"pikbtn pik " + cls} style="flex: none; margin: 0" aria-label="Talk to Pik" @click=${(e: Event) => { e.stopPropagation(); this.tapPik(); }}><span class="mini" style=${"width: " + size + "px; height: " + size + "px"}>${pikArt("Pik")}</span></button>`;
  }

  /** While you talk to Pik over a moment, its answer floats on top so you never lose the moment underneath. */
  private voiceBubble(inline = false): TemplateResult | typeof nothing {
    const talking = !!this.talk || !!(this.a && this._t3);
    if (!talking) return nothing;
    const pages = this.pages(this.a), ci = Math.min(this.capIdx, pages.length - 1);
    const line = this.talk === "listen" ? "I'm listening…" : this.talk === "think" ? "Let me think…" : pages[ci] || "";
    return html`<div class=${"vbub" + (inline ? " inline" : "")} aria-live="polite"><div class="who"><span>${this.q ? "You asked" : "Pik"}</span>${pages.length > 1 ? html`<span class="cdots">${pages.map((_p, k) => html`<i class=${k === ci ? "on" : ""}></i>`)}</span>` : nothing}</div>${this.q ? html`<div class="q">“${this.q}”</div>` : nothing}<div class="line">${line}</div></div>`;
  }

  private left(t: PoolTimer): string {
    const s = Math.max(0, Math.round((t.end - this.now) / 1000));
    return Math.floor(s / 60) + ":" + p2(s % 60);
  }

  // ---------------- stories ----------------

  private stories(): Story[] {
    const h = new Date(this.now).getHours();
    const [qa, qb] = this.C.quiet_hours || [23, 7];
    const night = qa > qb ? h >= qa || h < qb : h >= qa && h < qb;
    if (night) return [{ id: "night", topic: "calendar", score: 1, theme: "night", render: () => this.nightStory() }];
    const part = this.dayPart;
    const e = this.energy();
    const dry = this.groups().filter((g) => g.dry);
    const eod = new Date(this.now); eod.setHours(23, 59, 0, 0);
    const todayN = this.calEvents.filter((x) => endMs(x) > this.now && startMs(x) < eod.getTime()).length;
    const pikMsg = this.feed().find((f) => f.who && this.now - f.at < 12 * 3600e3);
    const list: Story[] = [
      { id: "day", topic: "calendar", theme: "morning", score: this.rank("calendar", (part === "morning" ? 4 : 1.5) + (todayN ? 1 : -1)), render: () => this.dayStory() },
      { id: "energy", topic: "energy", theme: "energy", score: e ? this.rank("energy", 1 + (e.out ? 5 : 0) + (e.solar > 3 ? 1 : 0)) : -99, render: () => this.energyStory() },
      { id: "plants", topic: "plants", theme: "garden", score: this.groups().length ? this.rank("plants", 0.8 + (dry.length ? 3 : 0)) : -99, render: () => this.plantStory() },
      { id: "cellar", topic: "cellar", theme: "cellar", score: this.bottles().length ? this.rank("cellar", 0.6 + (part === "evening" ? 1.2 : 0)) : -99, render: () => this.cellarStory() },
      { id: "piks", topic: "piks", theme: "morning", score: pikMsg ? this.rank("piks", 3) : -99, render: () => this.pikStory(pikMsg!) },
      { id: "hikes", topic: "hikes", theme: "trail", score: this.hikes().length ? this.rank("hikes", 0.5 + this.hikeBoost()) : -99, render: () => this.hikeStory() },
    ];
    return list.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private sfoot(list: Story[], i: number, dark: boolean): TemplateResult {
    return html`<div class="sfoot" style=${"color: " + (dark ? "#C9D3D6" : "#7A6C5E")}>
<span>Tap anywhere for home</span>
<span style="display: flex; align-items: center; gap: 14px"><span class="sdots">${list.map((_s, k) => html`<i class=${k === i ? "on" : ""}></i>`)}</span>
${list.length > 1 ? html`<button type="button" class="skip" @click=${(ev: Event) => { ev.stopPropagation(); this.log(list[i].topic, "skip"); this.storyIdx++; this.storyAt = Date.now(); this.requestUpdate(); }}>Next ›</button>` : nothing}</span></div>`;
  }

  private dayStory(): TemplateResult {
    const d = new Date(this.now);
    const H0 = 7, H1 = 23, span = (H1 - H0) * 3600e3;
    const base = new Date(this.now); base.setHours(H0, 0, 0, 0);
    const x = (ms: number) => Math.max(0, Math.min(100, ((ms - base.getTime()) / span) * 100));
    const eod = base.getTime() + span;
    const evs = this.calEvents.filter((e) => /T/.test(e.start) && endMs(e) > base.getTime() && startMs(e) < eod);
    const lanes = (this.C.people || []).map((p) => ({ name: p.name, color: p.color, evs: evs.filter((e) => forWho(e) === p.key) }))
      .concat([{ name: "Both", color: "#5E8A5A", evs: evs.filter((e) => forWho(e) === "both") }]);
    const e = this.energy();
    const dry = this.groups().filter((g) => g.dry);
    const nx = this.calEvents.find((ev) => startMs(ev) > this.now);
    const greet = this.dayPart === "morning" ? "Good morning" : this.dayPart === "midday" ? "This afternoon" : "This evening";
    return html`<div class="story">
<div class="shead"><div class="pik p-speak">${pikArt("Pik")}</div><div style="flex: 1; min-width: 0"><div class="kicker" style="color: var(--clay)">${greet} · ${d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} · ${hmA(d)}</div><div class="h1">${this.headline()}</div></div></div>
<div class="glass">
<div class="hours"><i></i><div>${[9, 12, 15, 18, 21].map((hh) => html`<span style=${"left: " + (((hh - H0) / (H1 - H0)) * 100) + "%"}>${hh > 12 ? hh - 12 + " PM" : hh === 12 ? "12 PM" : hh + " AM"}</span>`)}</div></div>
<div class="lanes">${lanes.map((l) => html`<div class="lane"><b style=${"color: " + l.color}>${l.name}</b><div class="track" style=${"background: " + l.color + "14"}>
${l.evs.map((ev) => { const a = x(startMs(ev)), b = x(endMs(ev)); return html`<div class="ev" style=${"left: " + a + "%; width: " + Math.max(2.5, b - a) + "%; background: " + l.color}>${ev.summary}</div>`; })}
<div class="nowline" style=${"left: " + x(this.now) + "%"}></div></div></div>`)}</div>
${!evs.length ? html`<div class="empty" style="padding-bottom: 0">Nothing on the calendar today. Plans you send Pik land here.</div>` : nothing}
</div>
<div class="cards4">
<div class="sc"><div class="eb">Outside</div><div class="big">${this.outTemp()}${this.hi !== null ? html` <span style="font-size: 22px; color: var(--mute)">→ ${this.hi}°</span>` : nothing}</div><div class="sub">${this.wxWord()}${this.low !== null ? ". Low " + this.low + "°" + (this.low <= 32 ? ", a freeze" : "") : ""}.</div></div>
<div class="sc"><div class="eb" style="color: var(--green)">Water today</div><div class="big">${dry.length ? dry.map((g) => g.room).join(", ") : "Nobody"}</div><div class="sub">${dry.length ? dry.reduce((n, g) => n + g.plants, 0) + " plants. Start with the " + dry[0].ind + "." : "All 7 groups are fine."}</div></div>
<div class="sc"><div class="eb" style="color: var(--clay)">Energy</div><div class="big">${e ? e.pct + "%" : "—"}</div><div class="sub">${e ? e.main + "." : ""}</div></div>
<div class="sc"><div class="eb" style="color: var(--blue)">Next up</div><div class="big" style="font-size: 28px">${nx ? nx.summary : "Nothing planned"}</div><div class="sub">${nx ? whenWord(nx.start) : "Send Pik a plan and it shows up here."}</div></div>
</div></div>`;
  }

  // ---------------- illustrated pieces ----------------

  /** Today's energy totals (kWh) from the Powerwall, when configured. */
  private energyToday(): { solar: number; usage: number; imported: number; exported: number; self: number } | null {
    const t = this.C.energy_today;
    if (!t) return null;
    const v = (id?: string) => num(this.S(id));
    const solar = v(t.solar), usage = v(t.usage), imported = v(t.imported), exported = v(t.exported);
    if (solar === null || usage === null) return null;
    const self = usage > 0 && imported !== null ? Math.round(Math.max(0, Math.min(1, (usage - imported) / usage)) * 100) : 0;
    return { solar, usage, imported: imported || 0, exported: exported || 0, self };
  }

  /** Every plant with a photo, and each group's sensor plant. */
  private plantPics(): { all: Array<{ name: string; photo: string; spot: string; notes: string; group: string; room: string }>; sensor: Record<string, string> } {
    const all: Array<{ name: string; photo: string; spot: string; notes: string; group: string; room: string }> = [];
    const sensor: Record<string, string> = {};
    this.plantItems.filter((i) => i.status === "needs_action").forEach((i) => {
      const d = i.description || "";
      const f = (k: string) => { const m = new RegExp("^" + k + ":\\s*(.+)$", "m").exec(d); return m ? m[1].trim() : ""; };
      const g = f("Group"), photo = f("Photo");
      if (f("Sensor") && g) sensor[g] = photo;
      all.push({ name: i.summary.split(" · ")[0], photo, spot: [f("Room"), f("Spot")].filter(Boolean).join(", "), notes: f("Notes"), group: g, room: f("Room") });
    });
    return { all, sensor };
  }

  /** The cellar as wines (same bottle twice = one wine ×2), photo and details from each bottle's notes. */
  private wines(): Wine[] {
    const by: Record<string, Wine> = {};
    this.cellarItems.filter((i) => i.status === "needs_action").forEach((i) => {
      if (by[i.summary]) { by[i.summary].count++; return; }
      const d = i.description || "";
      const f = (k: string) => { const m = new RegExp("^" + k + ":\\s*(.+)$", "m").exec(d); return m ? m[1].trim() : ""; };
      const t = i.summary + " " + f("Grape");
      const kind: "red" | "rose" | "white" = ROSE.test(t) ? "rose" : WHITE.test(t) ? "white" : "red";
      const vm = /\b(19|20)\d\d\b/.exec(i.summary);
      by[i.summary] = { name: i.summary, producer: f("Producer"), vintage: f("Vintage") || (vm ? vm[0] : ""), region: f("Region"), grape: f("Grape"), value: parseFloat(f("Value").replace(/[^0-9.]/g, "")) || 0, image: /^https:\/\//.test(f("Image")) ? f("Image") : "", kind, count: 1 };
    });
    return Object.values(by).sort((a, b) => (a.kind === b.kind ? b.count - a.count || b.value - a.value : a.kind === "red" ? -1 : 1));
  }

  /** The bottle the screen features: the one to drink first, or a different one every few minutes. */
  private featured(ws: Wine[]): Wine | undefined {
    const df = this.drinkFirst();
    const slot = Math.floor(this.now / 240000);
    if (df && slot % 2 === 0) return ws.find((w) => w.name === df) || ws[0];
    return ws.length ? ws[slot % ws.length] : undefined;
  }

  private energyTile(e: Energy): TemplateResult {
    const t = this.energyToday();
    const big = e.solar > 0.1 ? e.solar.toFixed(1) + " kW" : e.out ? "Grid down" : e.pct + "%";
    const lbl = e.solar > 0.1 ? "from the sun" : e.out ? "on the Powerwall" : "in the Powerwall";
    return html`<button type="button" class="tile etile" @click=${() => this.open("energy", () => { this.sheet = "energy"; })}>
<div class="etop"><div style="min-width: 0"><span class="eb">Energy${t ? " · " + t.solar.toFixed(1) + " kWh today" : ""}</span><div class="enum">${big} <small>${lbl}</small></div><div class="esub">${e.main}</div></div>
<div class="egauge">${batteryGauge(e.pct, e.bat > 0.05, 20, 54)}<span>${e.pct}%</span></div></div>
<div class="echart">${energyChart(this.hist, this.now, 300, 86, { noLoad: true, pctLine: true })}</div></button>`;
  }

  /** Sun → home ← Powerwall / grid, as live nodes with moving connectors. */
  private flowRow(e: Energy): TemplateResult {
    const node = (cls: string, icon: TemplateResult, k: string, v: string, s: string) => html`<div class=${"fnode " + cls}><span class="fi">${icon}</span><div><span class="fk">${k}</span><b>${v}</b><span class="fs2">${s}</span></div></div>`;
    const link = (on: boolean, rev: boolean, color: string) => html`<span class=${"flink" + (on ? " on" : "") + (rev ? " rev" : "")} style=${"--fc: " + color}></span>`;
    const sunI = html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"></path></svg>`;
    const homeI = html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9H3z"></path><path d="M10 20v-5h4v5"></path></svg>`;
    const batI = html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="7" y="4" width="10" height="17" rx="2.5"></rect><path d="M10 2h4"></path><rect x="9.5" y=${8 + 10 * (1 - e.pct / 100)} width="5" height=${Math.max(1, 10 * (e.pct / 100))} fill="currentColor" stroke="none"></rect></svg>`;
    const gridI = html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3 7 21M12 3l5 18M8.5 15h7M9.8 10h4.4M5 7h14"></path></svg>`;
    const g = e.grid;
    return html`<div class="flowrow">
${node("fn-sun", sunI, "Solar", e.solar.toFixed(1) + " kW", e.solar > 0.1 ? "producing" : "resting")}
${link(e.solar > 0.1, false, "#FFC861")}
${node("fn-home", homeI, "Home", e.house.toFixed(1) + " kW", "using now")}
${link(Math.abs(e.bat) > 0.05, e.bat < 0, "#8EDB9A")}
${node("fn-bat", batI, "Powerwall", e.pct + "%", e.bat > 0.05 ? "charging " + e.bat.toFixed(1) : e.bat < -0.05 ? "powering home" : "holding")}
${link(g !== null && Math.abs(g) > 0.05, !!g && g < 0, "#8FC2F0")}
${node("fn-grid", gridI, "Grid", g === null ? "Down" : Math.abs(g) < 0.05 ? "Idle" : Math.abs(g).toFixed(1) + " kW", g === null ? "outage" : g > 0.05 ? "selling" : g < -0.05 ? "buying" : "")}
</div>`;
  }

  private energyBig(e: Energy, closeBtn: boolean): TemplateResult {
    const t = this.energyToday();
    return html`<div class="ebig">
<div class="ebhead"><div style="flex: 1; min-width: 0"><div class="kicker" style="color: #9FB0C4">Energy · today</div><div class="h1" style="color: #fff; font-size: 48px">${e.main}.</div><div style="font-size: 18px; color: #C9D3DE; margin-top: 6px">${e.sub}.</div></div>
${closeBtn ? html`<button type="button" class="done" style="color: #fff" @click=${() => { this.sheet = ""; }}>Done</button>` : nothing}</div>
<div class="ebchart">${energyChart(this.hist, this.now, 1100, 300, { big: true })}
<div class="elegend"><span><i style="background: #FFC861"></i>Sun today</span><span><i class="ghost"></i>Yesterday</span><span><i class="dash"></i>House</span><span><i style="background: #8EDB9A"></i>Powerwall</span></div></div>
${this.flowRow(e)}
${t ? html`<div class="chips"><span class="echip"><b>${t.solar.toFixed(1)}</b> kWh from the sun</span><span class="echip"><b>${t.usage.toFixed(1)}</b> kWh used</span><span class="echip"><b>${t.self}%</b> on your own power</span><span class="echip"><b>${t.exported.toFixed(1)}</b> kWh sold back</span></div>` : nothing}
</div>`;
  }

  private plantsTile(): TemplateResult {
    const gs = this.groups(), dry = gs.filter((g) => g.dry);
    return html`<button type="button" class="tile ptile" @click=${() => this.open("plants", () => this.C.plants_path && this.navigate(this.C.plants_path))}>
<svg class="leaves" viewBox="0 0 200 200" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${svg`<g fill="#9FD18B" fill-opacity=".07"><path d="M200 60 C150 70 120 110 130 170 C170 160 200 120 200 60Z"></path><path d="M170 200 C160 150 180 110 230 95 C235 140 215 180 170 200Z"></path><path d="M120 200 C105 165 120 130 160 120 C165 155 150 185 120 200Z"></path></g>`}</svg>
<span class="eb" style=${"position: relative; color: " + (dry.length ? "#FFB27A" : "#A8D99A")}>${dry.length ? "Water: " + dry.map((g) => g.room).join(", ") : "Plants · all happy"}</span>
<div class="prows">${gs.map((g) => html`<div class=${"prow2" + (g.dry ? " dry" : "")}><span class="pi">${plantIcon(g.room, 15, g.dry ? "#FFB27A" : "#A8D99A")}</span><span class="pn">${g.room}</span><span class="pb"><i style=${"width: " + (g.live ? Math.min(100, (g.m / 60) * 100) : 0) + "%"}></i><u style=${"left: " + Math.min(100, (g.thr / 60) * 100) + "%"}></u></span><b>${g.live ? g.m + "%" : "—"}</b></div>`)}</div></button>`;
  }

  private insideTile(): TemplateResult {
    const c = this.S(this.C.thermostat)!;
    const cur = Number(c.attributes.current_temperature), sp = Number(c.attributes.temperature);
    const act = String(c.attributes.hvac_action || "");
    const heat = act === "heating", cool = act === "cooling";
    const out = Number(this.S(this.C.weather)?.attributes.temperature);
    // a 270° dial from 50° to 85°
    const lo = 50, hi = 85, R = 34, cx = 44, cy = 44;
    const ang = (t: number) => (135 + (Math.max(lo, Math.min(hi, t)) - lo) / (hi - lo) * 270) * Math.PI / 180;
    const pt = (t: number, r = R) => [cx + r * Math.cos(ang(t)), cy + r * Math.sin(ang(t))];
    const arc = (t: number) => { const [x0, y0] = pt(lo), [x1, y1] = pt(t); const large = (t - lo) / (hi - lo) * 270 > 180 ? 1 : 0; return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1}`; };
    const nudge = (d: number) => { if (!isFinite(sp)) return; this.log("inside", "tap"); this.svc("climate", "set_temperature", { temperature: Math.round((sp + d) * 2) / 2 }, { entity_id: this.C.thermostat }); };
    const isNum = (x: number) => isFinite(x);
    return html`<div class=${"tile itile" + (heat ? " heat" : cool ? " cool" : "")}>
<span class="eb">Inside</span>
<div class="dialrow">
<button type="button" class="nudge" aria-label="Cooler" @click=${() => nudge(-0.5)}>−</button>
<button type="button" class="dialbtn" @click=${() => this.open("inside", () => this.moreInfo(this.C.thermostat!))} aria-label="Thermostat">
<svg width="118" height="118" viewBox="0 0 88 88" aria-hidden="true">${svg`
<defs><linearGradient id="ig1" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7FB2D9"></stop><stop offset=".55" stop-color="#F0B25E"></stop><stop offset="1" stop-color="#E0643A"></stop></linearGradient></defs>
<path d=${arc(hi)} fill="none" stroke="rgba(255,255,255,.12)" stroke-width="7" stroke-linecap="round"></path>
${isNum(cur) ? svg`<path d=${arc(cur)} fill="none" stroke="url(#ig1)" stroke-width="7" stroke-linecap="round"></path>` : nothing}
${isNum(sp) ? svg`<circle cx=${pt(sp)[0]} cy=${pt(sp)[1]} r="5.5" fill="#fff" stroke="#1B2130" stroke-width="2"></circle>` : nothing}
${heat ? svg`<path d="M44 64 c-5 0 -8 -3 -8 -7 c0 -4 4 -6 5 -10 c3 3 2 5 2 6 c1 -1 2 -3 2 -5 c4 3 7 6 7 9 c0 4 -3 7 -8 7z" fill="#E0643A" transform="translate(8.8 17) scale(.8)"><animate attributeName="opacity" values="1;.6;1" dur="1.2s" repeatCount="indefinite"></animate></path>` : cool ? svg`<path d="M44 52 v16 M37 56 l14 8 M37 64 l14 -8" stroke="#5E95C2" stroke-width="2" stroke-linecap="round"></path>` : nothing}`}</svg>
<span class="dialnum">${isNum(cur) ? Math.round(cur) + "°" : "—"}</span></button>
<button type="button" class="nudge" aria-label="Warmer" @click=${() => nudge(0.5)}>+</button>
</div>
<div class="isub">${heat ? "Heating to " + sp + "°" : cool ? "Cooling to " + sp + "°" : isNum(sp) ? "Set to " + sp + "°" : ""}${isNum(out) ? " · " + Math.round(out) + "° out" : ""}</div>
</div>`;
  }

  private musicTile(): TemplateResult {
    const id = this.C.echo!.media_player!;
    const mp = this.S(id)!;
    const a = mp.attributes;
    const playing = mp.state === "playing", on = playing || mp.state === "paused";
    const art = on && a.entity_picture ? String(a.entity_picture) : "";
    const dur = Number(a.media_duration), pos = Number(a.media_position), upd = Date.parse(String(a.media_position_updated_at || ""));
    const at = isFinite(pos) ? pos + (playing && isFinite(upd) ? (this.now - upd) / 1000 : 0) : NaN;
    const frac = isFinite(dur) && dur > 0 && isFinite(at) ? Math.min(1, at / dur) : 0;
    return html`<div class=${"tile mtile" + (playing ? " playing" : "")}>
${art ? html`<img class="mbg" src=${art} alt="">` : nothing}
<div class="mhead"><span class="eb">${playing ? "Playing" : on ? "Paused" : "Music"}</span>${playing ? html`<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : nothing}</div>
<div class="mrow">${art ? html`<img class="mart" src=${art} alt="">` : html`<svg class="vinyl" width="50" height="50" viewBox="0 0 54 54" aria-hidden="true">${svg`<circle cx="27" cy="27" r="26" fill="#14111C"></circle>${[22, 18, 14].map((r) => svg`<circle cx="27" cy="27" r=${r} fill="none" stroke="#fff" stroke-opacity=".07"></circle>`)}<circle cx="27" cy="27" r="8" fill="#C4703E"></circle><circle cx="27" cy="27" r="1.6" fill="#14111C"></circle><path d="M10 16 A20 20 0 0 1 22 8" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"></path>`}</svg>`}
<div style="min-width: 0"><div class="mtitle">${on ? String(a.media_title || a.media_artist || "Something good") : "Nothing on"}</div>
<div class=${"msub" + (on ? "" : " wrap")}>${on ? String(a.media_artist || a.app_name || "") : this.C.music_device ? "Tap one to start it on the Echo" : "Say “Hey Luna, play…”"}</div></div></div>
${!on && this.C.music_device ? html`<div class="mpicks">${this.musicPicks().map((p) => html`<button type="button" class="mpick" @click=${() => this.playPick(p)}>${p.label}</button>`)}</div>` : nothing}
${on ? html`<div class="mbar2"><i style=${"width: " + frac * 100 + "%"}></i></div>
<div class="mctl"><button type="button" class="rb ink" aria-label=${playing ? "Pause" : "Play"} @click=${() => { this.log("music", "tap"); this.svc("media_player", "media_play_pause", {}, { entity_id: id }); }}>${playing ? html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor"></rect><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor"></rect></svg>` : html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1 L12 7 L3 13 Z" fill="currentColor"></path></svg>`}</button>
<button type="button" class="rb" aria-label="Next" @click=${() => { this.log("music", "tap"); this.svc("media_player", "media_next_track", {}, { entity_id: id }); }}><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1 L10 7 L2 13 Z" fill="currentColor"></path><rect x="10.5" y="1" width="2" height="12" fill="currentColor"></rect></svg></button></div>` : nothing}
</div>`;
  }

  /** Quick picks for the idle music tile: yours from the config, otherwise ones that fit the moment. */
  private musicPicks(): Array<{ label: string; say: string }> {
    if (this.C.music_picks && this.C.music_picks.length) return this.C.music_picks.slice(0, 4);
    const hol = this.holiday();
    const p = this.dayPart;
    const base = p === "morning" ? [["Coffee", "morning coffee jazz"], ["Top hits", "today's top hits"]]
      : p === "midday" ? [["Cooking", "upbeat cooking music"], ["Top hits", "today's top hits"]]
      : p === "evening" ? [["Jazz", "dinner jazz"], ["Soul", "classic soul"]]
      : [["Wind down", "relaxing evening music"], ["Rain", "rain sounds"]];
    const picks = (hol ? [["Holiday", hol.name.toLowerCase() + " dinner music"], ["Cooking", "upbeat cooking music"]] : []).concat(base, [["Chill", "chill music"], ["Throwbacks", "throwback hits"]]);
    const seen = new Set<string>();
    return picks.filter(([l]) => (seen.has(l) ? false : (seen.add(l), true))).slice(0, 4).map(([label, say]) => ({ label, say }));
  }
  private playPick(p: { label: string; say: string }): void {
    if (!this.C.music_device) return;
    this.log("music", "open");
    this.svc("alexa_devices", "send_text_command", { device_id: this.C.music_device, text_command: "play " + p.say });
    this.flash("Asking the Echo to play " + p.say + "…");
  }

  private smokeTile(): TemplateResult {
    const sm = this.C.smoke!;
    const ps = sm.probes.map((id, i) => {
      const e = this.S(id);
      const v = e ? parseFloat(e.state) : NaN;
      const at = (e?.attributes || {}) as Record<string, unknown>;
      const food = String(at.food || this.S("input_text.smoke_probe_" + (i + 1) + "_food")?.state || "");
      return { v, food: food && !["unknown", "unavailable"].includes(food) ? food : "Probe " + (i + 1), kind: String(at.kind || "food"), target: Number(at.target) || 0 };
    }).filter((p) => isFinite(p.v));
    const pit = ps.find((p) => p.kind === "smoker");
    const foods = ps.filter((p) => p.kind !== "smoker");
    const st = this.S("input_datetime.smoke_started");
    const ts = st ? Number(st.attributes.timestamp) : NaN;
    const since = isFinite(ts) && ts > 0 ? ts * 1000 : st && st.state && !["unknown", "unavailable"].includes(st.state) ? Date.parse(st.state.replace(" ", "T")) : NaN;
    const mins = isFinite(since) ? Math.max(0, Math.round((this.now - since) / 60000)) : NaN;
    const elapsed = isFinite(mins) ? (mins >= 60 ? Math.floor(mins / 60) + "h " + (mins % 60) + "m" : mins + "m") : "";
    return html`<button type="button" class="tile stile" @click=${() => this.open("smoker", () => sm.path && this.navigate(sm.path))}>
<svg class="wisps" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">${svg`${[30, 90, 150].map((x, i) => svg`<path d=${`M${x} 210 C${x - 20} 160 ${x + 25} 120 ${x} 70 C${x - 15} 40 ${x + 10} 20 ${x} -10`} fill="none" stroke="#fff" stroke-width=${10 - i * 2} stroke-linecap="round" class=${"wisp w" + i}></path>`)}`}</svg>
<div class="shead2"><span class="eb">Smoker${elapsed ? " · " + elapsed : ""}</span>${pit ? html`<span class="pit" title=${pit.target ? "Smoker set to " + pit.target + "°" : "Smoker"}>${Math.round(pit.v)}° pit</span>` : nothing}</div>
<div class="probes">${foods.length ? foods.slice(0, 3).map((p) => {
      const frac = p.target ? Math.max(0, Math.min(1, (p.v - 40) / (p.target - 40))) : 0;
      const done = p.target > 0 && p.v >= p.target;
      return html`<div class=${"probe" + (done ? " done" : "")}><div class="pl"><span>${p.food}</span><b>${Math.round(p.v)}°</b></div>
${p.target ? html`<div class="pbar"><i style=${"width: " + frac * 100 + "%"}></i></div><div class="pt">${done ? "Done · pull it" : "to " + p.target + "°"}</div>` : nothing}</div>`;
    }) : html`<div class="isub" style="color: #D9CBBE; text-align: left; white-space: normal">${pit ? "Smoker's heating. Plug a probe into the turkey and it shows up here." : "Waiting for the Inkbird"}</div>`}</div></button>`;
  }

  private timersTile(ts: PoolTimer[]): TemplateResult {
    const ring = (t: PoolTimer) => {
      const left = Math.max(0, t.end - this.now);
      const f = t.rang ? 1 : t.total > 0 ? Math.min(1, left / t.total) : 0;
      const r = 20, c = 2 * Math.PI * r;
      return html`<svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">${svg`<circle cx="25" cy="25" r=${r} fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"></circle><circle cx="25" cy="25" r=${r} fill="none" stroke=${t.rang ? "#FF9C6B" : "#F0B25E"} stroke-width="5" stroke-linecap="round" stroke-dasharray=${`${c * f} ${c}`} transform="rotate(-90 25 25)"></circle>`}</svg>`;
    };
    return html`<div class="tile ttile"><span class="eb">Timers · ${ts.length}</span>
<div class="trings">${ts.slice(0, 3).map((t) => html`<button type="button" class=${"tring" + (t.rang ? " rang" : "")} @click=${() => { this.svc("script", "kitchen_timer_stop", { slot: t.id }); this.flash(t.label + (t.rang ? ": got it." : " timer stopped.")); }} aria-label=${t.label + (t.rang ? ", done. Dismiss" : ". Stop")}>
${ring(t)}<div class="tl"><b>${t.rang ? "Done" : this.left(t)}</b><span>${t.label}</span></div></button>`)}</div></div>`;
  }

  private cellarTile(): TemplateResult {
    const ws = this.wines();
    const n = ws.reduce((a, w) => a + w.count, 0);
    const df = this.drinkFirst();
    return html`<button type="button" class="tile wall" @click=${() => this.open("cellar", () => this.C.cellar && this.C.cellar.path && this.navigate(this.C.cellar.path))}>
<div class="minirack">${ws.slice(0, 4).map((w) => niche(w, 96, undefined, w.name === df))}</div>
<div class="wtxt"><span class="eb">Cellar · ${n}</span><div class="sub">${df ? "Drink first: " + df.replace(/^(19|20)\d\d\s+/, "") : this.dayPart === "evening" ? "Something for tonight?" : ws.length + " wines"}</div></div></button>`;
  }

  private hikesTile(): TemplateResult {
    const hs = this.hikes();
    const wkend = this.hikeBoost() >= 2.5 && new Date(this.now).getDay() !== 5 ? "Today's hikes" : "Weekend hikes";
    return html`<div class="tile htile">${ridge()}
<div class="hhead"><span class="eb">${wkend}</span>${hs[0] && hs[0].forecast ? html`<span class="hfc">${hs[0].forecast}</span>` : nothing}</div>
<div class="hrows">${hs.map((h) => html`<button type="button" class="hrow" @click=${() => this.openHike(h)} aria-label=${h.name + ", open in AllTrails"}>
<span class="hkind">${h.kind === "moderate" ? "Moderate" : "Easier"}</span><b>${h.name.replace(/\s+Trail$/i, "")}</b><span class="hst">${this.hikeStats(h)}</span></button>`)}</div></div>`;
  }
  private hikeStory(): TemplateResult {
    const hs = this.hikes();
    const fc = hs[0] && hs[0].forecast;
    return html`<div class="story hikestory">${ridge(true)}
<div class="kicker" style="color: #8A4320">This weekend · AllTrails${fc ? " · " + fc : ""}</div>
<div class="h1" style="font-size: 54px; color: #2B1A12">${hs.length > 1 ? "Two hikes to try" : "A hike to try"}</div>
<div class="hcards">${hs.map((h) => html`<button type="button" class="hcard" @click=${(ev: Event) => { ev.stopPropagation(); this.openHike(h); }}>
<span class="hkind">${h.kind === "moderate" ? "Moderate" : "Easier"}</span><div class="hname">${h.name}</div><div class="hst">${this.hikeStats(h)}</div>${h.why ? html`<div class="hwhy">${h.why}</div>` : nothing}<span class="hgo">Open in AllTrails ›</span></button>`)}</div></div>`;
  }

  private energyStory(): TemplateResult {
    const e = this.energy();
    if (!e) return html``;
    return html`<div class="story" style="padding: 40px 56px 0">${this.energyBig(e, false)}</div>`;
  }
  private plantStory(): TemplateResult {
    const gs = this.groups();
    const dry = gs.filter((g) => g.dry);
    const live = gs.filter((g) => g.live);
    const focus = dry[0] || live.slice().sort((a, b) => (a.m - a.thr) - (b.m - b.thr))[0];
    const names = focus ? this.plantPics().all.filter((p) => p.group === focus.room).map((p) => p.name) : [];
    return html`<div class="story" style="flex-direction: row; gap: 48px; align-items: stretch">
<div style="width: 380px; flex: none; display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; padding-top: 10px">
${focus ? html`${groupRing(focus, 260)}<div class="bigpct">${focus.m}%<small> soil moisture</small></div>
<div><div class="kicker" style=${"color: " + (focus.dry ? "#C2671F" : "var(--green)")}>${focus.dry ? "Thirstiest right now" : "Next to need water"}</div>
<div class="h1" style="font-size: 44px">${focus.room}</div>
<div style="font-size: 16px; color: var(--mute2); margin-top: 6px">${focus.dry ? focus.plants + " plants. Start with the " + focus.ind + "." : (focus.m - focus.thr) + " points above its thirst line. The " + focus.ind + " tells you first."}</div></div>` : nothing}
</div>
<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 22px">
<div class="h1" style="font-size: 50px">${dry.length ? dry.map((g) => g.room).join(" and ") + (dry.length === 1 ? " needs" : " need") + " water." : "Everyone's happy. No watering today."}</div>
<div class="ringgrid">${gs.map((g) => html`<div class="gcell">${groupRing(g, 110)}<b>${g.room}</b><span class=${g.dry ? "hot" : ""}>${g.live ? g.m + "%" : "—"}</span></div>`)}</div>
${focus && focus.dry && names.length ? html`<div class="glass" style="padding: 16px 20px"><div class="eb" style="margin-bottom: 10px">The ${focus.room.toLowerCase()} route · ${names.length} plants</div><div class="namechips">${names.slice(0, 14).map((n) => html`<span>${n}</span>`)}</div></div>` : nothing}
</div></div>`;
  }
  private cellarStory(): TemplateResult {
    const ws = this.wines();
    const n = ws.reduce((a, w) => a + w.count, 0);
    const value = ws.reduce((a, w) => a + w.value * w.count, 0);
    const f = this.featured(ws);
    const df = this.drinkFirst();
    return html`<div class="story dark-s winestory">
<div class="wfeat">${f ? html`<div class="wbig">${niche(f, 360, undefined, f.name === df)}</div>
<div class="kicker" style="color: #E2A6A0">${f.name === df ? "Drink this one first" : "From your cellar"}</div>
<div class="h1" style="font-size: 40px">${f.name}</div>
<div class="wmeta">${[f.producer, f.region, f.grape].filter(Boolean).join(" · ")}${f.value ? html`<br><b>$${Math.round(f.value)}</b> a bottle` : nothing}${f.count > 1 ? " · " + f.count + " on hand" : ""}</div>` : nothing}</div>
<div class="wright">
<div class="kicker" style="color: #E2A6A0">The cellar · ${n} bottles${value ? " · about $" + Math.round(value).toLocaleString() : ""}</div>
<div class="rack">${ws.slice(0, 12).map((w) => niche(w, 250, undefined, w.name === df))}</div>
</div></div>`;
  }

  private pikStory(f: FeedRow): TemplateResult {
    const p = this.person(f.who);
    return html`<div class="story" style="justify-content: center">
<div style="display: flex; align-items: center; gap: 18px"><div class="av" style=${"width: 64px; height: 64px; font-size: 24px; background: " + (p ? p.color : "#7A6C5E")}>${p ? p.name[0] : "P"}</div>
<div class="kicker" style="color: var(--clay)">From ${p ? p.name + "'s" : "your"} Pik · ${ago(f.at)}</div></div>
<div class="h1" style="font-size: 64px">${f.title}</div>
${f.detail ? html`<div style="font-size: 22px; color: var(--mute2); max-width: 900px; line-height: 1.4">${f.detail}</div>` : nothing}
</div>`;
  }

  private nightStory(): TemplateResult {
    const d = new Date(this.now);
    const lightsOn = (this.C.lights || []).reduce((n, g) => n + g.entities.filter((id) => this.S(id)?.state === "on").length, 0);
    const e = this.energy();
    const tm = new Date(this.now + 864e5); tm.setHours(0, 0, 0, 0);
    const first = this.calEvents.find((ev) => startMs(ev) >= tm.getTime() && startMs(ev) < tm.getTime() + 864e5);
    const away = (this.C.people || []).filter((p) => this.S(p.person)?.state !== "home");
    return html`<div class="story" style="color: #DCD8EC; justify-content: space-between; padding-bottom: 40px">
<div style="display: flex; justify-content: space-between; align-items: flex-start"><div><div class="serif" style="font-size: 150px; line-height: .85">${hm(d)}</div>
<div style="font-size: 17px; color: #9FA6C8; margin-top: 16px">${d.toLocaleDateString([], { weekday: "long" })} · ${this.outTemp()} ${this.wxWord().toLowerCase()}${this.hi !== null ? " · Tomorrow up to " + this.hi + "°" : ""}</div></div>
<div class="pik p-rest mini" style="opacity: .55; width: 130px; height: 130px">${pikArt("Pik")}</div></div>
<div style="display: flex; flex-direction: column; gap: 6px; font-size: 18px; color: #C9CCE0">
<div class="eb" style="color: #8C93B8; margin-bottom: 6px">Tucked in</div>
<div>${lightsOn ? "• " + lightsOn + (lightsOn === 1 ? " light" : " lights") + " still on" : "✓ Lights off"}</div>
${e ? html`<div>✓ Powerwall ${e.pct}%${e.hours ? ", about " + e.hours + " hours at this rate" : ""}</div>` : nothing}
${this.low !== null && this.low <= 32 ? html`<div>• Freeze tonight, ${this.low}°</div>` : nothing}
${away.length ? html`<div>• ${away.map((p) => p.name).join(" and ")} ${away.length > 1 ? "are" : "is"} out</div>` : html`<div>✓ You're both home</div>`}
${first ? html`<div style="color: #F0B25E">• Tomorrow ${/T/.test(first.start) ? hmA(new Date(startMs(first))) : ""} · ${first.summary}</div>` : nothing}
</div></div>`;
  }

  // ---------------- home ----------------

  private outTemp(): string {
    const w = this.S(this.C.weather);
    const t = w ? (w.attributes.temperature as number | undefined) : undefined;
    return typeof t === "number" ? Math.round(t) + "°" : "—";
  }
  private wxWord(): string { const w = this.S(this.C.weather); return w ? condWord(w.state) : ""; }

  private tiles(): Array<{ id: string; fr: string; body: () => TemplateResult }> {
    const timers = this.H ? poolTimers(this.H, this.C.timers || 12) : [];
    const e = this.energy();
    const dry = this.groups().filter((g) => g.dry);
    const mp = this.C.echo && this.S(this.C.echo.media_player);
    const playing = !!mp && mp.state === "playing";
    const smokeOn = !!this.C.smoke && this.S(this.C.smoke.active)?.state === "on";
    const cand = [
      { id: "timers", topic: "timers" as Topic, score: timers.length ? 100 : -99, fr: "1.2fr", body: () => this.timersTile(timers) },
      { id: "smoker", topic: "smoker" as Topic, score: smokeOn ? this.rank("smoker", 60) : -99, fr: "1.2fr", body: () => this.smokeTile() },
      { id: "energy", topic: "energy" as Topic, score: e ? this.rank("energy", 2 + (e.out ? 6 : 0)) : -99, fr: "1.6fr", body: () => this.energyTile(e!) },
      { id: "plants", topic: "plants" as Topic, score: this.groups().length ? this.rank("plants", 1.5 + (dry.length ? 3 : 0)) : -99, fr: "1.4fr", body: () => this.plantsTile() },
      { id: "inside", topic: "inside" as Topic, score: this.S(this.C.thermostat) ? this.rank("inside", 1.2) : -99, fr: "1.1fr", body: () => this.insideTile() },
      { id: "music", topic: "music" as Topic, score: mp ? this.rank("music", 1 + (playing ? 2.5 : 0)) : -99, fr: "1.1fr", body: () => this.musicTile() },
      { id: "cellar", topic: "cellar" as Topic, score: this.cellarItems.length ? this.rank("cellar", 1 + (this.dayPart === "evening" ? 1 : 0)) : -99, fr: "1.4fr", body: () => this.cellarTile() },
      { id: "hikes", topic: "hikes" as Topic, score: this.hikes().length ? this.rank("hikes", 0.9 + this.hikeBoost()) : -99, fr: "1.4fr", body: () => this.hikesTile() },
    ];
    const order = cand.map((c) => c.id);
    const pick = cand.filter((c) => c.score > -50).sort((a, b) => b.score - a.score).slice(0, 5);
    return pick.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }

  private homeLayer(): TemplateResult {
    const d = new Date(this.now);
    const people = this.C.people || [];
    const today = this.today();
    const feed = this.feed().filter((f) => f.cat !== "package").slice(0, 5);
    const tiles = this.tiles();
    const talking = !!this.talk || !!(this.a && this._t3);
    const pages = this.pages(this.a), ci = Math.min(this.capIdx, pages.length - 1);
    const line = talking ? (this.talk === "listen" ? "I'm listening…" : this.talk === "think" ? "Let me think…" : pages[ci] || "") : this.headline();
    const sz = line.length > 130 ? " s3" : line.length > 80 ? " s2" : "";
    const pikCls = this.muted ? "p-muted" : this.talk ? "p-" + this.talk : "p-rest";
    const sug = this.rules().filter((r) => r.state === "suggested").length;
    const v = this.V;
    return html`<div class="home">
<div class="left">
<div class="clock"><b>${hm(d)}</b><span>${d.toLocaleTimeString([], { hour: "numeric" }).replace(/^\d+\s?/, "")} · ${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span></div>
<div class="wxl">${this.outTemp()} ${this.wxWord().toLowerCase()}${this.hi !== null ? ", high of " + this.hi : ""}${this.S(this.C.thermostat) ? " · " + Math.round(Number(this.S(this.C.thermostat)!.attributes.current_temperature || 0)) + "° inside" : ""}</div>
<button type="button" class=${"pikbtn pik " + pikCls} aria-label="Talk to Pik" @click=${() => this.tapPik()}>${pikArt("Pik")}</button>
<div class="bubble" aria-live="polite">
<div class="who"><span>${talking ? "You asked" : "Pik"}</span>${talking && pages.length > 1 ? html`<span class="cdots">${pages.map((_p, k) => html`<i class=${k === ci ? "on" : ""}></i>`)}</span>` : nothing}</div>
${talking && this.q ? html`<div class="q">“${this.q}”</div>` : nothing}
<div class=${"line" + sz}>${line}</div>
</div>
<div class="leftfoot">
${v ? html`<button type="button" class=${"chip" + (this.muted ? " on" : "")} aria-pressed=${this.muted ? "true" : "false"} @click=${() => this.toggleMic()}>${this.muted ? "Mic off" : "Mic on"}</button>` : nothing}
<button type="button" class="chip" @click=${() => { this.sheet = "notes"; this.requestUpdate(); }}>Pik's notes${sug ? html` <b style="color: var(--clay)">· ${sug} new</b>` : nothing}</button>
</div>
</div>
<div class="main">
<div class="us">${people.map((p) => {
      const st = this.S(p.person);
      const where = !st ? "" : st.state === "home" ? "home" : st.state === "not_home" ? "out" : st.state;
      const nx = this.nextFor(p.key);
      return html`<button type="button" class="person" @click=${() => this.moreInfo(p.person)}>
<div class="av" style=${"background: " + p.color}>${p.name[0]}<span class="dot" style=${"background: " + (where === "home" ? "#6FBF73" : "#C9BBA8")}></span></div>
<div style="min-width: 0"><b>${p.name}${where ? " · " + where : ""}</b><span>${nx ? "Next: " + nx.summary + " · " + whenWord(nx.start) : "Nothing else on the calendar"}</span></div></button>`;
    })}</div>
<div class="panel">
<div class="phead"><span class="eb">Today, together</span><span class="legend">${people.map((p) => html`<i style=${"background: " + p.color}></i>${p.name}`)}<i style="background: #5E8A5A"></i>Both</span></div>
<div class="rows">${today.length ? repeat(today, (r) => r.key, (r) => html`<button type="button" class=${"row" + (r.past ? " past" : "")} @click=${() => r.tap && r.tap()}>
<span class="t">${r.t}${r.tsub ? html`<small>${r.tsub}</small>` : nothing}</span><span class="c" style=${"background: " + r.color}></span><span class="w">${r.what}</span><span class="n">${r.note}</span></button>`)
      : nothing}${today.length < 4 ? html`<div class="empty" style="border-top: 1px solid var(--line2)">${today.length ? "That's everything today." : "Nothing on the calendar today."} Send either Pik a plan, a screenshot or a booking and it lands here for both of you.</div>` : nothing}</div>
</div>
<div class="panel">
<div class="phead"><span class="eb">From your Piks</span></div>
<div class="rows">${feed.length ? repeat(feed, (f) => f.uid, (f) => {
      const p = this.person(f.who);
      return html`<div class=${"fitem" + (f.urgent ? " urgent" : "")}>
${p ? html`<div class="av sm" style=${"background: " + p.color}>${p.name[0]}</div>` : html`<div class="av sm house" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9H3z"></path></svg></div>`}
<button type="button" class="fb" @click=${f.primary}><div class="ft">${f.title}</div><div class="fs">${[p ? p.name + "'s Pik" : f.label, f.at ? ago(f.at) : "", !p && f.detail ? f.detail : ""].filter(Boolean).join(" · ")}</div></button>
<button type="button" class="fx" aria-label=${f.secLabel} @click=${f.secondary}>×</button></div>`;
    }) : html`<div class="empty">Nothing waiting. When either of you tells your Pik something for the house, it shows up here.</div>`}</div>
</div>
</div>
<div class="tiles" style=${"grid-template-columns: " + tiles.map((t) => t.fr).join(" ")}>${tiles.map((t) => t.body())}</div>
</div>`;
  }

  private energySheet(): TemplateResult {
    const e = this.energy();
    return html`<div class="scrim" @click=${() => { this.sheet = ""; }}></div><div class="sheet darkx esheet">${e ? this.energyBig(e, true) : html`<div class="shtop"><h2>Energy</h2><button type="button" class="done" @click=${() => { this.sheet = ""; }}>Done</button></div><div class="empty" style="color: #fff">The Powerwall isn't reporting right now.</div>`}</div>`;
  }
  private notesSheet(): TemplateResult {
    const rs = this.rules();
    const on = rs.filter((r) => r.state === "on"), sug = rs.filter((r) => r.state === "suggested");
    const s = (this.S(this.C.learning)?.attributes.scores || {}) as Record<string, number>;
    const tops = Object.keys(s).filter((k) => k.indexOf("@") < 0 && TOPIC_NAME[k]).map((k) => ({ k, v: s[k] })).sort((a, b) => b.v - a.v);
    const max = Math.max(1, ...tops.map((t) => Math.abs(t.v)));
    const rm = (r: Rule) => { this.svc("todo", "remove_item", { item: r.uid }, { entity_id: this.C.rules }); this.flash("Okay, that rule's gone."); };
    const keep = (r: Rule) => { const j = Object.assign({}, parseDesc(this.ruleItems.find((i) => i.uid === r.uid)?.description) as Record<string, unknown>, { state: "on", by: this.whoHere() }); this.svc("todo", "update_item", { item: r.uid, description: JSON.stringify(j) }, { entity_id: this.C.rules }); this.flash("Done. The screen will follow that."); };
    return html`<div class="scrim" @click=${() => { this.sheet = ""; }}></div><div class="sheet">
<div class="shtop"><h2>Pik's notes</h2><button type="button" class="done" @click=${() => { this.sheet = ""; }}>Done</button></div>
<div style="display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 34px; flex: 1; min-height: 0">
<div style="overflow: auto; min-height: 0">
${sug.length ? html`<div class="eb" style="color: var(--clay)">Pik suggests</div>${sug.map((r) => html`<div class="rule"><div class="rw">${r.words}${r.why ? html`<small>${r.why}</small>` : nothing}</div><button type="button" class="chip on" @click=${() => keep(r)}>Yes</button><button type="button" class="chip" @click=${() => rm(r)}>No thanks</button></div>`)}<div style="height: 18px"></div>` : nothing}
<div class="eb">Rules you've given me</div>
${on.length ? on.map((r) => html`<div class="rule"><div class="rw">${r.words}<small>${[r.by ? "From " + r.by[0].toUpperCase() + r.by.slice(1) : "", r.until ? "until " + new Date(Date.parse(r.until)).toLocaleDateString([], { month: "short", day: "numeric" }) : ""].filter(Boolean).join(" · ")}</small></div><button type="button" class="chip" @click=${() => rm(r)}>Remove</button></div>`)
      : html`<div class="empty">None yet. Tell me, like “Hey Luna, show less wine stuff in the morning” or “always show the doorbell at night.”</div>`}
</div>
<div><div class="eb">What I've noticed</div>
<p style="font-size: 15px; color: var(--mute2); line-height: 1.5; margin: 8px 0 14px">What you two tap and open moves up; what you clear or skip moves down. Old habits fade after a couple of weeks. The doorbell, time to go and timers always break through.</p>
${tops.length ? html`<div class="bars">${tops.slice(0, 8).map((t) => html`<div class="lbar"><span>${TOPIC_NAME[t.k]}</span><span class="tk"><i style=${"left: 50%; width: " + (Math.abs(t.v) / max) * 50 + "%; background: " + (t.v >= 0 ? "#5E8A5A" : "#E39B4B") + (t.v < 0 ? "; left: " + (50 - (Math.abs(t.v) / max) * 50) + "%" : "")}></i></span><span style="color: var(--mute); text-align: right">${t.v >= 0 ? "more" : "less"}</span></div>`)}</div>`
      : html`<div class="empty">Still learning. Give it a week or two of use.</div>`}
</div></div></div>`;
  }

  // ---------------- phone ----------------

  /** A moment on the phone: a banner at the top instead of taking over the screen. */
  private banner(m: Moment): TemplateResult {
    const now = this.now;
    if (m.kind === "leave") {
      const lv = this.leaveInfo()!;
      const mins = Math.max(0, Math.ceil((lv.at - now) / 60000));
      return html`<div class="ban navy"><div class="bk">Time to go</div><div class="bt">${mins > 0 ? "Leave at " + hmA(new Date(lv.at)) + " · " + mins + " min" : "Time to head out"}</div><div class="bs">${lv.t}${lv.drive ? " · " + lv.drive + " drive" : ""}</div>
<div class="bb"><button type="button" class="pill sun" @click=${() => { this.svcSay("script", (this.C.leaving_script || "script.pik_leaving").replace("script.", "")); this.hide(m.key); }}>We're leaving</button><button type="button" class="pill ghost" @click=${() => this.dismissMoment(m, 5 * 60000)}>5 more min</button></div></div>`;
    }
    if (m.kind === "doorbell") {
      const rg = this.C.ring!;
      const cam = this.S(rg.camera);
      const pic = cam && cam.attributes.entity_picture ? String(cam.attributes.entity_picture) + "&t=" + Math.floor(now / 2000) : "";
      return html`<div class="ban ring"><div class="bk">${rg.name || "Doorbell"} · ${hmA(new Date(Date.parse(this.S(rg.ding)!.state)))}</div><div class="bt">Someone's at the ${(rg.name || "door").toLowerCase()}</div>
${pic ? html`<img class="bimg" src=${pic} alt="Live view" @click=${() => this.moreInfo(rg.camera)}>` : nothing}
<div class="bb">${rg.light ? html`<button type="button" class="pill sun" @click=${() => this.svc("light", "toggle", {}, { entity_id: rg.light })}>Light ${this.S(rg.light)?.state === "on" ? "off" : "on"}</button>` : nothing}<button type="button" class="pill ghost" @click=${() => this.dismissMoment(m)}>Done</button></div></div>`;
    }
    if (m.kind === "timer") {
      const t = poolTimers(this.H, this.C.timers || 12).find((y) => m.key === "timer-" + y.id + "-" + y.end);
      return html`<div class="ban paper"><div class="bk">Timer done</div><div class="bt">${t ? t.label : "Timer"}</div>
<div class="bb"><button type="button" class="pill ink" @click=${() => { if (t) this.svc("script", "kitchen_timer_stop", { slot: t.id }); this.hide(m.key); }}>Got it</button><button type="button" class="pill ghost" @click=${() => { if (t) this.svc("script", "kitchen_timer_add5", { slot: t.id }); this.hide(m.key); }}>+5 min</button></div></div>`;
    }
    if (m.kind === "storm") {
      const st = this.C.storm!;
      const w = st.watch ? this.S(st.watch) : undefined;
      return html`<div class="ban storm"><div class="bk">Weather alert</div><div class="bt">${this.S(st.alert)?.state}</div><div class="bs">Storm Watch is ${w && w.state === "on" ? "on" : "off"}${this.energy() ? " · Powerwall " + this.energy()!.pct + "%" : ""}</div>
<div class="bb">${w && w.state !== "on" ? html`<button type="button" class="pill sun" @click=${() => this.svc("switch", "turn_on", {}, { entity_id: st.watch })}>Turn on Storm Watch</button>` : nothing}<button type="button" class="pill ghost" @click=${() => this.dismissMoment(m)}>Got it</button></div></div>`;
    }
    const ck = this.cook as { due_now?: Array<{ id: string; when: string; task: string }> };
    const due = (ck.due_now || [])[0];
    const hol = this.holiday();
    return html`<div class="ban paper"><div class="bk">${hol ? hol.name : "Cooking"} · due ${due.when.replace(/^\w+ /, "").replace(/ \(moved.*\)/, "")}</div><div class="bt" style="font-size: 22px">${due.task}</div>
<div class="bb"><button type="button" class="pill ink" @click=${() => { this.svc("script", (this.C.cooking!.done_script || "script.holiday_task_done").replace("script.", ""), { task: due.id }); this.hide(m.key); this.cookAt = 0; }}>Done</button>${hol ? html`<button type="button" class="pill ghost" @click=${() => this.navigate(hol.path)}>Open the plan</button>` : nothing}<button type="button" class="pill ghost" @click=${() => this.dismissMoment(m, 10 * 60000)}>Later</button></div></div>`;
  }

  /** Light groups with one tap each: off if anything's on, otherwise on. */
  private lightsTile(): TemplateResult {
    const gs = (this.C.lights || []).map((g) => ({ name: g.name, on: g.entities.filter((id) => this.S(id)?.state === "on").length }));
    const open = (room: string) => { this.log("inside", "open"); this.lightsRoom = room; this.sheet = "lights"; this.requestUpdate(); };
    return html`<div class="tile lightsT">
<button type="button" class="lhead" @click=${() => open("")}><span class="eb">Lights · ${gs.reduce((a, g) => a + g.on, 0)} on</span><span class="lall">All lights ›</span></button>
<div class="lgrid">${gs.map((g) => html`<button type="button" class=${"lg" + (g.on ? " on" : "")} @click=${() => open(g.name)}><b>${g.name}</b><span>${g.on ? g.on + " on" : "off"}</span></button>`)}</div></div>`;
  }

  /** Every light, room by room: tap a light to switch it, slide to dim it. */
  private lightsSheet(): TemplateResult {
    const rooms = (this.C.lights || []).map((g) => ({ name: g.name, ids: g.entities.filter((id) => this.S(id)) }));
    const strip = (name: string, room: string) => {
      const n = name.replace(new RegExp("^" + room.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "").trim();
      return n ? n[0].toUpperCase() + n.slice(1) : name;
    };
    const dimmable = (e: HState) => { const m = (e.attributes.supported_color_modes || []) as string[]; return e.entity_id.startsWith("light.") && m.length > 0 && !(m.length === 1 && m[0] === "onoff"); };
    const close = () => { this.sheet = ""; this.lightsRoom = ""; };
    const anyOn = rooms.some((r) => r.ids.some((id) => this.S(id)?.state === "on"));
    window.setTimeout(() => {
      if (!this.lightsRoom) return;
      const el = this.renderRoot.querySelector("[data-room=\"" + this.lightsRoom + "\"]") as HTMLElement | null;
      const box = this.renderRoot.querySelector(".lrooms") as HTMLElement | null;
      if (el && box && !el.dataset.scrolled) { el.dataset.scrolled = "1"; box.scrollTop = el.offsetTop - box.offsetTop; }
    }, 50);
    return html`<div class="scrim" @click=${close}></div><div class="sheet lsheet">
<div class="shtop"><h2>Lights</h2>${anyOn ? html`<button type="button" class="chip" @click=${() => { rooms.forEach((r) => r.ids.filter((id) => this.S(id)?.state === "on").forEach((id) => this.svc(id.split(".")[0], "turn_off", {}, { entity_id: id }))); this.flash("Turning everything off."); }}>All off</button>` : nothing}<button type="button" class="done" @click=${close}>Done</button></div>
<div class="lrooms">${rooms.map((r) => {
      const on = r.ids.filter((id) => this.S(id)?.state === "on").length;
      return html`<section class="lroom" data-room=${r.name}>
<div class="lrh"><b>${r.name}</b><span>${on ? on + " on" : "all off"}</span><button type="button" class="chip" @click=${() => r.ids.forEach((id) => this.svc(id.split(".")[0], on ? "turn_off" : "turn_on", {}, { entity_id: id }))}>${on ? "Room off" : "Room on"}</button></div>
${r.ids.map((id) => {
        const e = this.S(id)!;
        const isOn = e.state === "on";
        const pct = isOn && typeof e.attributes.brightness === "number" ? Math.round((Number(e.attributes.brightness) / 255) * 100) : 0;
        const name = strip(String(e.attributes.friendly_name || id), r.name);
        return html`<div class=${"lrow" + (isOn ? " on" : "") + (e.state === "unavailable" ? " na" : "")}>
<button type="button" class="ltog" role="switch" aria-checked=${isOn ? "true" : "false"} aria-label=${name} @click=${() => { this.log("inside", "tap"); this.svc(id.split(".")[0], "toggle", {}, { entity_id: id }); }}>
<span class="lbulb"></span><span class="lname">${name}</span><span class="lstate">${e.state === "unavailable" ? "offline" : isOn ? (pct ? pct + "%" : "on") : "off"}</span><span class="sw"><i></i></span></button>
${dimmable(e) && isOn ? html`<input class="ldim" type="range" min="1" max="100" .value=${String(pct || 100)} aria-label=${name + " brightness"} @change=${(ev: Event) => this.svc("light", "turn_on", { brightness_pct: Number((ev.target as HTMLInputElement).value) }, { entity_id: id })}>` : nothing}
</div>`;
      })}</section>`;
    })}</div></div>`;
  }

  private phoneLayer(): TemplateResult {
    const d = new Date(this.now);
    const people = this.C.people || [];
    const today = this.today();
    const feed = this.feed().filter((f) => f.cat !== "package").slice(0, 6);
    const moms = this.moments();
    const e = this.energy();
    const timers = poolTimers(this.H, this.C.timers || 12);
    const mp = this.C.echo && this.S(this.C.echo.media_player);
    const smokeOn = !!this.C.smoke && this.S(this.C.smoke.active)?.state === "on";
    // the swipe row: the same ranking as the kitchen tiles, plus lights
    const cards: Array<{ id: string; score: number; body: () => TemplateResult }> = [
      { id: "timers", score: timers.length ? 100 : -99, body: () => this.timersTile(timers) },
      { id: "smoker", score: smokeOn ? this.rank("smoker", 60) : -99, body: () => this.smokeTile() },
      { id: "energy", score: e ? this.rank("energy", 2 + (e.out ? 6 : 0)) : -99, body: () => this.energyTile(e!) },
      { id: "plants", score: this.groups().length ? this.rank("plants", 1.5 + (this.groups().some((g) => g.dry) ? 3 : 0)) : -99, body: () => this.plantsTile() },
      { id: "cellar", score: this.cellarItems.length ? this.rank("cellar", 1 + (this.dayPart === "evening" ? 1 : 0)) : -99, body: () => this.cellarTile() },
      { id: "hikes", score: this.hikes().length ? this.rank("hikes", 0.9 + this.hikeBoost()) : -99, body: () => this.hikesTile() },
      { id: "lights", score: (this.C.lights || []).length ? this.rank("inside", 1.4) : -99, body: () => this.lightsTile() },
      { id: "inside", score: this.S(this.C.thermostat) ? this.rank("inside", 1.2) : -99, body: () => this.insideTile() },
      { id: "music", score: mp ? this.rank("music", 1 + (mp.state === "playing" ? 2.5 : 0)) : -99, body: () => this.musicTile() },
    ];
    const row = cards.filter((c) => c.score > -50).sort((a, b) => b.score - a.score);
    const sug = this.rules().filter((r) => r.state === "suggested").length;
    return html`<div class="phonewrap">
<div class="ph-top">
<div class="pik p-rest mini" style="width: 64px; height: 64px; flex: none">${pikArt("Pik")}</div>
<div style="min-width: 0"><div class="ph-clock">${hm(d)} <span>${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span></div>
<div class="wxl">${this.outTemp()} ${this.wxWord().toLowerCase()}${this.hi !== null ? ", high " + this.hi : ""}${this.S(this.C.thermostat) ? " · " + Math.round(Number(this.S(this.C.thermostat)!.attributes.current_temperature || 0)) + "° inside" : ""}</div></div>
</div>
<div class="bubble ph-bub"><div class="who"><span>Pik</span></div><div class="line">${this.headline()}</div></div>
${moms.map((m) => this.banner(m))}
<div class="us ph-us">${people.map((p) => {
      const st = this.S(p.person);
      const where = !st ? "" : st.state === "home" ? "home" : st.state === "not_home" ? "out" : st.state;
      const nx = this.nextFor(p.key);
      return html`<button type="button" class="person" @click=${() => this.moreInfo(p.person)}>
<div class="av" style=${"background: " + p.color}>${p.name[0]}<span class="dot" style=${"background: " + (where === "home" ? "#6FBF73" : "#C9BBA8")}></span></div>
<div style="min-width: 0"><b>${p.name}${where ? " · " + where : ""}</b><span>${nx ? nx.summary + " · " + whenWord(nx.start) : "Nothing else planned"}</span></div></button>`;
    })}</div>
<div class="ph-row">${row.map((c) => html`<div class="ph-card">${c.body()}</div>`)}</div>
<div class="panel">
<div class="phead"><span class="eb">Today, together</span></div>
${today.map((r) => html`<button type="button" class="row" @click=${() => r.tap && r.tap()}><span class="t">${r.t}${r.tsub ? html`<small>${r.tsub}</small>` : nothing}</span><span class="c" style=${"background: " + r.color}></span><span class="w">${r.what}</span></button>`)}
${today.length < 3 ? html`<div class="empty" style="border-top: 1px solid var(--line2)">${today.length ? "That's everything today." : "Nothing on the calendar today."} Send either Pik a plan and it lands here for both of you.</div>` : nothing}
</div>
<div class="panel">
<div class="phead"><span class="eb">From your Piks</span></div>
${feed.length ? repeat(feed, (f) => f.uid, (f) => {
      const p = this.person(f.who);
      return html`<div class=${"fitem" + (f.urgent ? " urgent" : "")}>
${p ? html`<div class="av sm" style=${"background: " + p.color}>${p.name[0]}</div>` : html`<div class="av sm house" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9H3z"></path></svg></div>`}
<button type="button" class="fb" @click=${f.primary}><div class="ft">${f.title}</div><div class="fs">${[p ? p.name + "'s Pik" : f.label, f.at ? ago(f.at) : ""].filter(Boolean).join(" · ")}</div></button>
<button type="button" class="fx" aria-label=${f.secLabel} @click=${f.secondary}>×</button></div>`;
    }) : html`<div class="empty">Nothing waiting right now.</div>`}
</div>
<div style="display: flex; justify-content: center; padding: 4px 0 18px"><button type="button" class="chip" @click=${() => { this.sheet = "notes"; this.requestUpdate(); }}>Pik's notes${sug ? html` <b style="color: var(--clay)">· ${sug} new</b>` : nothing}</button></div>
</div>`;
  }

  render() {
    if (this.narrow && this.H) return html`<div class="root phone">${this.phoneLayer()}
${this.sheet === "energy" ? this.energySheet() : nothing}
${this.sheet === "notes" ? this.notesSheet() : nothing}
${this.sheet === "lights" ? this.lightsSheet() : nothing}
${this.toast ? html`<div class="toast" role="status">${this.toast}</div>` : nothing}</div>`;
    if (!this.H) return html`<div class="root"><div class="empty" style="padding: 60px">Waiting for Home Assistant…</div></div>`;
    const moms = this.moments();
    const m = moms[0];
    let body: TemplateResult;
    if (m) body = m.body();
    else if (this.layer === "ambient") {
      const list = this.stories();
      if (!list.length) body = this.homeLayer();
      else {
        const i = this.storyIdx % list.length;
        const s = list[i];
        const dark = ["energy", "cellar", "night", "trail"].includes(s.theme);
        const BG: Record<string, string> = { morning: "linear-gradient(180deg, #F7E3C8 0%, #F3EADD 70%)", energy: "#0F1720", garden: "#EEF0E4", cellar: "radial-gradient(ellipse at 70% 30%, #4A2A22 0%, #2B1A16 55%, #1C110E 100%)", night: "radial-gradient(ellipse at 30% 20%, #26305A 0%, #1B2240 45%, #121730 100%)", trail: "linear-gradient(180deg, #F2C48D 0%, #D98E5B 38%, #6E5A6B 70%, #2E3340 100%)" };
        body = html`<div class="amb" style=${"background: " + (BG[s.theme] || "#F3EADD")} @click=${() => this.wake()}>${s.render()}${s.id !== "night" ? this.sfoot(list, i, dark) : nothing}</div>`;
      }
    } else body = this.homeLayer();
    return html`<div class="root" @pointerdown=${() => { this.touched = Date.now(); }}>
${body}
${m ? html`<button type="button" class=${"mexit" + (["leave", "storm", "doorbell"].includes(m.kind) ? " light" : "")} @click=${() => this.dismissMoment(m)} aria-label="Back to home">Home <span aria-hidden="true">×</span></button>` : nothing}
${m && m.kind !== "cooking" ? this.voiceBubble() : nothing}
${!m && this.sheet === "energy" ? this.energySheet() : nothing}
${!m && this.sheet === "notes" ? this.notesSheet() : nothing}
${!m && this.sheet === "lights" ? this.lightsSheet() : nothing}
${this.toast ? html`<div class="toast" role="status">${this.toast}</div>` : nothing}
</div>`;
  }
}

function loadFonts(): void {
  if (document.querySelector("link[data-pik-home-fonts]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONTS;
  link.dataset.pikHomeFonts = "";
  document.head.appendChild(link);
}

if (!customElements.get("pik-home-card")) {
  customElements.define("pik-home-card", PikHomeCard);
  const w = window as unknown as { customCards?: Array<Record<string, unknown>> };
  w.customCards = w.customCards || [];
  w.customCards.push({ type: "pik-home-card", name: "Pik House system", description: "The kitchen screen: Home, Ambient stories and Moments, and it learns.", preview: false });
}
