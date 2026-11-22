// Where the holiday card keeps its progress.
//
// HaStore (live): everything lives in Home Assistant, so the Chromebook, the Echo Show and both
// phones see the same ticks, timers and turkey readings, and Pik can read and change them.
//   input_boolean.<prefix>_<task id>      a task is ticked off (one per task and final-hour item)
//   input_number.<prefix>_turkey_<spot>   latest probe reading (breast, thigh, wing); history = the log
//   input_boolean.<prefix>_quiet          on = Echo announcements muted (off by default, so they start on)
//   timer.kitchen_<n> + input_text.kitchen_timer_<n>   the shared kitchen timer pool ("kind|label")
//   script.kitchen_timer / kitchen_timer_stop / kitchen_timer_add5   start, stop/acknowledge, +5 min
// LocalStore (mock / preview): the same data in this browser's localStorage.
import type { TimerKind } from "./plan";

export interface Reading { t: number; loc: string; f: number }
export interface KTimer { key: string; label: string; kind: TimerKind; end: number; total: number; rang: boolean }

export interface Store {
  readonly live: boolean;
  isDone(id: string): boolean;
  setDone(id: string, v: boolean): void;
  setMany(ids: string[], v: boolean): void;
  latest(loc: string): Reading | null;
  readings(): Reading[];
  logTemps(vals: Record<string, number>): void;
  removeReading?(i: number): void;
  timers(): KTimer[];
  startTimer(label: string, min: number, kind: TimerKind): Promise<string | null>;
  stopTimer(key: string): void;
  plus5(key: string): void;
  alarmsOn(): boolean;
  setAlarms(v: boolean): void;
  resetAll(ids: string[]): void;
  /** A signature of everything that affects the screen, so the card only redraws on real changes. */
  sig(): string;
}

// ---------------------------------------------------------------- local

interface LocalState { done: Record<string, boolean>; temps: Reading[]; timers: KTimer[]; alarms: boolean }

export class LocalStore implements Store {
  readonly live = false;
  private s: LocalState = { done: {}, temps: [], timers: [], alarms: true };
  constructor(private key: string) {
    try { const raw = localStorage.getItem(key); if (raw) this.s = Object.assign(this.s, JSON.parse(raw)); } catch (e) { /* private mode */ }
  }
  private save(): void { try { localStorage.setItem(this.key, JSON.stringify(this.s)); } catch (e) { /* ignore */ } }
  isDone(id: string): boolean { return !!this.s.done[id]; }
  setDone(id: string, v: boolean): void { this.s.done[id] = v; this.save(); }
  setMany(ids: string[], v: boolean): void { ids.forEach((i) => (this.s.done[i] = v)); this.save(); }
  latest(loc: string): Reading | null { const r = this.s.temps.filter((x) => x.loc === loc); return r.length ? r[r.length - 1] : null; }
  readings(): Reading[] { return this.s.temps.slice(); }
  logTemps(vals: Record<string, number>): void { Object.keys(vals).forEach((loc) => this.s.temps.push({ t: Date.now(), loc, f: vals[loc] })); this.save(); }
  removeReading(i: number): void { this.s.temps.splice(i, 1); this.save(); }
  timers(): KTimer[] {
    const now = Date.now();
    return this.s.timers.map((t) => Object.assign({}, t, { rang: t.end <= now }));
  }
  async startTimer(label: string, min: number, kind: TimerKind): Promise<string | null> {
    const same = this.s.timers.find((t) => t.label === label && t.end > Date.now());
    if (same) { same.end = Date.now() + min * 60000; same.total = min * 60000; }
    else this.s.timers.push({ key: String(Date.now() + Math.random()), label, kind, end: Date.now() + min * 60000, total: min * 60000, rang: false });
    this.save(); return null;
  }
  stopTimer(key: string): void { this.s.timers = this.s.timers.filter((t) => t.key !== key); this.save(); }
  plus5(key: string): void { const t = this.s.timers.find((x) => x.key === key); if (t) { t.end += 300000; t.total += 300000; this.save(); } }
  alarmsOn(): boolean { return this.s.alarms; }
  setAlarms(v: boolean): void { this.s.alarms = v; this.save(); }
  resetAll(): void { this.s = { done: {}, temps: [], timers: [], alarms: true }; this.save(); }
  sig(): string { return JSON.stringify([this.s.done, this.s.temps.length, this.s.timers.map((t) => t.key + t.end), this.s.alarms]); }
}

// ---------------------------------------------------------------- Home Assistant

interface HassEntity { state: string; attributes: Record<string, unknown>; last_changed: string; last_updated: string; last_reported?: string }
export interface Hass {
  states: Record<string, HassEntity>;
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>, notifyOnError?: boolean, returnResponse?: boolean): Promise<unknown>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
}

export const SPOTS = ["breast", "thigh", "wing"];

function parseDur(s: unknown): number {
  const p = String(s || "0:00:00").split(":").map(Number);
  while (p.length < 3) p.unshift(0);
  return ((p[0] * 60 + p[1]) * 60 + p[2]) * 1000;
}

export class HaStore implements Store {
  readonly live = true;
  hass!: Hass;
  private log: Reading[] = [];
  private logSig = "";
  private logBusy = false;
  constructor(private prefix: string, private pool: number, private since: string, private onChange: () => void) {}

  private st(id: string): HassEntity | undefined { return this.hass && this.hass.states[id]; }
  private b(id: string): string { return "input_boolean." + this.prefix + "_" + id; }
  hasEntities(): boolean { return !!this.st("input_boolean." + this.prefix + "_quiet"); }

  isDone(id: string): boolean { const e = this.st(this.b(id)); return !!e && e.state === "on"; }
  setDone(id: string, v: boolean): void { this.hass.callService("input_boolean", v ? "turn_on" : "turn_off", {}, { entity_id: this.b(id) }); }
  setMany(ids: string[], v: boolean): void {
    const ents = ids.map((i) => this.b(i)).filter((e) => this.st(e));
    for (let i = 0; i < ents.length; i += 40) this.hass.callService("input_boolean", v ? "turn_on" : "turn_off", {}, { entity_id: ents.slice(i, i + 40) });
  }

  latest(loc: string): Reading | null {
    const e = this.st("input_number." + this.prefix + "_turkey_" + loc);
    if (!e) return null;
    const f = parseFloat(e.state);
    if (!(f > 30)) return null;
    return { loc, f: Math.round(f), t: Date.parse(e.last_reported || e.last_updated) };
  }
  readings(): Reading[] {
    const sig = SPOTS.map((l) => { const x = this.latest(l); return x ? x.f + "@" + x.t : "-"; }).join("|");
    if (sig !== this.logSig && !this.logBusy) { this.logSig = sig; this.fetchLog(); }
    return this.log.length ? this.log : SPOTS.map((l) => this.latest(l)).filter((x): x is Reading => !!x);
  }
  private async fetchLog(): Promise<void> {
    this.logBusy = true;
    try {
      const ids = SPOTS.map((l) => "input_number." + this.prefix + "_turkey_" + l);
      const res = await this.hass.callWS<Record<string, Array<{ s: string; lu: number; lc?: number }>>>({
        type: "history/history_during_period", start_time: this.since, entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
      });
      const out: Reading[] = [];
      ids.forEach((id, i) => (res[id] || []).forEach((h) => { const f = parseFloat(h.s); if (f > 30) out.push({ loc: SPOTS[i], f: Math.round(f), t: (h.lu || h.lc || 0) * 1000 }); }));
      out.sort((a, b) => a.t - b.t);
      this.log = out;
      this.onChange();
    } catch (e) { /* history unavailable; fall back to latest readings */ }
    this.logBusy = false;
  }
  logTemps(vals: Record<string, number>): void {
    Object.keys(vals).forEach((loc) => this.hass.callService("input_number", "set_value", { value: vals[loc] }, { entity_id: "input_number." + this.prefix + "_turkey_" + loc }));
    window.setTimeout(() => { this.logSig = ""; this.onChange(); }, 1500);
  }

  timers(): KTimer[] {
    const out: KTimer[] = [];
    const now = Date.now();
    for (let n = 1; n <= this.pool; n++) {
      const t = this.st("timer.kitchen_" + n), l = this.st("input_text.kitchen_timer_" + n);
      if (!t || !l || !l.state || l.state === "unknown") continue;
      const bar = l.state.indexOf("|");
      const kind = (bar > 0 ? l.state.slice(0, bar) : "check") as TimerKind;
      const label = bar > 0 ? l.state.slice(bar + 1) : l.state;
      if (!label) continue;
      const total = parseDur(t.attributes.duration);
      if (t.state === "active") {
        const end = Date.parse(String(t.attributes.finishes_at));
        out.push({ key: String(n), label, kind, end, total, rang: end <= now });
      } else if (t.state === "paused") {
        out.push({ key: String(n), label, kind, end: now + parseDur(t.attributes.remaining), total, rang: false });
      } else {
        // idle with a label: it finished and nobody has tapped OK yet
        out.push({ key: String(n), label, kind, end: Date.parse(t.last_changed), total, rang: true });
      }
    }
    return out;
  }
  async startTimer(label: string, min: number, kind: TimerKind): Promise<string | null> {
    try {
      const r = (await this.hass.callService("script", "kitchen_timer", { label, minutes: min, kind }, undefined, true, true)) as { response?: { ok?: boolean; message?: string } };
      const resp = r && r.response;
      return resp && resp.ok === false ? resp.message || "No free timer." : null;
    } catch (e) { return "Couldn't start the timer: " + (e as Error).message; }
  }
  stopTimer(key: string): void { this.hass.callService("script", "kitchen_timer_stop", { slot: Number(key) }); }
  plus5(key: string): void { this.hass.callService("script", "kitchen_timer_add5", { slot: Number(key) }); }
  alarmsOn(): boolean { const e = this.st("input_boolean." + this.prefix + "_quiet"); return !e || e.state !== "on"; }
  setAlarms(v: boolean): void { this.hass.callService("input_boolean", v ? "turn_off" : "turn_on", {}, { entity_id: "input_boolean." + this.prefix + "_quiet" }); }
  resetAll(ids: string[]): void {
    this.setMany(ids, false);
    SPOTS.forEach((l) => this.hass.callService("input_number", "set_value", { value: 0 }, { entity_id: "input_number." + this.prefix + "_turkey_" + l }));
    this.timers().forEach((t) => this.stopTimer(t.key));
  }
  sig(): string {
    if (!this.hass) return "";
    const parts: string[] = [];
    const pre = this.prefix + "_";
    for (const id in this.hass.states) {
      if (id.startsWith("input_boolean." + pre) || id.startsWith("input_number." + pre) || id.startsWith("timer.kitchen_") || id.startsWith("input_text.kitchen_timer_")) {
        const e = this.hass.states[id];
        parts.push(id + "=" + e.state + (id.startsWith("timer.") ? "/" + e.attributes.finishes_at + "/" + e.attributes.duration : "") + (id.startsWith("input_number.") ? "/" + (e.last_reported || e.last_updated) : ""));
      }
    }
    return parts.join(";");
  }
}
