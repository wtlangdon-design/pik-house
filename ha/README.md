# Home Assistant files

Everything here goes onto the Home Assistant Green. Nothing in this folder runs on its own.

| File | What it is |
|---|---|
| `packages/pik_kitchen.yaml` | The shared kitchen timer pool (12 timers), the timer scripts Pik uses, and `script.pik_announce`, which speaks on the chosen Echos and can push to both phones. |
| `packages/pik_holiday_thanksgiving_2026.yaml` | Holiday cooking mode for Thanksgiving. **Generated** from `holiday/thanksgiving-2026.json` by `node holiday/gen-ha.mjs thanksgiving-2026 tg26`; don't edit it by hand. `node holiday/check-plan.mjs` cross-checks the plan (it also runs on every card build). |
| `packages/pik_smoke.yaml` | Smoking with the Inkbird: finds its four probes by itself, watches them every minute, and has Pik speak up (almost there, done, the stall, the smoker dropping, a probe lost). **Generated** by `node ha/gen-smoke.mjs`. |
| `dashboards/smoking.yaml` | The Smoking dashboard: the four probes on one page. |
| `dashboards/thanksgiving.yaml` | The Thanksgiving dashboard: one page for the Chromebook (`/kitchen`) and one for the Echo Show 15 (`/echo`). |
| `../card/dist/pik-house-card.js` | The card file. It contains both the house feed and the holiday card. |

Only one holiday package can be installed at a time (they share the `holiday_*` script names
Pik uses). When the next holiday comes, delete the old file and add the new one.

## Thanksgiving setup (about 20 minutes, before Tuesday at 7 PM)

Do this on the Chromebook after Home Assistant is set up and you can log in. Steps marked
**(skip if done)** may already be done from the main setup.

**1. Turn on Advanced mode** (skip if done). Click your name at the bottom left of Home
Assistant → turn on **Advanced mode**. This shows the Resources menu used in step 6.

**2. Install File editor** (skip if done). Settings → **Apps** (Home Assistant called these
"Add-ons" until this year; older guides still say that) → **App store** → search "File editor" →
**Install** → **Start** → turn on **Show in sidebar**.

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
4. Check it first: Settings → **Developer tools** → **YAML** tab → **Check configuration**. It should
   say the configuration is valid. If it shows an error, stop and send Claude a screenshot.
5. Settings → three dots (top right) → **Restart Home Assistant** → **Restart**.
6. Check the time zone: Settings → **System** → **General**. Time zone must be
   **America/Los_Angeles** (every alarm runs on the hub's clock).

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
**Pik: announce** → type a message → **Perform action**. The chosen Echos should say it.
To choose them: Settings → Devices & services → **Helpers** → **Pik: Echos that announce**, and enter
their announce entities, comma-separated (for example `notify.kitchen_echo_show_15_announce`). Left empty,
every Echo speaks (never Fire TVs or speaker groups).
For phone pushes ("the turkey is done"), each of you only needs the Home Assistant app
signed in on your phone.

**9. Let Pik help.** Settings → Voice assistants → **Expose** tab → **Expose entities**. Tick
these twelve, then **Expose**:

- Holiday cooking: what's next · Holiday cooking: tick a task off · Holiday cooking: log turkey temperatures · Holiday cooking: recipe step · Holiday cooking: put on / take off · Holiday cooking: open or fold a card · Holiday cooking: kitchen controls · Holiday cooking: running behind
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
> cranberry sauce is on", "put the gravy on burner 3", "take the potatoes off"); holiday_card to
> open or fold a recipe's card on the screens ("open the turkey card", "collapse the stuffing").
> For "next step on the stuffing", call holiday_step with that dish. holiday_kitchen for "got it"
> (clears the alarms on every screen), a hot dish reading 140°F or more at the final check ("the
> gravy is 150"), and turning the Echo's task announcements off or on. If a step has
> if_something_slips, mention it only when asked or when things are going wrong. Use
> kitchen_timer for every timer, kitchen_timer_stop to stop or silence one, and
> kitchen_timers_list for "how long on the…". The turkey is done only at 165°F in the breast,
> thigh and wing; never call it done from the clock. holiday_behind when the kitchen is behind or ahead
> ("we're 20 minutes behind", "the turkey's running 30 minutes late", "we're back on schedule"); read
> back its message. Keep answers short; the cooks' hands are full.

**10. On the screens.**

- **Chromebook:** open the Thanksgiving dashboard and go full screen. Sound starts on (the
  speaker button at the top mutes it); if the browser holds it back, your first tap anywhere turns it on. Settings → Device → Power → while charging, keep the display on.
- **Echo Show 15:** open Silk, go to the same address as on the Chromebook but ending in
  `/echo` (on this hub the Echo needs the number address: `http://192.168.1.106/dashboard-thanksgiving/echo`) and sign in.
  It shows the **far view**: big type for reading from the stove (the time, what to do now, what's next, timers,
  the turkey's temperatures, and a full-screen alarm with one big **Got it**). Recipes and burners stay on the Chromebook.

**11. If you started on the Thanksgiving page.** On the page: **Plan & recipes → Settings** (at the
bottom) **→ Copy progress for the hub**. On the hub: **Plan & recipes → Settings** → paste → **Bring it
over**. Ticks, recipe steps, running timers (like the brine) and turkey readings come across.
After that, use only the hub; the page stays as a backup.

## Tuesday rehearsal (15 minutes, before 7 PM)

Do this once the steps above are done. Each check takes a minute.

1. **The Echo and phones talk.** Settings → **Developer tools** → **Actions** → choose
   **Pik: announce** → type "test" → turn on **Also push to both phones** → **Perform action**.
   The Echo Show 15 should say it, and both phones should get it (check them locked, too). If the
   Echo is silent, the task alarms will be too. If a phone gets nothing, send Claude a screenshot
   of Settings → Devices & services → **Mobile App**.
   Also set a plain alarm on your phone for **Wednesday 9:00 AM: turkey out of the brine**, as a
   backup that doesn't depend on the hub.
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

- **Running behind?** Tap **Behind?** at the top (or tell Pik "we're 20 minutes behind" or "the turkey's
  running 30 minutes late"). Pick how much and what's late: everything, or one dish (dishes that wait on it,
  like the gravy on the turkey, move with it). Everything still to come moves: the cards, the alarms, the
  Echo announcements and the dinner countdown. Nothing gets ticked off for you, and the turkey is still done
  only at 165°F. **Back on schedule** undoes it.
- **Chimes:** an ordinary task chimes three times and then waits quietly on the bar until **Got it**. A
  finished timer and anything about the turkey keep chiming until someone taps **Got it**.
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
- At each task's time, every screen chimes (three times for an ordinary task; timers and the turkey keep
  chiming until **Got it**), and the Echos read it out. Mute the Echos from the Now tab if it gets too much.
- Timers are shared: start one on the Chromebook, stop it on the Echo Show, or ask Pik.
  "+5" on any screen adds five minutes everywhere.
- Logging 165°F in the breast, thigh and wing announces it on the Echos and both phones, with a reminder
  to check each spot with the instant-read before it comes off.
- If the internet goes down, everything above keeps working except the Echo announcements
  and Pik's voice (both need Amazon's and Anthropic's servers).

## Smoking with the Inkbird (about 15 minutes, once)

This works for every cook on the smoker, not just Thanksgiving. You need the Inkbird IBT-4XS
and a Bluetooth stick that Home Assistant supports: the **StarTech USBA-BLUETOOTH-V5-C2**
(Bluetooth 5.0; on Home Assistant's list of known working adapters;
https://www.amazon.com/dp/B0B2737HPS, with the "Bluetooth 5.0" size selected). The TP-Link UB500 is
on Home Assistant's **unsupported** list, so don't use it.

**1. Plug the stick into the hub.** Put the Bluetooth stick in either USB port on the back of the
Home Assistant Green. Then go to Settings → Devices & services. **Bluetooth** should appear under
"Discovered" within a minute. Tap **Add**, then **Submit**. If it doesn't appear, restart the hub
(Settings → three dots → **Restart Home Assistant**) and look again. If the Inkbird later keeps
dropping out, unplug the stick and plug it back in; some sticks need that after a hiccup.

**2. Turn on the Inkbird.** Charge it, plug in at least one probe, and hold the power button until
the screen lights up. Within a minute, Settings → Devices & services shows an **INKBIRD** device
(it may be called "iBBQ") under "Discovered". Tap **Add**, then **Submit**. You don't need the
Inkbird phone app.

**3. Put the new files on the hub.** Download these from GitHub, the same way as Thanksgiving
step 3, and upload them in File editor:

- `ha/packages/pik_smoke.yaml` into the `packages` folder (new).
- `ha/packages/pik_kitchen.yaml` and `ha/packages/pik_holiday_thanksgiving_2026.yaml` into the
  `packages` folder. Say yes to replacing the old ones (both changed so the turkey reads itself).
- `card/dist/pik-house-card.js` into the `www` folder, replacing the old one.

Then Settings → Dashboards → three dots → **Resources** → tap the `pik-house-card.js` line and
change the end from `?v=1` to `?v=2` (any new number makes the screens load the new version). Then
**Restart Home Assistant**.

**4. Make the Smoking dashboard.** Settings → Dashboards → **Add dashboard** → **New dashboard
from scratch**. Title: `Smoking`. Icon: `mdi:grill`. Open it → pencil → three dots → **Raw
configuration editor** → paste all of `ha/dashboards/smoking.yaml` → **Save**.

**5. Let Pik use it.** Settings → Voice assistants → **Expose** → **Expose entities**. (Or open
each script under Settings → Automations & scenes → Scripts → ⋮ → Settings → Voice assistants and
turn exposing on there; it's the same switch.) Tick these four:

- Smoking: set a probe · Smoking: how's it going · Smoking: got it · Smoking: end the cook

Then add this paragraph to Pik's instructions (Settings → Devices & services → Anthropic →
**Configure**):

> Smoking: the Inkbird's four probes report to the hub by themselves. Use smoke_probe when someone
> says what a probe is in ("probe 1 is the brisket", "probe 4 is the smoker at 250", "take the pork
> to 200", "clear probe 3"); it knows the usual pull temperatures, so only ask if it says it needs
> one. Use smoke_status for "how's the brisket", "what's the smoker at" and "how long on the pork";
> say the temperature first, then the rough time to go, and say it's a guess because big cuts stall.
> Use smoke_got_it when someone says they pulled it or "got it", and smoke_end for "we're done
> smoking". Keep answers short.

**6. Try it (2 minutes).** Put probe 1 in a mug of hot tap water. Within two minutes the Smoking
page shows the temperature and the cook starts by itself, and the Echo asks what each probe is in.
Say "Pik, probe 1 is the brisket." The tile changes to Brisket, pull at 203°. Then say "Pik, we're
done smoking."

### Every cook

- Turn the Inkbird on and plug the probes in. The hub notices within a minute or two.
- Tell Pik what each probe is in, or tap a tile on the Smoking page and pick (Brisket, Pork
  shoulder, Ribs, Turkey, Chicken, Salmon, Pork loin, Prime rib, Smoker, or type something else).
  For a probe hanging in the smoker's air, pick **Smoker** and set its temperature.
- Pik speaks up on the Echos (and your phones for "done" and problems) when a probe is 10° away,
  when it hits its temperature (then twice more, 10 minutes apart, until you say "got it"), when a
  big cut has sat in the stall for half an hour, when the smoker drops fast or is 25° off its
  setting for 10 minutes (once it has reached its setting), when a probe reads hotter than meat can
  get (it has slipped out), and when a probe or the whole Inkbird stops reading (within about 5 minutes).
- The 🔊 button on the Smoking page mutes Pik for this; the screen still shows everything.
- Turn the Inkbird off when you're done. The cook ends by itself 30 minutes later, or say
  "we're done smoking." The next cook starts fresh.

**Range.** The Inkbird's display box talks to the stick on the hub. If the Smoking page often
says "Not reading" while the Inkbird is on, put the display box on the side of the smoker nearest
the house (it must stay off hot metal; Inkbird says the plastic can't take more than 176°F).

### Thanksgiving with the Inkbird

At 9:15 AM Thursday, when the smoker starts, the hub sets the probes up by itself:
**probe 1 = breast, 2 = thigh, 3 = wing, 4 = the smoker's air** (clip it to the grate, not
touching the turkey). Plug the probes into those numbered ports. Probe 4 follows the plan's smoker
temperature (250°F, then about 340°F from 12:30, then the hot hold). From then on their readings go
straight into the turkey log once the turkey goes on at 10:00 (readings above 212°F are ignored,
since that means a probe is out of the meat): the turkey screen says "Inkbird · live", the hourly turkey check on
the Echo reads the three temperatures out, and "the turkey is done" fires on its own at 165° in all
three. You can still type or say a reading to correct one. Before the turkey comes off, confirm
with your instant-read thermometer in each spot.

