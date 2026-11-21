# pik-house

Pik House Feed: a Home Assistant dashboard card for the kitchen Chromebook.

- **SPEC.md**: the build spec (what to build, how it connects to Home Assistant, build phases).
- **reference/daylight-reference.html**: the working design prototype. Open it in any browser; it runs on fake data.
- **reference/pik/**: Pik's original artwork, five states.
- **card/**: the card itself, TypeScript + Lit. `card/dist/pik-house-card.js` is the one bundled file.
- **docs/**: the GitHub Pages preview (built, don't edit by hand).

## Preview (Phase 0, mock mode)

The preview runs the card on the prototype's fake data, with the Simulate event / Preview day /
Preview night buttons.

- Card: `https://wtlangdon-design.github.io/pik-house/`
- Prototype, for side-by-side checks: `https://wtlangdon-design.github.io/pik-house/reference.html`

On the Chromebook, open the link and press the full-screen key. The card is laid out at
1280×800, which is the Chromebook's full-screen size at 1.5× scale; in a smaller window it
scales down to fit.

GitHub Pages serves the `docs/` folder. One-time setup: **Settings → Pages → Build and
deployment → Source: Deploy from a branch → Branch: the branch with this code, folder `/docs`
→ Save.** After the work merges to `main`, switch the branch there to `main`.

## Building

```sh
cd card
npm install
npm run build     # type-checks, bundles card/dist/pik-house-card.js, refreshes docs/
```

Pik's five faces and the mic-off badge are read from the SVG files in `reference/pik/` at build
time, so replacing one of those files and rebuilding updates the card.

## Card config

```yaml
type: custom:pik-house-card
mock: true   # fake data plus the demo buttons
```

With no Home Assistant connection the card also runs in mock mode. Live data (`mock: false`
and the entity map in SPEC.md) arrives in Phase 1.
