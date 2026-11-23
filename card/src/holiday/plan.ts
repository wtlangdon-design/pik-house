// Types for a holiday cooking plan (holiday/<plan>.json). One plan file per big meal.
import thanksgiving2026 from "../../../holiday/thanksgiving-2026.json";

export type Day = string;
export type TimerKind = "check" | "done" | "temp";
export type TimerSpec = [string, number, TimerKind];

/** ing: what this step uses: [ingredient index] or [index, amount for this step, wording]; index -1 = something made earlier */
/** min: about how many minutes of hands-on work the step takes (a timer, if any, covers the waiting) */
export interface Step { d: Day; t: string; min?: number; tm?: TimerSpec; ing?: Array<[number, string?, string?]> }
export interface Recipe {
  id: string; n: number; name: string; tag: string; gf: string; yield: string; active: string; passive: string;
  src?: [string, string] | null; ingr: Array<[string, string, string?]>; equip: string[];
  done: string; ahead: string; store: string; flags?: Array<[string, string, string]>; steps: Step[];
}
/** dish id, state after this task is ticked off (cold | act | hot | wait), words for the dish board */
export type DishEffect = [string, string, string];
export interface Task {
  id: string; day: Day; hm: string; lane: string; rid: string | null; text: string; tm: TimerSpec | null;
  /** the recipe steps this task covers, in order: [recipe id, step index] */
  steps: Array<[string, number]>;
  dish: DishEffect[];
}
export interface Dish { id: string; name: string; hot: boolean }
/** [day, start, end, temperature or note, what's on it] */
export type Segment = [Day, string, string, string, string];
export interface Plan {
  id: string; title: string; subtitle: string; tz: string; dinner: string;
  days: Record<Day, string>; dayNames: Record<Day, string>;
  recipes: Recipe[]; tasks: Task[]; dishes: Dish[];
  hotCheck: { day: Day; from: string; to: string };
  stations: Record<string, Segment[]>;
  shop: Array<[string, string, string, string, string]>;
  assume: string[]; optional: string[]; ifs: Array<[string, string]>; safe: Array<[string, string, string]>;
}

export const PLANS: Record<string, Plan> = {
  thanksgiving_2026: thanksgiving2026 as unknown as Plan,
};
