// Types for a holiday cooking plan (holiday/<plan>.json). One plan file per big meal.
import thanksgiving2026 from "../../../holiday/thanksgiving-2026.json";

export type Day = string;
export type TimerKind = "check" | "done" | "temp";
export type TimerSpec = [string, number, TimerKind];

export interface Step { d: Day; t: string; tm?: TimerSpec }
export interface Recipe {
  id: string; n: number; name: string; tag: string; gf: string; yield: string; active: string; passive: string;
  src?: [string, string] | null; ingr: Array<[string, string, string?]>; equip: string[];
  done: string; ahead: string; store: string; flags?: Array<[string, string, string]>; steps: Step[];
}
export interface Task { id: string; day: Day; hm: string; lane: string; who: string; rid: string | null; text: string; tm: TimerSpec | null }
export interface FinalItem { id: string; hm: string; who: string; text: string }
export interface Plan {
  id: string; title: string; subtitle: string; tz: string; dinner: string;
  days: Record<Day, string>; dayNames: Record<Day, string>;
  recipes: Recipe[]; tasks: Task[]; finalHour: FinalItem[];
  shop: Array<[string, string, string, string, string]>;
  assume: string[]; optional: string[]; ifs: Array<[string, string]>; safe: Array<[string, string, string]>;
  ovenTracks: Record<Day, Array<[string, number, string]>>;
  smokerTrack: Record<Day, Array<[string, number, string]>>;
}

export const PLANS: Record<string, Plan> = {
  thanksgiving_2026: thanksgiving2026 as unknown as Plan,
};
