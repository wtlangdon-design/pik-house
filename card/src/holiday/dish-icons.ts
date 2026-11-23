// Line icons for the 12 dishes, drawn the same way as the burner, oven and smoker emblems:
// 24×24, 2px round strokes in the current color, no fills except tiny dots.
const I = (body: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const dot = (x: number, y: number, r = 1.1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;

export const DISH_ICON: Record<string, string> = {
  // deviled egg half: the white and a piped yolk
  eggs: I(`<ellipse cx="12" cy="12.5" rx="9" ry="6.5"/><circle cx="12" cy="12.5" r="2.8"/>`),
  // salmon roe dip: a bowl topped with roe
  dip: I(`<path d="M3 12h18c-.5 4.5-4.2 8-9 8s-8.5-3.5-9-8z"/>${dot(8.5, 9.3)}${dot(12, 8.2)}${dot(15.5, 9.3)}${dot(10.3, 6.2)}${dot(13.8, 6.2)}`),
  // turkey: a drumstick
  turkey: I(`<path d="M13.2 12.6C11 10 12 4 16.6 4 19.2 4 21 5.8 21 8.4c0 4.6-6 5.6-7.8 4.2z"/><path d="M13.2 12.6 7.6 18.2"/><path d="M7.6 18.2a1.8 1.8 0 1 1-2.6 1.7 1.8 1.8 0 1 1 1.7-2.6 1.8 1.8 0 0 1 .9.9z"/>`),
  // gravy: a gravy boat
  gravy: I(`<path d="M4 10h11.5c2.3 0 4.3-.8 5.5-2.5-.4 5-3.6 9-9 9h-2C6.8 16.5 4.4 13.8 4 10z"/><path d="M4 10c-1.8 0-2.3 3.2.4 3.4"/><path d="M8.5 19.5h7"/>`),
  // stuffing: a casserole heaped with bread pieces
  stuffing: I(`<path d="M4 11h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M2 12.5h2M20 12.5h2"/><rect x="7.5" y="5.5" width="3.5" height="3.5" rx=".8"/><rect x="13" y="5.5" width="3.5" height="3.5" rx=".8"/>`),
  // green bean casserole: a baking dish with beans
  gbc: I(`<rect x="3" y="7" width="18" height="11" rx="2.5"/><path d="M7 11h6M11 14.5h6"/>`),
  // Brussels sprouts: a sprout with its leaves
  sprouts: I(`<circle cx="12" cy="13" r="7"/><path d="M12 6v14"/><path d="M12 10.5c-2.6 0-4.3 1.6-5 3.8M12 10.5c2.6 0 4.3 1.6 5 3.8"/><path d="M12 6c0-1.6 1-2.8 2.6-3"/>`),
  // mashed potatoes: a bowl with a mound and a pat of butter
  mash: I(`<path d="M3 13h18c-.5 4-4.2 7-9 7s-8.5-3-9-7z"/><path d="M6.5 13c.3-3.3 2.6-5.5 5.5-5.5s5.2 2.2 5.5 5.5"/>`),
  // lobster mac: two elbow macaroni
  mac: I(`<path d="M4 19v-1a9 9 0 0 1 9-9h2v4h-2a5 5 0 0 0-5 5v1z"/>`),
  // cranberry sauce: a bowl of berries
  cran: I(`<path d="M3 13h18c-.5 4-4.2 7-9 7s-8.5-3-9-7z"/><circle cx="8.5" cy="9.5" r="2.2"/><circle cx="12.5" cy="7.8" r="2.2"/><circle cx="16" cy="10" r="2"/>`),
  // salad: a leaf
  salad: I(`<path d="M5 19C5 10.5 10 5 19 5c0 9-5.5 14-14 14z"/><path d="M5 19l9-9"/><path d="M9.5 14.5V12M12 12h2"/>`),
  // gooey butter cake: a square with its gooey top and sugar
  cake: I(`<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10.5h16"/>${dot(8, 7.7, 0.9)}${dot(12, 7.4, 0.9)}${dot(16, 7.7, 0.9)}`),
};
