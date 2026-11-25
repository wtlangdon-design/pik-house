// Live mode for the house feed: everything the card reads from Home Assistant.
// The card hard-codes no entity IDs; they all come from the card's YAML config (see SPEC.md "Entity map").
import type { Group } from "./mock-data";

export interface HState { entity_id: string; state: string; attributes: Record<string, unknown>; last_changed: string }
export interface Hass {
  states: Record<string, HState>;
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
  connection?: { subscribeMessage<T>(cb: (m: T) => void, msg: Record<string, unknown>): Promise<() => void> };
}
export interface TodoItem { uid: string; summary: string; status: string; description?: string | null; due?: string | null }

export interface LiveConfig {
  weather?: string;
  thermostat?: string;
  sun?: string;
  air_pm25?: string;
  feed_list?: string;
  plants_list?: string;
  plants_quiet?: string; // input_text holding "group:until-epoch,…" (Watered / Snooze)
  plant_groups?: Array<{ name: string; indicator?: string; sensor?: string; dry?: number }>;
  lights?: Array<{ name: string; entities: string[] }>;
  watering?: { yard?: { name?: string; standby: string }; garden?: { name?: string; standby: string } };
  doorbell?: { camera?: string; name?: string };
  echo?: { media_player?: string };
  timers?: number;
  energy?: { solar_power?: string; load_power?: string; battery_power?: string; grid_power?: string; battery_level?: string; grid_status?: string; capacity_kwh?: number };
  holiday?: Array<{ name: string; path: string; from: string; to: string }>;
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const num = (s: HState | undefined): number | null => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return isFinite(v) ? v : null;
};

const COND: Record<string, string> = {
  "clear-night": "Clear", cloudy: "Cloudy", exceptional: "Wild weather", fog: "Foggy", hail: "Hail", lightning: "Storms",
  "lightning-rainy": "Storms", partlycloudy: "Partly cloudy", pouring: "Pouring", rainy: "Rain", snowy: "Snow",
  "snowy-rainy": "Sleet", sunny: "Sunny", windy: "Windy", "windy-variant": "Windy",
};
export const condWord = (s: string) => COND[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/** "kitchen:1764000000,desert:1764003600" → { kitchen: ms, desert: ms } */
export function parseQuiet(v: string | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  (v || "").split(",").forEach((p) => { const [k, t] = p.split(":"); if (k && t && isFinite(+t)) out[k] = +t * 1000; });
  return out;
}
export function writeQuiet(m: Record<string, number>): string {
  const now = Date.now();
  return Object.keys(m).filter((k) => m[k] > now).map((k) => k + ":" + Math.round(m[k] / 1000)).join(",").slice(0, 255);
}

/** Plant groups from config + live sensors + how many plants the catalog has in each. */
export function liveGroups(cfg: LiveConfig, hass: Hass, plants: TodoItem[]): Array<Group & { sensor?: string; live: boolean }> {
  const counts: Record<string, number> = {};
  plants.filter((p) => p.status !== "completed").forEach((p) => {
    const g = /^Group:\s*(.+)$/m.exec(p.description || "");
    if (g) counts[g[1].trim()] = (counts[g[1].trim()] || 0) + 1;
  });
  return (cfg.plant_groups || []).filter((g) => g.sensor).map((g) => {
    const m = num(hass.states[g.sensor!]);
    return { id: slug(g.name), room: g.name, ind: g.indicator || "sensor plant", plants: counts[g.name] || 0, thr: g.dry ?? 25, m: m === null ? -1 : Math.round(m), sensor: g.sensor, live: m !== null };
  });
}

export function plantTotal(plants: TodoItem[]): number { return plants.filter((p) => p.status !== "completed").length; }

export interface FeedDesc {
  id?: string; category?: string; label?: string; detail?: string; urgent?: boolean;
  primary?: { label?: string; script?: string; open?: string; toast?: string };
  secondary?: { label?: string; kind?: string; minutes?: number } | null;
  expires?: string;
}
export function parseDesc(d: string | null | undefined): FeedDesc {
  if (!d) return {};
  try { const o = JSON.parse(d); return o && typeof o === "object" ? o : { detail: d }; } catch (e) { return { detail: d }; }
}

/** Kitchen timers from the shared pool (timer.kitchen_N + input_text.kitchen_timer_N = "kind|label"). */
export interface PoolTimer { id: number; label: string; total: number; end: number; rang: boolean }
const dur = (s: unknown) => { const p = String(s || "0:0:0").split(":").map(Number); return ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)) * 1000; };
export function poolTimers(hass: Hass, n: number): PoolTimer[] {
  const out: PoolTimer[] = [];
  const now = Date.now();
  for (let i = 1; i <= n; i++) {
    const t = hass.states["timer.kitchen_" + i], l = hass.states["input_text.kitchen_timer_" + i];
    if (!t || !l || !l.state || l.state === "unknown") continue;
    const bar = l.state.indexOf("|");
    const label = bar > 0 ? l.state.slice(bar + 1) : l.state;
    if (!label) continue;
    const total = dur(t.attributes.duration) || 60000;
    if (t.state === "active") { const end = Date.parse(String(t.attributes.finishes_at)); out.push({ id: i, label, total, end, rang: end <= now }); }
    else if (t.state === "paused") out.push({ id: i, label, total, end: now + dur(t.attributes.remaining), rang: false });
    else out.push({ id: i, label, total, end: Date.parse(t.last_changed), rang: true });
  }
  return out.sort((a, b) => (a.rang === b.rang ? a.end - b.end : a.rang ? -1 : 1));
}

/** YYYY-MM-DD for today in the browser's time zone. */
export function today(): string { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

/** Local "YYYY-MM-DD HH:MM:SS" for todo.update_item's due_datetime. */
export function localStamp(ms: number): string {
  const d = new Date(ms), p = (x: number) => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":00";
}
