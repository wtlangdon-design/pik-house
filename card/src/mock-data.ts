// Fake data for mock mode, ported verbatim from reference/daylight-reference.html.

export interface Group {
  id: string;
  room: string;
  ind: string;
  plants: number;
  thr: number;
  m: number;
}

export interface FeedCard {
  cat: string;
  label: string;
  title: string;
  detail: string;
  primary: string;
  secondary?: string;
  urgent?: boolean;
  fx?: string;
  arrive?: string;
  toast: string;
}

export const ICON: Record<string, string> = {
  plant: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8",
  weather: "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  home: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
  package: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  energy: "M13 2L4 14h7l-1 8 9-12h-7z",
  door: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  air: "M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7",
  light: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z",
  water: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
};

// Tyler's real watering groups, sensor plants and plant counts (hub catalog, Nov 24). Moisture values are sample data.
// In live mode the thresholds come from the input_number.pik_dry_* helpers and the counts from the plant catalog.
export const GROUPS: Group[] = [
  { id: "kitchen", room: "Kitchen", ind: "nerve plant", plants: 14, thr: 30, m: 36 },
  { id: "aroids", room: "Big aroids", ind: "entry monstera", plants: 14, thr: 28, m: 41 },
  { id: "bedroom", room: "Bedroom & office", ind: "spider plant", plants: 8, thr: 28, m: 19 },
  { id: "trees", room: "Trees & palms", ind: "bedroom fiddle leaf fig", plants: 12, thr: 25, m: 21 },
  { id: "tough", room: "Tough guys", ind: "big ZZ in the yellow pot", plants: 12, thr: 12, m: 30 },
  { id: "jungle", room: "Jungle cacti", ind: "blooming Christmas cactus", plants: 9, thr: 20, m: 33 },
  { id: "desert", room: "Desert cacti", ind: "tall euphorbia in the dining room", plants: 19, thr: 8, m: 14 },
];

// Plants outside the groups, with no sensor (the "No sensor" group in the catalog).
export const UNGROUPED_PLANTS = 1;

/** All of Tyler's current plants: 88 in the seven groups plus 1 with no sensor = 89. */
export const PLANT_TOTAL = GROUPS.reduce((a, g) => a + g.plants, 0) + UNGROUPED_PLANTS;

export const ALL: Record<string, FeedCard> = {
  freeze: { cat: "weather", label: "Weather · Rachio", title: "First freeze tonight. Low of 28°", detail: "Rachio already skipped tomorrow's yard watering. Bring the 3 patio pots in before dark.", primary: "Done", toast: "Nice. The patio pots are safe." },
  internet: { cat: "bill", label: "Bills · from email", title: "Your internet bill went up $12", detail: "The promo rate ended. Want a short script for the call to get it back?", primary: "Write the script", secondary: "Ignore", toast: "Script's ready in this week's report." },
  doorbell: { cat: "door", urgent: true, label: "Front door · Ring", title: "Someone's at the front door", detail: "The doorbell rang just now. It looks like a delivery driver.", primary: "Show camera", secondary: "Dismiss", toast: "Opening the front door camera." },
  outage: { cat: "energy", urgent: true, label: "Energy · Powerwall", title: "The power's out. The Powerwall has it.", detail: "The grid went down a minute ago. Switch to essentials only to stretch the battery?", primary: "Essentials only", secondary: "Keep everything on", fx: "essentials", arrive: "outageOn", toast: "Essentials only. That roughly doubles the time left." },
  heat: { cat: "home", label: "Heat · Ecobee", title: "Nobody's home and the heat is at 70°", detail: "Want me to drop it to 64° until one of you gets back?", primary: "Drop to 64°", secondary: "Leave it", fx: "heat64", toast: "Done. Holding 64° until someone's home." },
  restore: { cat: "energy", label: "Energy · Powerwall", title: "The power's back", detail: "The grid came back. The Powerwall got you through and is topping itself off.", primary: "Nice", arrive: "outageOff", toast: "Back to normal." },
  garden: { cat: "water", label: "Garden · B-Hyve", title: "Time to winterize the garden drip?", detail: "Three nights below freezing this week. Pause the garden schedule until March?", primary: "Pause until March", secondary: "Not yet", fx: "gardenOff", toast: "The garden drip is paused until March 1." },
  smoke: { cat: "air", label: "Air · outdoor sensor", title: "Smoky air outside", detail: "The air sensor is picking up wood smoke (PM2.5 at 48). Keep the windows closed tonight.", primary: "Got it", arrive: "smokeOn", fx: "smokeOff", toast: "Windows stay shut. I'll tell you when it clears." },
  soil: { cat: "package", label: "Delivery · Ring", title: "Your potting soil was delivered", detail: "Ring saw it land on the porch at 2:41 PM. It's 40 pounds, so bring a friend.", primary: "Got it", toast: "I'll stop thinking about the soil now." },
  lamps: { cat: "light", label: "Lights · Wemo", title: "The living room lamps are on. Nobody's home.", detail: "They've been keeping an empty room company for 2 hours.", primary: "Turn them off", secondary: "Leave them on", fx: "livingOff", toast: "Lamps off. The room will cope." },
  trash: { cat: "reminder", label: "Reminder · every Tuesday, 8 AM", title: "Trash goes out this morning", detail: "Bins to the curb before pickup. This one comes back every Tuesday.", primary: "Done", secondary: "In an hour", toast: "Nice. See you next Tuesday." },
  report: { cat: "home", label: "Weekly report", title: "Your Sunday house report is ready", detail: "2 bills due, 1 price change, nothing broken. Solar covered 71% of the house this week.", primary: "Open report", toast: "Opening this week's report." },
};

export const INITIAL = ["freeze", "plants", "internet"];
export const QUEUE = ["doorbell", "trash", "ferns", "outage", "heat", "restore", "garden", "smoke", "soil", "lamps", "report"];
export const QUESTIONS = [
  "Set a pasta timer for one minute.",
  "Play some Robyn.",
  "What's tonight looking like?",
  "Put Judy Justice back on.",
  "How's the Powerwall doing?",
  "Which plants need water?",
  "Turn off the porch light.",
];
export const PLAY = "M8 5v14l11-7z";
export const PAUSE = "M7 5h4v14H7zM13 5h4v14h-4z";

export type PikState = "rest" | "listen" | "think" | "speak" | "muted" | "alert";
export const LABELS: Record<PikState, string> = { rest: "Resting", listen: "Listening", think: "Thinking", speak: "Speaking", muted: "Mic off", alert: "Heads up" };
export const CAP = 13.5; // Powerwall 3 usable kWh
