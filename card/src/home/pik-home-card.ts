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
import { energyScene, niche, photoUrl, plantRing, type PlantPic, type SceneIn, type Wine } from "./art";
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
  sky?: string;          // a weather entity with cloud_coverage (the energy scene's clouds)
  energy_today?: { solar?: string; usage?: string; imported?: string; exported?: string };
  ambient_after?: number; // seconds untouched before the stories start (default 120)
  story_seconds?: number; // each story's time on screen (default 12)
  quiet_hours?: [number, number]; // night clock between these hours (default 23 → 7)
}

type Topic = "calendar" | "piks" | "energy" | "plants" | "cellar" | "weather" | "inside" | "music" | "doorbell" | "deliveries" | "smoker" | "timers" | "cooking";
type Part = "morning" | "midday" | "evening" | "night";
type Talk = "listen" | "think" | "speak";
interface Rule { uid: string; words: string; topic: string; effect: string; when: string; until: string; state: string; why?: string; by?: string }
interface Energy { solar: number; house: number; bat: number; grid: number | null; pct: number; hours: number | null; main: string; sub: string; out: boolean }
interface FeedRow { uid: string; title: string; label: string; detail: string; urgent: boolean; who: string; at: number; cat: string; topic: Topic; primary: () => void; secondary: () => void; secLabel: string }
interface TodayRow { key: string; t: string; tsub?: string; color: string; what: string; note: string; past?: boolean; tap?: () => void }
interface Moment { key: string; kind: "timer" | "doorbell" | "leave" | "storm" | "cooking"; topic: Topic; body: () => TemplateResult }
interface Story { id: string; topic: Topic; score: number; render: () => TemplateResult; theme: string }

const CAT_TOPIC: Record<string, Topic> = { plant: "plants", water: "plants", weather: "weather", air: "weather", bill: "calendar", reminder: "calendar", home: "inside", light: "inside", package: "deliveries", energy: "energy", door: "doorbell" };
const TOPIC_NAME: Record<string, string> = { calendar: "Plans", piks: "Your Piks", energy: "Energy", plants: "Plants", cellar: "Wine", weather: "Weather", inside: "Heat & lights", music: "Music", doorbell: "Doorbell", deliveries: "Deliveries", smoker: "Smoker", timers: "Timers", cooking: "Cooking" };
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

export class PikHomeCard extends LitElement {
  static styles = [homeStyles, pikStyles];

  private config: PikHomeConfig = { type: "custom:pik-home-card" };
  private _hass: unknown = undefined;

  // live data
  private feedItems: TodoItem[] = [];
  private plantItems: TodoItem[] = [];
  private cellarItems: TodoItem[] = [];
  private ruleItems: TodoItem[] = [];
  private calEvents: CalEvent[] = [];
  private calAt = 0;
  private calBusy = false;
  private hi: number | null = null;
  private low: number | null = null;
  private cook: Record<string, unknown> | null = null;
  private cookAt = 0;
  private unsubs: Array<() => void> = [];
  private subscribing = false;

  // what's on screen
  private now = Date.now();
  private touched = Date.now();
  private layer: "home" | "ambient" = "home";
  private storyIdx = 0;
  private storyAt = Date.now();
  private sheet: "" | "energy" | "notes" = "";
  private snoozed: Record<string, number> = {};
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
    if (this._legacy) this._legacy.setConfig(Object.assign({}, config, { type: "custom:pik-house-card" }));
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

  /** The design is a fixed 1280×800: shrink it to fit the room it has. On a phone (narrow), the House card's phone layout takes over. */
  private narrow = false;
  private _legacy?: HTMLElement & { setConfig(c: unknown): void; hass: unknown };
  private measure(): void {
    const r = this.isConnected ? this.getBoundingClientRect() : null;
    const w = window.innerWidth - (r ? Math.max(0, r.left) : 0);
    const h = window.innerHeight - (r ? Math.max(0, r.top + (window.scrollY || 0)) : 0);
    const narrow = w < 900;
    if (narrow !== this.narrow) { this.narrow = narrow; this.requestUpdate(); }
    const z = narrow ? 1 : Math.min(1, w / 1280, Math.max(0.5, h / 800));
    const zs = z < 0.995 ? z.toFixed(3) : "";
    const st = this.style as unknown as { zoom: string };
    if (st.zoom !== zs) st.zoom = zs;
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
    if (this.layer === "home" && !this.talk && !this.sheet && idle > (this.C.ambient_after || 120)) { this.layer = "ambient"; this.storyIdx = 0; this.storyAt = this.now; }
    if (this.layer === "ambient" && this.now - this.storyAt > (this.C.story_seconds || 12) * 1000) { this.storyIdx++; this.storyAt = this.now; }
    if (this.sheet && idle > 90) this.sheet = "";
    if (this.H) { this.refreshCal(); this.refreshCook(); }
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
  private hide(key: string, ms = 864e5 * 30): void { this.snoozed[key] = Date.now() + ms; this.requestUpdate(); }
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
    if (hol) rows.push({ key: "hol", t: "Today", color: "#5E8A5A", what: hol.name + " cooking mode", note: "open the plan", tap: () => this.open("cooking", () => this.navigate(hol.path)) });
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

  private sceneIn(e: Energy): SceneIn {
    const sun = this.S(this.C.sun);
    const sk = this.S(this.C.sky || this.C.weather);
    const n = (v: unknown) => (typeof v === "number" ? v : null);
    return { solar: e.solar, house: e.house, bat: e.bat, grid: e.grid, pct: e.pct, out: e.out, elevation: sun ? n(sun.attributes.elevation) : null, azimuth: sun ? n(sun.attributes.azimuth) : null, clouds: sk ? n(sk.attributes.cloud_coverage) : null };
  }

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
  private plantPics(): { all: Array<PlantPic & { group: string; room: string }>; sensor: Record<string, string> } {
    const all: Array<PlantPic & { group: string; room: string }> = [];
    const sensor: Record<string, string> = {};
    this.plantItems.filter((i) => i.status === "needs_action").forEach((i) => {
      const d = i.description || "";
      const f = (k: string) => { const m = new RegExp("^" + k + ":\\s*(.+)$", "m").exec(d); return m ? m[1].trim() : ""; };
      const g = f("Group"), photo = f("Photo");
      if (f("Sensor") && g) sensor[g] = photo;
      if (photo) all.push({ name: i.summary.split(" · ")[0], photo, spot: [f("Room"), f("Spot")].filter(Boolean).join(", "), notes: f("Notes"), group: g, room: f("Room") });
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
    return html`<button type="button" class="tile scene" @click=${() => this.open("energy", () => { this.sheet = "energy"; })}>
${energyScene(this.sceneIn(e))}
<div class="sov"><span class="eb">Energy</span><div class="big">${e.solar > 0.1 ? e.solar.toFixed(1) + " kW sun" : e.out ? "Grid down" : e.pct + "% stored"}</div><div class="sub">${e.main}</div></div></button>`;
  }

  private plantsTile(): TemplateResult {
    const gs = this.groups(), dry = gs.filter((g) => g.dry);
    const pics = this.plantPics();
    const thirstyPic = dry.length ? pics.all.find((p) => p.photo === pics.sensor[dry[0].room]) : undefined;
    const pool = pics.all;
    const hero = thirstyPic || (pool.length ? pool[Math.floor(this.now / 90000) % pool.length] : undefined);
    return html`<button type="button" class="tile photo" @click=${() => this.open("plants", () => this.C.plants_path && this.navigate(this.C.plants_path))}>
${hero ? html`<img class="hero" src=${photoUrl(hero.photo, 512)} alt="" loading="lazy">` : nothing}
<div class="pshade"></div>
<div class="prow">${gs.map((g) => plantRing({ photo: pics.sensor[g.room] || "", m: g.m, thr: g.thr, dry: g.dry, live: g.live }, 34))}</div>
<div class="sov low"><span class="eb">${dry.length ? "Water today" : "Plants · all happy"}</span><div class="big" style="font-size: 22px">${dry.length ? dry.map((g) => g.room).join(", ") : hero ? hero.name : "Everyone's fine"}</div>${!dry.length && hero && hero.spot ? html`<div class="sub">${hero.spot}</div>` : nothing}</div></button>`;
  }

  private cellarTile(): TemplateResult {
    const ws = this.wines();
    const n = ws.reduce((a, w) => a + w.count, 0);
    const df = this.drinkFirst();
    return html`<button type="button" class="tile wall" @click=${() => this.open("cellar", () => this.C.cellar && this.C.cellar.path && this.navigate(this.C.cellar.path))}>
<div class="minirack">${ws.slice(0, 4).map((w) => niche(w, 96, undefined, w.name === df))}</div>
<div class="wtxt"><span class="eb">Cellar · ${n}</span><div class="sub">${df ? "Drink first: " + df.replace(/^(19|20)\d\d\s+/, "") : this.dayPart === "evening" ? "Something for tonight?" : ws.length + " wines"}</div></div></button>`;
  }

  private energyStory(): TemplateResult {
    const e = this.energy();
    if (!e) return html``;
    const t = this.energyToday();
    return html`<div class="story scenestory">
<div class="scenebg">${energyScene(this.sceneIn(e), { labels: true, wide: true })}</div>
<div class="sceneov">
<div class="kicker" style="color: #F3EDE3; opacity: .85">Energy · right now</div>
<div class="h1" style="color: #fff">${e.main}.</div>
<div style="font-size: 19px; color: #F3EDE3">${e.sub}.</div>
${t ? html`<div class="chips">
<span class="echip"><b>${t.solar.toFixed(1)}</b> kWh from the sun today</span>
<span class="echip"><b>${t.self}%</b> of today on your own power</span>
${t.exported > 0.1 ? html`<span class="echip"><b>${t.exported.toFixed(1)}</b> kWh sold back</span>` : nothing}
</div>` : nothing}
</div></div>`;
  }

  private plantStory(): TemplateResult {
    const gs = this.groups();
    const dry = gs.filter((g) => g.dry);
    const pics = this.plantPics();
    const focusG = dry[0];
    const route = focusG ? pics.all.filter((p) => p.group === focusG.room) : [];
    const spot = focusG ? pics.all.find((p) => p.photo === pics.sensor[focusG.room]) : pics.all.length ? pics.all[Math.floor(this.now / 60000) % pics.all.length] : undefined;
    const sg = spot ? gs.find((g) => g.room === spot.group) : undefined;
    return html`<div class="story" style="flex-direction: row; gap: 44px; align-items: stretch">
<div style="width: 400px; flex: none; display: flex; flex-direction: column; gap: 18px; align-items: center; text-align: center">
${spot ? plantRing({ photo: spot.photo, m: sg ? sg.m : 30, thr: sg ? sg.thr : 0, dry: !!sg && sg.dry, live: !!sg && sg.live }, 340) : nothing}
<div><div class="kicker" style="color: var(--green)">${focusG ? "Thirstiest right now" : "Plant of the minute"}</div>
<div class="h1" style="font-size: 44px">${spot ? spot.name : "Your plants"}</div>
<div style="font-size: 16px; color: var(--mute2); margin-top: 6px">${spot ? [spot.spot, spot.notes].filter(Boolean).join(" · ") : ""}</div></div>
</div>
<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 18px">
<div class="h1" style="font-size: 50px">${dry.length ? dry.map((g) => g.room).join(" and ") + (dry.length === 1 ? " needs" : " need") + " water." : "Everyone's happy. No watering today."}</div>
<div class="ringgrid">${gs.map((g) => plantRing({ photo: pics.sensor[g.room] || "", m: g.m, thr: g.thr, dry: g.dry, live: g.live }, 112, html`<span class="rlab"><b>${g.room}</b>${g.live ? g.m + "%" : "—"}</span>`))}</div>
${!route.length && pics.all.length ? html`<div class="mosaic">${Array.from({ length: Math.min(10, pics.all.length) }, (_x, k) => pics.all[(Math.floor(this.now / 60000) * 7 + k * 5) % pics.all.length]).map((p) => html`<div class="thumb big"><img src=${photoUrl(p.photo, 256)} alt="" loading="lazy"><span>${p.name}</span></div>`)}</div>` : nothing}
${route.length ? html`<div class="glass" style="padding: 16px 20px"><div class="eb" style="margin-bottom: 10px">The ${focusG!.room.toLowerCase()} route · ${route.length} plants</div><div class="thumbs">${route.slice(0, 9).map((p) => html`<div class="thumb"><img src=${photoUrl(p.photo, 256)} alt="" loading="lazy"><span>${p.name}</span></div>`)}</div></div>` : nothing}
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
      { id: "plants", topic: "plants" as Topic, score: this.groups().length ? this.rank("plants", 1.5 + (dry.length ? 3 : 0)) : -99, fr: "1.5fr", body: () => this.plantsTile() },
      { id: "inside", topic: "inside" as Topic, score: this.S(this.C.thermostat) ? this.rank("inside", 1.2) : -99, fr: "1fr", body: () => this.insideTile() },
      { id: "music", topic: "music" as Topic, score: mp ? this.rank("music", 1 + (playing ? 2.5 : 0)) : -99, fr: "1fr", body: () => this.musicTile() },
      { id: "cellar", topic: "cellar" as Topic, score: this.cellarItems.length ? this.rank("cellar", 1 + (this.dayPart === "evening" ? 1 : 0)) : -99, fr: "1.4fr", body: () => this.cellarTile() },
    ];
    const order = cand.map((c) => c.id);
    const pick = cand.filter((c) => c.score > -50).sort((a, b) => b.score - a.score).slice(0, 5);
    return pick.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }

  private insideTile(): TemplateResult {
    const c = this.S(this.C.thermostat)!;
    const cur = c.attributes.current_temperature as number | undefined, sp = c.attributes.temperature as number | undefined;
    const act = String(c.attributes.hvac_action || "");
    const lightsOn = (this.C.lights || []).reduce((n, g) => n + g.entities.filter((id) => this.S(id)?.state === "on").length, 0);
    return html`<button type="button" class="tile" @click=${() => this.open("inside", () => this.moreInfo(this.C.thermostat!))}>
<span class="eb">Inside</span><div class="big">${typeof cur === "number" ? Math.round(cur) + "°" : "—"}</div>
<div class="sub">${act === "heating" ? "Heating to " + sp + "°" : act === "cooling" ? "Cooling to " + sp + "°" : typeof sp === "number" ? "Set to " + sp + "°" : ""}<br>${lightsOn ? lightsOn + (lightsOn === 1 ? " light on" : " lights on") : "Lights off"}</div></button>`;
  }
  private musicTile(): TemplateResult {
    const id = this.C.echo!.media_player!;
    const mp = this.S(id)!;
    const a = mp.attributes;
    const on = mp.state === "playing" || mp.state === "paused";
    return html`<div class="tile">
<span class="eb">${mp.state === "playing" ? "Playing" : on ? "Paused" : "Music"}</span>
<div class="big" style="font-size: 22px; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">${on ? String(a.media_title || a.media_artist || "Something good") : "Nothing on"}</div>
<div class="sub">${on ? String(a.media_artist || a.app_name || "") : "Say “Hey Luna, play…”"}</div>
${on ? html`<div class="mbtns"><button type="button" class="rb ink" aria-label=${mp.state === "playing" ? "Pause" : "Play"} @click=${() => { this.log("music", "tap"); this.svc("media_player", "media_play_pause", {}, { entity_id: id }); }}>${mp.state === "playing" ? html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor"></rect><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor"></rect></svg>` : html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1 L12 7 L3 13 Z" fill="currentColor"></path></svg>`}</button>
<button type="button" class="rb" aria-label="Next" @click=${() => { this.log("music", "tap"); this.svc("media_player", "media_next_track", {}, { entity_id: id }); }}><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1 L10 7 L2 13 Z" fill="currentColor"></path><rect x="10.5" y="1" width="2" height="12" fill="currentColor"></rect></svg></button></div>` : nothing}
</div>`;
  }
  private smokeTile(): TemplateResult {
    const sm = this.C.smoke!;
    const ps = sm.probes.map((id, i) => ({ v: this.S(id)?.state, n: this.S("input_text.smoke_probe_" + (i + 1) + "_food")?.state || "Probe " + (i + 1) })).filter((p) => p.v && /^-?[\d.]+$/.test(p.v));
    return html`<button type="button" class="tile smoke" @click=${() => this.open("smoker", () => sm.path && this.navigate(sm.path))}>
<span class="eb">Smoker</span>${ps.length ? ps.slice(0, 3).map((p) => html`<div class="trow"><span>${p.n}</span><b>${Math.round(+p.v!)}°</b></div>`) : html`<div class="sub">Waiting for the Inkbird</div>`}</button>`;
  }
  private timersTile(ts: PoolTimer[]): TemplateResult {
    return html`<div class="tile tmr"><span class="eb">Timers</span>${ts.slice(0, 3).map((t) => html`<button type="button" class=${"trow" + (t.rang ? " rang" : "")} style="background: none; border: 0; padding: 0; color: inherit; width: 100%" @click=${() => { this.svc("script", "kitchen_timer_stop", { slot: t.id }); this.flash(t.label + (t.rang ? " — got it." : " timer stopped.")); }}><span>${t.label}</span><b>${t.rang ? "Done" : this.left(t)}</b></button>`)}</div>`;
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
    const t = this.energyToday();
    return html`<div class="scrim" @click=${() => { this.sheet = ""; }}></div><div class="sheet darkx" style="padding: 0">
<div class="scenebg" style="border-radius: 30px 30px 0 0; overflow: hidden">${e ? energyScene(this.sceneIn(e), { labels: true, wide: true }) : nothing}</div>
<div class="sceneov" style="padding: 26px 34px">
<div class="shtop"><h2 style="color: #fff">${e ? e.main : "Energy"}</h2><button type="button" class="done" style="color: #fff" @click=${() => { this.sheet = ""; }}>Done</button></div>
${e ? html`<div style="font-size: 18px; color: #F3EDE3">${e.sub}.${e.hours ? " About " + e.hours + " hours of Powerwall at this rate." : ""}</div>` : html`<div class="empty" style="color: #fff">The Powerwall isn't reporting right now.</div>`}
${t ? html`<div class="chips" style="margin-top: auto">
<span class="echip"><b>${t.solar.toFixed(1)}</b> kWh from the sun today</span>
<span class="echip"><b>${t.usage.toFixed(1)}</b> kWh used</span>
<span class="echip"><b>${t.self}%</b> on your own power</span>
<span class="echip"><b>${t.exported.toFixed(1)}</b> kWh sold back</span>
</div>` : nothing}
</div></div>`;
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

  /** Phones get the House card (it has real phone layouts), fed the same config. */
  private legacy(): HTMLElement {
    if (!this._legacy) {
      this._legacy = document.createElement("pik-house-card") as HTMLElement & { setConfig(c: unknown): void; hass: unknown };
      this._legacy.setConfig(Object.assign({}, this.C, { type: "custom:pik-house-card" }));
    }
    this._legacy.hass = this.H;
    return this._legacy;
  }

  render() {
    if (this.narrow && this.H && customElements.get("pik-house-card")) return html`${this.legacy()}`;
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
        const dark = ["energy", "cellar", "night"].includes(s.theme);
        const BG: Record<string, string> = { morning: "linear-gradient(180deg, #F7E3C8 0%, #F3EADD 70%)", energy: "#0F1720", garden: "#EEF0E4", cellar: "radial-gradient(ellipse at 70% 30%, #4A2A22 0%, #2B1A16 55%, #1C110E 100%)", night: "radial-gradient(ellipse at 30% 20%, #26305A 0%, #1B2240 45%, #121730 100%)" };
        body = html`<div class=${"amb" + (s.theme === "energy" ? " over" : "")} style=${"background: " + (BG[s.theme] || "#F3EADD")} @click=${() => this.wake()}>${s.render()}${s.id !== "night" ? this.sfoot(list, i, dark) : nothing}</div>`;
      }
    } else body = this.homeLayer();
    return html`<div class="root" @pointerdown=${() => { this.touched = Date.now(); }}>
${body}
${m && m.kind !== "cooking" ? this.voiceBubble() : nothing}
${!m && this.sheet === "energy" ? this.energySheet() : nothing}
${!m && this.sheet === "notes" ? this.notesSheet() : nothing}
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
