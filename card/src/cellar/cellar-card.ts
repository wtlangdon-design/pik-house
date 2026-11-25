// Pik cellar: the wines we have, what they're worth, and the ones we've drunk (with stars).
// One Home Assistant to-do list (todo.wine_cellar, Local To-do) holds one item per bottle. The item's
// name is the wine ("2019 Ridge Monte Bello"); its description holds the details, one per line:
//   Producer: / Vintage: / Region: / Grape: / Value: 85 / Valued: 2026-11-25 · Wine-Searcher avg
//   Image: https://… (a clean bottle shot from the web) / Added: 2026-11-25 / Notes:
//   Drank: 2026-12-24 / Rating: 4 / Tasting: what we thought
// A bottle we drank is ticked "completed", so it stays in the history with its stars.
// Pik adds bottles from a photo with script.wine_add; this card is for browsing, "We drank it" and stars.
//
//   type: custom:pik-cellar-card
//   entity: todo.wine_cellar
//   mock: false                   # true = sample bottles, nothing saved
import { LitElement, html, nothing, type TemplateResult } from "lit";
import { cellarStyles } from "./cellar-styles";

export interface CellarConfig { type: string; entity?: string; mock?: boolean; title?: string }
interface HState { state: string; attributes: Record<string, unknown> }
interface Hass {
  states: Record<string, HState>;
  callService(d: string, s: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
  connection?: { subscribeMessage<T>(cb: (m: T) => void, msg: Record<string, unknown>): Promise<() => void> };
}
interface TodoItem { uid: string; summary: string; status: "needs_action" | "completed"; description?: string | null }
export interface Bottle {
  uid: string; name: string; drunk: boolean;
  producer: string; vintage: string; region: string; grape: string; value: string; valued: string; image: string;
  added: string; notes: string; drank: string; rating: string; tasting: string;
}
const FIELDS: Array<[keyof Bottle, string]> = [["producer", "Producer"], ["vintage", "Vintage"], ["region", "Region"], ["grape", "Grape"], ["value", "Value"], ["valued", "Valued"], ["image", "Image"], ["added", "Added"], ["notes", "Notes"], ["drank", "Drank"], ["rating", "Rating"], ["tasting", "Tasting"]];
const BOTTLE = `<svg viewBox="0 0 40 120" aria-hidden="true"><path d="M16 4h8v26c0 6 10 12 10 26v56c0 3-2 4-4 4H10c-2 0-4-1-4-4V56c0-14 10-20 10-26z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 66h24v30H8z" fill="currentColor" opacity=".25"/></svg>`;
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = (s: string) => { if (!/^\d{4}-\d\d-\d\d$/.test(s)) return s; return new Date(s + "T12:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); };
const money = (n: number) => "$" + Math.round(n).toLocaleString();
const num = (s: string) => { const n = parseFloat(String(s || "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };

export function parseBottle(it: TodoItem): Bottle {
  const b = { uid: it.uid, name: it.summary, drunk: it.status === "completed" } as Bottle;
  FIELDS.forEach(([k]) => ((b as unknown as Record<string, string>)[k] = ""));
  (it.description || "").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/);
    if (!m) return;
    const f = FIELDS.find(([, label]) => label.toLowerCase() === m[1].toLowerCase());
    if (f) (b as unknown as Record<string, string>)[f[0]] = m[2].trim();
  });
  return b;
}
export function describeBottle(b: Bottle): string {
  return FIELDS.map(([k, label]) => [label, String(b[k] || "").replace(/\s*\n\s*/g, " ")]).filter(([, v]) => v).map(([l, v]) => l + ": " + v).join("\n");
}

const MOCK: TodoItem[] = [
  { uid: "w1", summary: "2019 Ridge Monte Bello", status: "needs_action", description: "Producer: Ridge Vineyards\nVintage: 2019\nRegion: Santa Cruz Mountains, California\nGrape: Cabernet blend\nValue: 230\nValued: 2026-11-25 · sample\nAdded: 2026-11-20" },
  { uid: "w2", summary: "2021 Duckhorn Napa Valley Merlot", status: "needs_action", description: "Producer: Duckhorn\nVintage: 2021\nRegion: Napa Valley\nGrape: Merlot\nValue: 58\nAdded: 2026-11-20" },
  { uid: "w3", summary: "2021 Duckhorn Napa Valley Merlot", status: "needs_action", description: "Producer: Duckhorn\nVintage: 2021\nRegion: Napa Valley\nGrape: Merlot\nValue: 58\nAdded: 2026-11-21" },
  { uid: "w4", summary: "NV Veuve Clicquot Yellow Label", status: "needs_action", description: "Producer: Veuve Clicquot\nRegion: Champagne\nGrape: Champagne blend\nValue: 62" },
  { uid: "w5", summary: "2020 Château Ste. Michelle Riesling", status: "completed", description: "Region: Columbia Valley\nGrape: Riesling\nValue: 12\nDrank: 2026-11-10\nRating: 3\nTasting: Fine with Thai food." },
];

type Tab = "have" | "drank";
type Sort = "value" | "added" | "name";

export class PikCellarCard extends LitElement {
  static styles = cellarStyles;
  static properties = { _v: { state: true } };
  private _v = 0;
  private config: CellarConfig = { type: "custom:pik-cellar-card" };
  private _hass?: Hass;
  private items: TodoItem[] = [];
  private unsub?: () => void;
  private subscribing = false;
  private tab: Tab = "have";
  private sort: Sort = "value";
  private open: string | null = null;
  private rating: { uid: string; stars: number; tasting: string } | null = null;
  private confirmRemove = false;
  private busy = false;
  private msg = "";
  private msgT = 0;
  private broken = new Set<string>();

  setConfig(c: CellarConfig): void { this.config = { entity: "todo.wine_cellar", ...c }; if (this.isMock) this.items = MOCK.slice(); }
  set hass(h: Hass) { this._hass = h; if (!this.isMock && !this.unsub && !this.subscribing) this.subscribe(); }
  get hass(): Hass { return this._hass as Hass; }
  getCardSize(): number { return 12; }
  static getStubConfig(): CellarConfig { return { type: "custom:pik-cellar-card", entity: "todo.wine_cellar" }; }
  private get isMock(): boolean { return !!this.config.mock; }
  private bump(): void { this._v++; }

  connectedCallback(): void { super.connectedCallback(); if (this._hass && !this.isMock && !this.unsub) this.subscribe(); }
  disconnectedCallback(): void { super.disconnectedCallback(); if (this.unsub) { this.unsub(); this.unsub = undefined; } }

  private async subscribe(): Promise<void> {
    const c = this._hass?.connection;
    if (!c) return;
    this.subscribing = true;
    try {
      this.unsub = await c.subscribeMessage<{ items: TodoItem[] }>((m) => { this.items = m.items || []; this.bump(); }, { type: "todo/item/subscribe", entity_id: this.config.entity });
    } catch (e) { this.flash("Couldn't read the cellar list (" + this.config.entity + ")."); } finally { this.subscribing = false; }
  }
  private bottles(): Bottle[] { return this.items.map(parseBottle); }
  private flash(m: string): void { this.msg = m; clearTimeout(this.msgT); this.msgT = window.setTimeout(() => { this.msg = ""; this.bump(); }, 3500); this.bump(); }

  private async save(b: Bottle): Promise<void> {
    const desc = describeBottle(b);
    if (this.isMock) {
      const i = this.items.findIndex((x) => x.uid === b.uid);
      if (i >= 0) this.items[i] = { uid: b.uid, summary: b.name, status: b.drunk ? "completed" : "needs_action", description: desc };
      this.items = this.items.slice(); this.bump(); return;
    }
    await this.hass.callService("todo", "update_item", { item: b.uid, rename: b.name, description: desc, status: b.drunk ? "completed" : "needs_action" }, { entity_id: this.config.entity });
  }
  private async removeBottle(uid: string): Promise<void> {
    if (this.isMock) { this.items = this.items.filter((x) => x.uid !== uid); this.bump(); return; }
    await this.hass.callService("todo", "remove_item", { item: uid }, { entity_id: this.config.entity });
  }

  // ------------------------------------------------------------------ events

  private onClick = async (e: Event): Promise<void> => {
    const el = (e.target as HTMLElement).closest("[data-a]") as HTMLElement | null;
    if (!el) return;
    const a = el.dataset.a!, v = el.dataset.v || "";
    const find = (uid: string) => this.bottles().find((x) => x.uid === uid);
    if (a === "tab") { this.tab = v as Tab; this.open = null; }
    else if (a === "sort") this.sort = v as Sort;
    else if (a === "open") { this.open = v; this.confirmRemove = false; this.rating = null; }
    else if (a === "close") { this.open = null; this.rating = null; this.confirmRemove = false; }
    else if (a === "drank" || a === "rerate") { const b = find(v); if (b) this.rating = { uid: v, stars: num(b.rating), tasting: b.tasting }; }
    else if (a === "star" && this.rating) this.rating = { ...this.rating, stars: +v };
    else if (a === "save-rating" && this.rating && !this.busy) {
      const b = find(this.rating.uid);
      if (!b) return;
      const ta = this.renderRoot.querySelector("textarea") as HTMLTextAreaElement | null;
      const was = b.drunk;
      b.drunk = true; b.drank = b.drank || today(); b.rating = this.rating.stars ? String(this.rating.stars) : ""; b.tasting = (ta ? ta.value : this.rating.tasting).trim();
      this.busy = true; this.bump();
      try { await this.save(b); this.flash(was ? "Saved." : "Cheers. " + b.name + " is in the drank list."); this.rating = null; this.open = null; }
      catch (err) { this.flash("Couldn't save. Check the hub is connected."); } finally { this.busy = false; }
    }
    else if (a === "back") { const b = find(v); if (b) { b.drunk = false; b.drank = ""; await this.save(b).catch(() => this.flash("Couldn't save.")); this.open = null; this.flash(b.name + " is back in the cellar."); } }
    else if (a === "remove") this.confirmRemove = true;
    else if (a === "remove-no") this.confirmRemove = false;
    else if (a === "remove-yes") { const b = find(v); await this.removeBottle(v).catch(() => this.flash("Couldn't remove.")); this.open = null; this.confirmRemove = false; if (b) this.flash(b.name + " removed."); }
    this.bump();
  };
  private onImgError = (e: Event): void => { const img = e.target as HTMLImageElement; this.broken.add(img.dataset.src || ""); this.bump(); };

  // ------------------------------------------------------------------ render

  private pic(b: Bottle, big = false): TemplateResult {
    const ok = b.image && !this.broken.has(b.image);
    return html`<div class=${big ? "bigbt" : "bt"}>${ok ? html`<img src=${b.image} data-src=${b.image} alt=${b.name} referrerpolicy="no-referrer" loading="lazy" @error=${this.onImgError}>` : html`<span .innerHTML=${BOTTLE}></span>`}</div>`;
  }
  private stars(n: number): TemplateResult { return html`<span class="stars" aria-label=${n + " stars"}>${[1, 2, 3, 4, 5].map((i) => html`<span class=${i <= n ? "" : "off"}>★</span>`)}</span>`; }

  protected render(): TemplateResult {
    void this._v;
    const all = this.bottles();
    const have = all.filter((b) => !b.drunk), drank = all.filter((b) => b.drunk);
    const total = have.reduce((s, b) => s + num(b.value), 0);
    // Same wine, several bottles: one tile with a count.
    const groups = new Map<string, Bottle[]>();
    have.forEach((b) => { const k = b.name.toLowerCase(); groups.set(k, [...(groups.get(k) || []), b]); });
    let tiles = [...groups.values()];
    tiles.sort((x, y) => this.sort === "value" ? num(y[0].value) - num(x[0].value) : this.sort === "added" ? (y[0].added || "").localeCompare(x[0].added || "") : x[0].name.localeCompare(y[0].name));
    const past = drank.slice().sort((x, y) => (y.drank || "").localeCompare(x.drank || ""));
    const openB = this.open ? all.find((b) => b.uid === this.open) : undefined;
    return html`<div class="wrap" @click=${this.onClick}>
      <header><div><h1 class="serif">${this.config.title || "Cellar"}</h1><div class="sub">Send Pik a photo of a bottle to add it.</div></div>
        <div class="tot"><div><b>${have.length}</b><span>bottles</span></div><div><b>${money(total)}</b><span>worth</span></div></div></header>
      <nav>
        <button class=${"chip" + (this.tab === "have" ? " on" : "")} data-a="tab" data-v="have">In the cellar <b>${have.length}</b></button>
        <button class=${"chip" + (this.tab === "drank" ? " on" : "")} data-a="tab" data-v="drank">We drank <b>${drank.length}</b></button>
        ${this.tab === "have" ? html`<span class="sort">${(["value", "added", "name"] as Sort[]).map((s) => html`<button class=${"chip" + (this.sort === s ? " on" : "")} data-a="sort" data-v=${s}>${s === "value" ? "Most valuable" : s === "added" ? "Newest" : "A–Z"}</button>`)}</span>` : nothing}
      </nav>
      <main>
        ${this.tab === "have" ? (tiles.length ? html`<div class="grid">${tiles.map((g) => { const b = g[0]; return html`<button class="tile" data-a="open" data-v=${b.uid}>
            ${this.pic(b)}${g.length > 1 ? html`<span class="cnt">×${g.length}</span>` : nothing}
            <span class="tn">${b.name}</span><span class="ts">${[b.region, b.grape].filter(Boolean).join(" · ")}</span>
            ${b.value ? html`<span class="val">${money(num(b.value))}${g.length > 1 ? " each" : ""}</span>` : nothing}</button>`; })}</div>`
          : html`<div class="how"><b>The cellar is empty.</b><span class="muted">Take a photo of a bottle (the front label) and send it to Pik with "add to the cellar". Pik finds the wine, a clean picture of the bottle and what it's worth, and it shows up here.</span></div>`)
        : (past.length ? html`<div class="grid">${past.map((b) => html`<button class="tile" data-a="open" data-v=${b.uid}>${this.pic(b)}
            <span class="tn">${b.name}</span>${this.stars(num(b.rating))}<span class="ts">${b.drank ? "Drank " + fmtDate(b.drank) : ""}</span></button>`)}</div>`
          : html`<p class="empty">Nothing yet. When you open a bottle, tap it here and choose "We drank it".</p>`)}
      </main>
      ${openB && !this.rating ? this.detail(openB, all) : nothing}
      ${this.rating ? this.rateHtml() : nothing}
      ${this.msg ? html`<div class="toast">${this.msg}</div>` : nothing}
    </div>`;
  }

  private detail(b: Bottle, all: Bottle[]): TemplateResult {
    const row = (l: string, v: string) => (v ? html`<div class="row"><span>${l}</span><b>${v}</b></div>` : nothing);
    const same = all.filter((x) => !x.drunk && x.name.toLowerCase() === b.name.toLowerCase()).length;
    const [vDate, vSrc] = (b.valued || "").split(/\s*·\s*/);
    return html`<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-label=${b.name}>
      <button class="x" data-a="close" aria-label="Close">×</button>
      ${this.pic(b, true)}
      <div class="body">
        <h2 class="serif">${b.name}</h2>
        ${b.drunk ? html`${this.stars(num(b.rating))}<p class="muted">Drank ${fmtDate(b.drank)}.${b.tasting ? " " + b.tasting : ""}</p>` : nothing}
        ${row("Producer", b.producer)}${row("Vintage", b.vintage)}${row("Region", b.region)}${row("Grape", b.grape)}
        ${b.value ? html`<div class="row"><span>Worth</span><b>${money(num(b.value))}${same > 1 ? " each · " + money(num(b.value) * same) + " for " + same : ""}<br><span class="src">${[vSrc, vDate ? "checked " + fmtDate(vDate) : ""].filter(Boolean).join(", ")}</span></b></div>` : nothing}
        ${!b.drunk && same > 1 ? row("Bottles", String(same)) : nothing}
        ${row("Added", fmtDate(b.added))}${row("Notes", b.notes)}
        <div class="acts">
          ${b.drunk ? html`<button class="btn ink" data-a="rerate" data-v=${b.uid}>Change stars</button><button class="btn" data-a="back" data-v=${b.uid}>We still have it</button>`
            : html`<button class="btn ink" data-a="drank" data-v=${b.uid}>We drank it</button>`}
          ${this.confirmRemove ? html`<span class="cf">Remove it (added by mistake)? <button class="btn sm ink" data-a="remove-yes" data-v=${b.uid}>Yes</button> <button class="btn sm" data-a="remove-no">No</button></span>`
            : html`<button class="btn" data-a="remove">Remove</button>`}
        </div>
      </div></div>`;
  }

  private rateHtml(): TemplateResult {
    const r = this.rating!;
    const b = this.bottles().find((x) => x.uid === r.uid);
    return html`<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-label="Rate it">
      <button class="x" data-a="close" aria-label="Close">×</button>
      <div class="body">
        <h2 class="serif">How was it?</h2>
        <p class="muted">${b ? b.name : ""}</p>
        <div class="rate">${[1, 2, 3, 4, 5].map((i) => html`<button class=${i <= r.stars ? "on" : ""} data-a="star" data-v=${i} aria-label=${i + " stars"}>★</button>`)}</div>
        <span class="eb">Anything to remember? (optional)</span>
        <textarea class="note" .value=${r.tasting} placeholder="e.g. Great with the short ribs. Buy again."></textarea>
        <div class="acts"><button class="btn ink" data-a="save-rating" ?disabled=${this.busy}>${this.busy ? "Saving…" : "Save"}</button><button class="btn" data-a="close">Cancel</button></div>
      </div></div>`;
  }
}

if (!customElements.get("pik-cellar-card")) {
  customElements.define("pik-cellar-card", PikCellarCard);
  (window as unknown as { customCards?: unknown[] }).customCards = (window as unknown as { customCards?: unknown[] }).customCards || [];
  ((window as unknown as { customCards: unknown[] }).customCards).push({ type: "pik-cellar-card", name: "Pik cellar", description: "Our wines: bottles, value, and stars for the ones we drank." });
}
