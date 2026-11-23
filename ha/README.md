# Home Assistant files

Everything here goes onto the Home Assistant Green. Nothing in this folder runs on its own.

| File | What it is |
|---|---|
| `packages/pik_kitchen.yaml` | The shared kitchen timer pool (12 timers), the timer scripts Pik uses, and `script.pik_announce`, which speaks on every Echo and can push to both phones. |
| `packages/pik_holiday_thanksgiving_2026.yaml` | Holiday cooking mode for Thanksgiving. **Generated** from `holiday/thanksgiving-2026.json` by `node holiday/gen-ha.mjs thanksgiving-2026 tg26`; don't edit it by hand. `node holiday/check-plan.mjs` cross-checks the plan (it also runs on every card build). |
| `dashboards/thanksgiving.yaml` | The Thanksgiving dashboard: one page for the Chromebook (`/kitchen`) and one for the Echo Show 15 (`/echo`). |
| `../card/dist/pik-house-card.js` | The card file. It contains both the house feed and the holiday card. |

Only one holiday package can be installed at a time (they share the `holiday_*` script names
Pik uses). When the next holiday comes, delete the old file and add the new one.

## Thanksgiving setup (about 20 minutes, before Tuesday at 7 PM)

Do this on the Chromebook after Home Assistant is set up and you can log in. Steps marked
**(skip if done)** may already be done from the main setup.

**1. Turn on Advanced mode** (skip if done). Click your name at the bottom left of Home
Assistant → turn on **Advanced mode**. This shows the Resources menu used in step 6.

**2. Install File editor** (skip if done). Settings → Add-ons → **Add-on store** → search
"File editor" → **Install** → **Start** → turn on **Show in sidebar**.

**3. Download the four files.** On GitHub, open each file below and click the **Download raw
file** button (the down arrow at the top right of the file):

- `ha/packages/pik_kitchen.yaml`
- `ha/packages/pik_holiday_thanksgiving_2026.yaml`
- `card/dist/pik-house-card.js`
- `ha/dashboards/thanksgiving.yaml` (you'll copy from this one in step 7)

**4. Put the files on the hub.** Open **File editor** from the sidebar.

1. Click the folder icon at the top left. You're in `/homeassistant`.
2. Click the **new folder** icon, name it `packages`. Open it, click the **upload** icon, and
   upload `pik_kitchen.yaml` and `pik_holiday_thanksgiving_2026.yaml`.
3. Go back up to `/homeassistant`. If there's no `www` folder, make one. Open it and upload
   `pik-house-card.js`.

**5. Turn on packages and restart.**

1. In File editor, open `configuration.yaml`.
2. If the file already has a line that says `homeassistant:`, add this line right under it,
   indented by two spaces. If it doesn't, add both lines at the very bottom:

   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
3. Click the red **Save** icon.
4. Settings → three dots (top right) → **Restart Home Assistant** → **Restart**. If it says
   the configuration has a problem, stop and send Claude a screenshot.

**6. Add the card.** Settings → Dashboards → three dots (top right) → **Resources** →
**Add resource**. URL: `/local/pik-house-card.js?v=1`. Type: **JavaScript module**. Create.

**7. Make the Thanksgiving dashboard.**

1. Settings → Dashboards → **Add dashboard** → **New dashboard from scratch**.
   Title: `Thanksgiving`. Icon: `mdi:turkey`. Create.
2. Open it from the sidebar → pencil (top right) → three dots → **Raw configuration editor**.
3. Delete everything there, paste the whole of `thanksgiving.yaml`, and **Save**. Close the editor.

You should see the Thanksgiving Kitchen screen: the clock, the smoker, oven and stove, today's
tasks, and the 12 dishes.
If it says **"this screen only"** at the top, the packages didn't load; recheck step 5.

**8. Echos and phones.** If the Alexa Devices integration is set up (main setup), Echo
announcements already work. Test it: Settings → Developer tools → **Actions** → choose
**Pik: announce** → type a message → **Perform action**. Every Echo should say it.
For phone pushes ("the turkey is done"), each of you only needs the Home Assistant app
signed in on your phone.

**9. Let Pik help.** Settings → Voice assistants → **Expose** tab → **Expose entities**. Tick
these nine, then **Expose**:

- Holiday cooking: what's next · Holiday cooking: tick a task off · Holiday cooking: log turkey temperatures · Holiday cooking: recipe step · Holiday cooking: put on / take off
- Kitchen timer: start · Kitchen timer: stop or acknowledge · Kitchen timer: add time · Kitchen timers: what's running

Then Settings → Devices & services → **Anthropic** → **Configure** on Pik's conversation
agent, and add this paragraph to the end of the instructions:

> Holiday cooking: while a holiday plan is running, use holiday_whats_next for "what's next",
> "where are we" and "how's the turkey"; holiday_task_done when someone says a task is done
> ("the stuffing's in"); holiday_log_turkey for probe readings ("the breast is 158");
> holiday_step for "next step", "go back", "say that again" and "read me the gravy steps" (it walks
> one recipe from start to finish, like the cards on the screens; read the step out; if it has a
> timer, offer to start it; when a part is finished, tick it off with holiday_task_done);
> holiday_place when something goes on a burner, in the oven or on the smoker, or comes off ("the
> cranberry sauce is on", "put the gravy on burner 3", "take the potatoes off"). Use
> kitchen_timer for every timer, kitchen_timer_stop to stop or silence one, and
> kitchen_timers_list for "how long on the…". The turkey is done only at 165°F in the breast,
> thigh and wing; never call it done from the clock. Keep answers short; the cooks' hands are full.

**10. On the screens.**

- **Chromebook:** open the Thanksgiving dashboard, go full screen, and tap the screen once
  (so alarms can make sound). Settings → Device → Power → while charging, keep the display on.
- **Echo Show 15:** open Silk, go to the same address as on the Chromebook but ending in
  `/echo` (for example `http://homeassistant.local:8123/dashboard-thanksgiving/echo`), sign in,
  and tap once.

**11. If you started on the Thanksgiving page.** On the page: **Plan & recipes → Settings** (at the
bottom) **→ Copy progress for the hub**. On the hub: **Plan & recipes → Settings** → paste → **Bring it
over**. Ticks, recipe steps, running timers (like the brine) and turkey readings come across.
After that, use only the hub; the page stays as a backup.

## Tuesday rehearsal (15 minutes, before 7 PM)

Do this once the steps above are done. Each check takes a minute.

1. **The Echo talks.** Settings → Automations & scenes → Scripts → **Pik: announce** → ⋮ → Run.
   The Echo Show 15 should say the test message. If it doesn't, the task alarms won't either.
2. **The kitchen page is up on both screens.** Chromebook: the Thanksgiving dashboard, full screen.
   Echo Show 15: `/dashboard-thanksgiving/echo`. Tap each screen once so it can make sound.
3. **They agree.** On the Chromebook, tap **Tue** at the top of "Coming up", then tick the 7:00
   turkey card. Within a couple of seconds it's ticked on the Echo too. Tap the tick again to undo.
4. **A timer rings.** On any card tap **Set N min timer**, then on the Echo tap the timer's **×**.
   It should disappear on both. Then ask Pik to "set a 1 minute timer" and wait for it to ring on
   both screens.
5. **The burner buttons.** Tap the burner icon on the cranberry sauce card: burner 1 lights up on
   both screens. Tap it again to take it off.
6. **Pik answers.** Ask "what's next?" and "what's the next step for the turkey?"
7. **The screens stay on.** Leave both alone for 10 minutes. If the Echo Show goes back to its
   home screen, set its screen timeout to never in its settings, and reopen the page.

If the hub isn't ready by 7:00, start on the backup page and move your progress over later
(step 11).

## How it behaves

- One page, run by the clock: what's on the smoker, oven and each burner (what's next and when);
  one card per recipe whose part is due now, showing its step and just that step's ingredients
  (‹ › walk through the whole recipe, Tuesday to Thursday, and the time moves with the steps; tick
  a part off and the card moves on; tap the dish name for the whole recipe); the next few recipes;
  the timers ("Set 5 min timer", then the time left); and where each of the 12 dishes is.
- Rush hour: when three or more things are due at once, every card shrinks to one line (time,
  dish, what to do, its buttons) and only the one you tap opens to show its step.
- Where something could slip (turkey early or late, smoker trouble, not enough drippings,
  stuffing not at 165°F), the card has a "⚠ …?" line; tap it for what to do.
- When several things come due together, the Echo says them in one short line ("Four things at
  3:00: stuffing, green bean casserole, lobster mac and mashed potatoes. Check the screen.").
- Burner, oven and smoker emblems on the cards (the burner number on top): tap one when the dish
  goes on and the tile at the top shows it, with how long it's been on. Tap it again to take it off;
  ticking off the part that ends it frees the burner by itself. A dish the plan expects but nobody
  has put on shows faded on its tile; if its burner is taken, the emblem turns red and offers the
  free burners. From 3:00 Thursday the dish list becomes the
  "keeping hot" check: tap **140°F ✓** for each hot dish at 3:55.
- Recipes and the full schedule (tick or undo anything) are one tap away under **Plan & recipes**,
  with Settings (moving progress over, starting over) folded at the bottom.

- Every screen shows the same ticks, timers and turkey readings within a second or two.
- At each task's time, every screen chimes (and keeps chiming every 30 s until **Got it**),
  and the Echos read it out. Mute the Echos from the Now tab if it gets too much.
- Timers are shared: start one on the Chromebook, stop it on the Echo Show, or ask Pik.
  "+5" on any screen adds five minutes everywhere.
- Logging 165°F in the breast, thigh and wing announces "the turkey is done" on the Echos
  and both phones.
- If the internet goes down, everything above keeps working except the Echo announcements
  and Pik's voice (both need Amazon's and Anthropic's servers).
