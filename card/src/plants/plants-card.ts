// Pik plants: the plant catalog. One Home Assistant to-do list (todo.plants, Local To-do) holds one item
// per plant: the item's name is the plant, its description holds the details, one per line:
//   Group: Big aroids / Room: Living room / Spot: by the TV / Pot: white pot on a wood stand
//   Photo: <image id from /api/image/upload> / Since: 2026-11-23 / Sensor: 2 / Notes: …
//   Before: 2026-11-23 · Fiddle leaf fig · <photo id>   (one line per plant that used to be in this spot)
// A plant that died or left is ticked "completed", so it stays in the history.
// Photos go to Home Assistant's own image store, so they stay on the hub.
//
//   type: custom:pik-plants-card
//   entity: todo.plants
//   groups:                       # watering groups in route order, each with its soil sensor
//     - { name: Kitchen, sensor: sensor.gw1200b_soil_moisture_1, dry: 30, dry_entity: input_number.pik_dry_kitchen }
//       dry_entity (optional) holds the thirst line on the hub, shared with the house feed; dry is the fallback.
//   mock: false                   # true = sample plants, nothing saved
import { LitElement, html, nothing, type TemplateResult } from "lit";
import { plantsStyles } from "./plants-styles";

export interface PlantGroup { name: string; sensor?: string; dry?: number; dry_entity?: string }
export interface PlantsConfig { type: string; entity?: string; groups?: PlantGroup[]; mock?: boolean; title?: string }
interface HState { state: string; attributes: Record<string, unknown>; last_changed: string }
interface Hass {
  states: Record<string, HState>;
  callService(d: string, s: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  fetchWithAuth?(path: string, init?: RequestInit): Promise<Response>;
  auth?: { data?: { access_token?: string } };
  connection?: { subscribeMessage<T>(cb: (m: T) => void, msg: Record<string, unknown>): Promise<() => void> };
}
interface TodoItem { uid: string; summary: string; status: "needs_action" | "completed"; description?: string | null }
export interface Plant {
  uid: string; name: string; gone: boolean;
  group: string; room: string; spot: string; pot: string; photo: string; since: string; sensor: string; notes: string;
  before: Array<{ date: string; name: string; photo: string }>;
}
type Form = { mode: "add" | "edit" | "replace"; uid?: string; name: string; group: string; room: string; spot: string; pot: string; notes: string; photo: string; file?: File; preview?: string };

const FIELDS: Array<[keyof Plant, string]> = [["group", "Group"], ["room", "Room"], ["spot", "Spot"], ["pot", "Pot"], ["photo", "Photo"], ["since", "Since"], ["sensor", "Sensor"], ["notes", "Notes"]];
const LEAF = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42V22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M24 26c-9 0-14-6-14-14 9 0 14 6 14 14zM24 22c0-8 5-14 14-14 0 8-5 14-14 14z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = (s: string) => { if (!/^\d{4}-\d\d-\d\d$/.test(s)) return s; const d = new Date(s + "T12:00:00"); return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); };

export function parsePlant(it: TodoItem): Plant {
  const p: Plant = { uid: it.uid, name: it.summary, gone: it.status === "completed", group: "", room: "", spot: "", pot: "", photo: "", since: "", sensor: "", notes: "", before: [] };
  (it.description || "").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/);
    if (!m) return;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "before") { const [date, name, photo] = v.split(/\s*·\s*/); p.before.push({ date: date || "", name: name || "", photo: photo || "" }); return; }
    const f = FIELDS.find(([key]) => key === k);
    if (f) (p as unknown as Record<string, string>)[f[0]] = v;
  });
  return p;
}
export function describe(p: Plant): string {
  const lines = FIELDS.map(([k, label]) => [label, String(p[k] || "").replace(/\s*\n\s*/g, " ")]).filter(([, v]) => v).map(([l, v]) => l + ": " + v);
  p.before.forEach((b) => lines.push("Before: " + [b.date, b.name, b.photo].join(" · ")));
  return lines.join("\n");
}

const MOCK: TodoItem[] = [
  { uid: "m1", summary: "Nerve plant", status: "needs_action", description: "Group: Kitchen\nRoom: Kitchen\nSensor: 1\nSince: 2025-04-02" },
  { uid: "m2", summary: "Monstera", status: "needs_action", description: "Group: Big aroids\nRoom: Entry\nSpot: by the shoe rack\nSensor: 2" },
  { uid: "m3", summary: "Philodendron 'Selloum'", status: "needs_action", description: "Group: Big aroids\nRoom: Living room\nSpot: on the wooden stand\nPot: cream pot on a wood stand\nSince: 2026-11-23\nBefore: 2026-03-01 · Bird of paradise · " },
  { uid: "m4", summary: "Black ZZ 'Raven'", status: "needs_action", description: "Group: Tough guys\nRoom: Office\nSpot: shelf\nPot: yellow ribbed pot\nSince: 2026-11-23" },
  { uid: "m5", summary: "Torch cactus", status: "needs_action", description: "Group: Desert cacti\nRoom: Living room\nSpot: by the fireplace\nPot: black pot" },
  { uid: "m6", summary: "Calathea", status: "completed", description: "Group: Kitchen\nRoom: Kitchen\nSince: 2025-01-10" },
];

export class PikPlantsCard extends LitElement {
  static styles = [plantsStyles];
  static properties = { _v: { state: true } };
  private _v = 0;
  private config: PlantsConfig = { type: "custom:pik-plants-card" };
  private _hass?: Hass;
  private items: TodoItem[] = [];
  private unsub?: () => void;
  private subscribing = false;
  private open: string | null = null;
  private form: Form | null = null;
  private confirmGone = false;
  private showPast = false;
  private busy = false;
  private msg = "";
  private msgT = 0;
  private filter = "";

  setConfig(c: PlantsConfig): void { this.config = { entity: "todo.plants", groups: [], ...c }; if (this.isMock) this.items = MOCK.slice(); }
  set hass(h: Hass) { this._hass = h; if (!this.isMock && !this.unsub && !this.subscribing) this.subscribe(); this.bump(); }
  get hass(): Hass { return this._hass as Hass; }
  getCardSize(): number { return 12; }
  static getStubConfig(): PlantsConfig { return { type: "custom:pik-plants-card", entity: "todo.plants" }; }
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
    } catch (e) {
      this.flash("Couldn't read the plant list (" + this.config.entity + ").");
    } finally { this.subscribing = false; }
  }

  private plants(): Plant[] { return this.items.map(parsePlant); }
  private flash(m: string): void { this.msg = m; clearTimeout(this.msgT); this.msgT = window.setTimeout(() => { this.msg = ""; this.bump(); }, 3500); this.bump(); }
  private img(id: string, size = 512): string { return id ? `/api/image/serve/${id}/${size}x${size}` : ""; }

  // ------------------------------------------------------------------ saving

  private async save(p: Plant, isNew: boolean): Promise<void> {
    const desc = describe(p);
    if (this.isMock) {
      const it: TodoItem = { uid: p.uid || "m" + Date.now(), summary: p.name, status: p.gone ? "completed" : "needs_action", description: desc };
      const i = this.items.findIndex((x) => x.uid === it.uid);
      if (i >= 0) this.items[i] = it; else this.items.push(it);
      this.items = this.items.slice(); this.bump(); return;
    }
    const target = { entity_id: this.config.entity };
    if (isNew) await this.hass.callService("todo", "add_item", { item: p.name, description: desc }, target);
    else await this.hass.callService("todo", "update_item", { item: p.uid, rename: p.name, description: desc, status: p.gone ? "completed" : "needs_action" }, target);
  }

  /** Shrinks a phone photo (often 4000 px) to 1600 px before it goes to the hub. */
  private async shrink(f: File): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(f);
      const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise<Blob>((res) => c.toBlob((b) => res(b || f), "image/jpeg", 0.86));
    } catch (e) { return f; }
  }
  private async upload(f: File): Promise<string> {
    if (this.isMock) return "";
    const fd = new FormData();
    fd.append("file", await this.shrink(f), (f.name || "plant").replace(/\.\w+$/, "") + ".jpg");
    const h = this.hass;
    const r = h.fetchWithAuth ? await h.fetchWithAuth("/api/image/upload", { method: "POST", body: fd })
      : await fetch("/api/image/upload", { method: "POST", body: fd, headers: { Authorization: "Bearer " + (h.auth?.data?.access_token || "") } });
    if (!r.ok) throw new Error("upload " + r.status);
    const j = await r.json();
    return j.id as string;
  }

  private async submit(): Promise<void> {
    const f = this.form;
    if (!f || this.busy) return;
    if (!f.name.trim()) { this.flash("Give the plant a name first."); return; }
    this.busy = true; this.bump();
    try {
      const photo = f.file ? await this.upload(f.file) : f.photo;
      if (f.mode === "add") {
        await this.save({ uid: "", name: f.name.trim(), gone: false, group: f.group, room: f.room, spot: f.spot, pot: f.pot, photo, since: today(), sensor: "", notes: f.notes, before: [] }, true);
        this.flash(f.name.trim() + " added.");
        this.form = null;
      } else {
        const old = this.plants().find((p) => p.uid === f.uid);
        if (!old) throw new Error("gone");
        const p: Plant = { ...old, name: f.name.trim(), group: f.group, room: f.room, spot: f.spot, pot: f.pot, notes: f.notes, photo };
        if (f.mode === "replace") {
          // The new plant takes the old one's place: same group, room, spot and pot; the old one goes into its history.
          p.before = [{ date: today(), name: old.name, photo: old.photo }, ...old.before];
          p.since = today(); p.notes = "";
        }
        await this.save(p, false);
        this.flash(f.mode === "replace" ? f.name.trim() + " now has " + old.name + "'s spot." : "Saved.");
        this.form = null; this.open = p.uid;
      }
    } catch (e) {
      this.flash("Couldn't save. Check the hub is connected and try again.");
    } finally { this.busy = false; this.bump(); }
  }
  private async markGone(uid: string): Promise<void> {
    const p = this.plants().find((x) => x.uid === uid);
    if (!p) return;
    p.gone = true;
    await this.save(p, false).catch(() => this.flash("Couldn't save."));
    this.confirmGone = false; this.open = null;
    this.flash(p.name + " moved to past plants.");
  }

  // ------------------------------------------------------------------ events

  private onClick = (e: Event): void => {
    const el = (e.target as HTMLElement).closest("[data-a]") as HTMLElement | null;
    if (!el) return;
    const a = el.dataset.a!, v = el.dataset.v || "";
    const groups = this.groupNames();
    if (a === "open") { this.open = v; this.confirmGone = false; }
    else if (a === "close") { this.open = null; this.form = null; this.confirmGone = false; }
    else if (a === "add") this.form = { mode: "add", name: "", group: v || groups[0] || "", room: "", spot: "", pot: "", notes: "", photo: "" };
    else if (a === "edit" || a === "replace") {
      const p = this.plants().find((x) => x.uid === v);
      if (p) this.form = a === "edit" ? { mode: "edit", uid: p.uid, name: p.name, group: p.group, room: p.room, spot: p.spot, pot: p.pot, notes: p.notes, photo: p.photo }
        : { mode: "replace", uid: p.uid, name: "", group: p.group, room: p.room, spot: p.spot, pot: p.pot, notes: "", photo: "" };
    }
    else if (a === "cancel") this.form = null;
    else if (a === "save") { this.submit(); return; }
    else if (a === "gone") this.confirmGone = true;
    else if (a === "gone-no") this.confirmGone = false;
    else if (a === "gone-yes") { this.markGone(v); return; }
    else if (a === "past") this.showPast = !this.showPast;
    else if (a === "back") { const p = this.plants().find((x) => x.uid === v); if (p) { p.gone = false; this.save(p, false); } }
    else if (a === "filter") this.filter = this.filter === v ? "" : v;
    else if (a === "thr") {
      const cfg = (this.config.groups || []).find((x) => x.name === v), t = this.thr(cfg);
      if (cfg && cfg.dry_entity && t !== undefined && this.hass) {
        const nv = Math.max(1, Math.min(60, t + Number(el.dataset.d || 0)));
        this.hass.callService("input_number", "set_value", { value: nv }, { entity_id: cfg.dry_entity });
        this.flash(v + ": water at " + nv + "% (the house screen uses it too).");
      }
    }
    this.bump();
  };
  private onInput = (e: Event): void => {
    const t = e.target as HTMLInputElement;
    if (!this.form || !t.name) return;
    if (t.type === "file") {
      const f = t.files && t.files[0];
      if (f) { if (this.form.preview) URL.revokeObjectURL(this.form.preview); this.form.file = f; this.form.preview = URL.createObjectURL(f); }
    } else (this.form as unknown as Record<string, string>)[t.name] = t.value;
    this.bump();
  };

  // ------------------------------------------------------------------ render

  private groupNames(): string[] {
    const fromCfg = (this.config.groups || []).map((g) => g.name);
    const extra = [...new Set(this.plants().map((p) => p.group).filter((g) => g && !fromCfg.includes(g)))];
    return [...fromCfg, ...extra];
  }
  /** The group's thirst line: the shared helper on the hub if there is one, else the config number. */
  private thr(cfg?: PlantGroup): number | undefined {
    if (!cfg) return undefined;
    const e = cfg.dry_entity && this._hass ? this._hass.states[cfg.dry_entity] : undefined;
    const n = e ? Number(e.state) : NaN;
    return isFinite(n) && e ? n : cfg.dry;
  }
  private soil(g: string): { pct: number | null; dry: boolean; thr?: number; adj: boolean } {
    const cfg0 = (this.config.groups || []).find((x) => x.name === g);
    const t = this.thr(cfg0), adj = !this.isMock && !!cfg0?.dry_entity && !!this._hass?.states[cfg0.dry_entity];
    const r = this.soil0(g, cfg0 ? Object.assign({}, cfg0, { dry: t }) : undefined);
    return Object.assign(r, { thr: t, adj });
  }
  private soil0(g: string, cfg?: PlantGroup): { pct: number | null; dry: boolean } {
    const mockPct: Record<string, number> = { Kitchen: 31, "Big aroids": 44, "Tough guys": 9, "Desert cacti": 6 };
    if (this.isMock) { const n = mockPct[g]; return n === undefined ? { pct: null, dry: false } : { pct: n, dry: cfg?.dry !== undefined && n <= cfg.dry }; }
    if (!cfg || !cfg.sensor || !this._hass) return { pct: null, dry: false };
    const s = this._hass.states[cfg.sensor];
    const n = s ? Number(s.state) : NaN;
    if (!s || isNaN(n)) return { pct: null, dry: false };
    return { pct: Math.round(n), dry: cfg.dry !== undefined && n <= cfg.dry };
  }

  private tile(p: Plant): TemplateResult {
    return html`<button class="tile${p.sensor ? " ind" : ""}" data-a="open" data-v=${p.uid}>
      ${p.photo ? html`<img loading="lazy" src=${this.img(p.photo, 256)} alt="">` : html`<span class="ph" .innerHTML=${LEAF}></span>`}
      <span class="tn">${p.name}</span>
      <span class="ts">${[p.room, p.spot].filter(Boolean).join(" · ") || "Room not set"}</span>
      ${p.sensor ? html`<span class="badge" title="Soil sensor ${p.sensor}">Sensor ${p.sensor}</span>` : nothing}
    </button>`;
  }

  render() {
    const all = this.plants(), live = all.filter((p) => !p.gone), past = all.filter((p) => p.gone);
    const groups = this.groupNames();
    const noGroup = live.filter((p) => !p.group || !groups.includes(p.group));
    const shown = this.filter ? groups.filter((g) => g === this.filter) : groups;
    return html`<div class="wrap" @click=${this.onClick} @input=${this.onInput} @change=${this.onInput}>
      <header>
        <div><h1 class="serif">${this.config.title || "Plants"}</h1><span class="sub">${live.length} in the catalog${past.length ? " · " + past.length + " past" : ""}</span></div>
        <button class="btn ink" data-a="add">+ Add a plant</button>
      </header>
      <nav>${groups.map((g) => { const s = this.soil(g), n = live.filter((p) => p.group === g).length; return html`<button class="chip${this.filter === g ? " on" : ""}${s.dry ? " dry" : ""}" data-a="filter" data-v=${g}>${g} <b>${n}</b>${s.pct !== null ? html`<i>${s.pct}%</i>` : nothing}</button>`; })}</nav>
      <main>
        ${shown.map((g) => {
          const list = live.filter((p) => p.group === g), s = this.soil(g);
          return html`<section>
            <div class="gh"><h2>${g}</h2>
              ${s.pct !== null ? html`<span class="soil${s.dry ? " dry" : ""}"><span class="bar"><i style="width:${Math.min(100, s.pct)}%"></i></span>${s.pct}% soil moisture${s.dry ? " · time to water" : ""}</span>` : html`<span class="soil none">No sensor reading yet</span>`}
              ${s.thr !== undefined && s.pct !== null ? html`<span class="thr">Water at ${s.thr}%${s.adj ? html`<button class="tb" data-a="thr" data-v=${g} data-d="-1" aria-label="Lower ${g}'s line">−</button><button class="tb" data-a="thr" data-v=${g} data-d="1" aria-label="Raise ${g}'s line">+</button>` : nothing}</span>` : nothing}
              <button class="lnk" data-a="add" data-v=${g}>+ Add</button></div>
            ${list.length ? html`<div class="grid">${list.map((p) => this.tile(p))}</div>` : html`<p class="empty">No plants in this group yet.</p>`}
          </section>`;
        })}
        ${!this.filter && noGroup.length ? html`<section><div class="gh"><h2>No group yet</h2></div><div class="grid">${noGroup.map((p) => this.tile(p))}</div></section>` : nothing}
        ${past.length ? html`<section class="pastsec"><button class="lnk" data-a="past">${this.showPast ? "Hide" : "Show"} past plants (${past.length})</button>
          ${this.showPast ? html`<div class="grid past">${past.map((p) => this.tile(p))}</div>` : nothing}</section>` : nothing}
      </main>
      ${this.open && !this.form ? this.detail(all.find((p) => p.uid === this.open)) : nothing}
      ${this.form ? this.formHtml() : nothing}
      ${this.msg ? html`<div class="toast" role="status">${this.msg}</div>` : nothing}
    </div>`;
  }

  private detail(p?: Plant): TemplateResult | typeof nothing {
    if (!p) return nothing;
    const s = this.soil(p.group);
    const row = (l: string, v: string) => (v ? html`<div class="row"><span>${l}</span><b>${v}</b></div>` : nothing);
    return html`<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-label=${p.name}>
      <button class="x" data-a="close" aria-label="Close">×</button>
      ${p.photo ? html`<img class="big" src=${this.img(p.photo, 1024)} alt=${p.name}>` : html`<div class="big ph" .innerHTML=${LEAF}></div>`}
      <div class="body">
        <h2 class="serif">${p.name}</h2>
        ${p.gone ? html`<p class="muted">A past plant.</p>` : nothing}
        ${row("Group", p.group)}${row("Room", p.room)}${row("Spot", p.spot)}${row("Pot", p.pot)}
        ${row("Here since", fmtDate(p.since))}
        ${p.sensor ? row("Soil sensor", p.sensor + (s.pct !== null ? " · " + s.pct + "% now" : "")) : nothing}
        ${row("Notes", p.notes)}
        ${p.before.length ? html`<div class="hist"><span class="eb">Before in this spot</span>${p.before.map((b) => html`<div class="hrow">${b.photo ? html`<img src=${this.img(b.photo, 128)} alt="">` : html`<span class="ph sm" .innerHTML=${LEAF}></span>`}<span><b>${b.name}</b> · until ${fmtDate(b.date)}</span></div>`)}</div>` : nothing}
        <div class="acts">
          ${p.gone ? html`<button class="btn" data-a="back" data-v=${p.uid}>It's back</button>` : html`
          <button class="btn ink" data-a="replace" data-v=${p.uid} title="A new plant takes this one's spot, pot and group">Replace with a new plant</button>
          <button class="btn" data-a="edit" data-v=${p.uid}>Edit</button>
          ${this.confirmGone ? html`<span class="cf">Move to past plants? <button class="btn sm ink" data-a="gone-yes" data-v=${p.uid}>Yes</button> <button class="btn sm" data-a="gone-no">No</button></span>`
            : html`<button class="btn" data-a="gone">Died or gone</button>`}`}
        </div>
      </div></div>`;
  }

  private formHtml(): TemplateResult {
    const f = this.form!;
    const groups = this.groupNames();
    const old = f.uid ? this.plants().find((p) => p.uid === f.uid) : undefined;
    const title = f.mode === "add" ? "Add a plant" : f.mode === "replace" ? "Replace " + (old ? old.name : "") : "Edit " + (old ? old.name : "");
    const pic = f.preview || (f.photo ? this.img(f.photo, 512) : "");
    const inp = (name: keyof Form, label: string, ph = "") => html`<label><span>${label}</span><input name=${name} .value=${String(f[name] || "")} placeholder=${ph} autocomplete="off"></label>`;
    return html`<div class="scrim" data-a="cancel"></div><div class="sheet form" role="dialog" aria-label=${title}>
      <button class="x" data-a="cancel" aria-label="Close">×</button>
      <div class="body">
        <h2 class="serif">${title}</h2>
        ${f.mode === "replace" ? html`<p class="muted">The new plant takes over this spot, pot and watering group. ${old ? old.name : "The old plant"} is kept in the spot's history.</p>` : nothing}
        <label class="photo">${pic ? html`<img src=${pic} alt="">` : html`<span class="ph" .innerHTML=${LEAF}></span>`}
          <span class="btn">${pic ? "Change photo" : "Add a photo"}</span>
          <input type="file" name="file" accept="image/*"></label>
        ${inp("name", "Name", f.mode === "replace" ? "The new plant's name" : "e.g. Black ZZ 'Raven'")}
        <label><span>Group</span><select name="group">${[...groups, ""].map((g) => html`<option value=${g} ?selected=${g === f.group}>${g || "No group yet"}</option>`)}</select></label>
        <div class="two">${inp("room", "Room", "e.g. Living room")}${inp("spot", "Spot", "e.g. by the fireplace")}</div>
        ${inp("pot", "Pot", "e.g. black pot")}
        ${inp("notes", "Notes")}
        <div class="acts"><button class="btn ink" data-a="save" ?disabled=${this.busy}>${this.busy ? "Saving…" : f.mode === "add" ? "Add plant" : "Save"}</button><button class="btn" data-a="cancel">Cancel</button></div>
      </div></div>`;
  }
}

if (!customElements.get("pik-plants-card")) {
  customElements.define("pik-plants-card", PikPlantsCard);
  (window as unknown as { customCards?: unknown[] }).customCards = (window as unknown as { customCards?: unknown[] }).customCards || [];
  ((window as unknown as { customCards: unknown[] }).customCards).push({ type: "pik-plants-card", name: "Pik plants", description: "The plant catalog: photos, groups, soil readings." });
}
