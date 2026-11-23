# Pik House Feed: Build Spec

Nov 21, 2026 · Tyler Langdon · Living version: https://claude.ai/artifact/WBhqdogTLhmR8pmf2NhLMX

## Summary

Build one custom Home Assistant dashboard card, the **Pik House Feed**, that runs full-screen on a Chromebook standing in tent mode on the kitchen counter. It shows the locked **Daylight** design: Pik on the left, one item at a time in a speech bubble, status pebbles along the bottom, and detail sheets that slide up. Claude, running inside Home Assistant, is the brain behind Pik's voice and the email-reading cards.

The working prototype is the reference for every visual and interaction decision. It ships as **reference/daylight-reference.html** in this repo and runs in any browser with fake data. Pik's original artwork (five states) is in **reference/pik/**. The Phase 6 screens (calendars, cooking and fix-it modes, plant doctor, house history, freeze smarts) are in **reference/daylight-features-reference.html**, a superset of the main reference.

What Claude Code builds:

1. **The card**: a TypeScript + Lit custom card, bundled to one JavaScript file and installed through HACS.
2. **Home Assistant config packages**: YAML for the helpers, scripts and automations that feed the card (the "Needs you" feed, plant thirst, reminders, essentials-only mode).
3. **A mock mode**: the card runs against fake data on the Chromebook before the hub arrives, so the design can be tested on the real screen first.

Out of scope for v1: myQ/garage, leak sensors, door locks, Whirlpool, the bedroom voice speaker, and video on the Chromebook itself.

## Decisions already made

These are settled. Claude Code should not revisit them without asking Tyler.

| Area | Decision | Home Assistant piece |
| --- | --- | --- |
| Hub | Home Assistant Green, with Home Assistant Cloud (Link) for voice and remote access | Built in |
| Screen | Acer Chromebook Plus Spin 714, 14", 1920×1200, tent mode. Layout is 1280×800 CSS px at 1.5× scale | Chrome, full screen |
| Voice on the screen | The Chromebook's browser is the microphone and speaker | Voice Satellite (HACS) |
| Brain | Claude as the conversation agent and for AI Task | Anthropic integration |
| Face | Pik "Porch Light" artwork (5 states from Tyler) plus a 6th **Heads up** state | In the card |
| Design | Daylight, locked. Light theme by day, dark after sunset, quiet hours 11 PM to 7 AM | In the card |
| Music and Judy Justice | Played on the existing Echo Show from Amazon Music and Prime Video. Pik relays requests | Alexa Devices (core) |
| Plants | 83 plants in 7 watering groups, one Ecowitt WH51 soil sensor per group in its indicator plant (full list: Pik House Plants sheet). The pitcher plant has no sensor: a weekly reminder card instead | Ecowitt (GW1200 gateway) |
| Air | Ecowitt WH41 PM2.5, outdoors under cover | Ecowitt |
| Thermostat | Ecobee | Ecobee |
| Energy | Tesla Powerwall 2 + solar | Tesla Powerwall (local) |
| Doorbell | Ring | Ring |
| Yard watering | Rachio | Rachio (needs Cloud for webhooks) |
| Garden watering | B-Hyve | B-Hyve (HACS) |
| Lights | Wemo (local) and Leviton | WeMo; Leviton via Matter or HACS |
| Bills and deliveries | A Gmail label read over IMAP, sorted by Claude | IMAP + AI Task |
| Personality | Warm, dry wit. Humor only on low-stakes cards; urgent cards are plain | Prompt + card copy |
| Household | Tyler (Home Assistant owner, admin) and Charlie (his own Home Assistant login, not an admin) | Home Assistant users |
| Pik on phones | Tyler and Charlie each text Pik from their own Claude app (a "Pik" project with the Home Assistant connector). Chats stay private to each person; what they share is the house: feed, house history, reminders, recipes | Model Context Protocol Server (core) via Home Assistant Cloud |
| House history | A shared log of what got done, by whom and when, plus a short list of house facts | Local Calendar + Local To-do |
| Cooking and fix-it modes | Recipes and repair guides sent from either phone open step by step on the kitchen screen, and steps with a time start a timer | Feed item + `input_number.cook_step` |
| Calendars | Tyler: Google Calendar. Charlie: Outlook. Pik adds shared events to both | Google Calendar (core) + Microsoft 365 Calendar (HACS) |
| Phones | Charlie: iPhone. Tyler: Android. Personal reminders and alarms go through each person's Claude app straight to their phone; house reminders go through Pik and buzz both phones | Home Assistant Companion app on both phones |

## Architecture

```text
 Devices and services            Home Assistant Green                       Kitchen counter
 ----------------------          ----------------------------------        ----------------------
 Plant + air sensors     --->    Integrations                               Pik House Feed card
 Ecobee thermostat               (devices become entities)     state+feed   (Chromebook, Voice
 Powerwall + solar                                              -------->   Satellite = mic +
 Ring doorbell                   Config packages                <--------   speaker)
 Rachio, B-Hyve                  (House feed to-do list,       voice, taps
 Wemo, Leviton lights             feed_post + scripts,
 Gmail label (IMAP)               automations)                  text cmds   Echo Show
                                                                -------->   (Amazon Music,
                                 Claude (Anthropic)                          Judy Justice)
                                 (Pik's conversation brain,
                                  AI Task sorts email)
                                        ^
                                        v
                                 Cloud: HA Cloud (speech in/out), Anthropic API (Claude)
                                        ^
                                        |  MCP Server, through the HA Cloud URL
                                 Tyler's Claude app  ·  Charlie's Claude app
                                 (each a private "Pik" project; both read and
                                  write the same house)
```

The card never talks to a device directly. It reads entities and the feed from Home Assistant, and every button or voice request goes back through Home Assistant as a script, so all the rules live in one place. The Echo Show only takes text commands; it holds no logic.

## The card

One card, `custom:pik-house-card`, fills a panel-view dashboard at 1280×800. Match **reference/daylight-reference.html** pixel for pixel; where this section and the prototype disagree, the prototype wins on looks and this section wins on behavior.

**Regions**

- **Top strip:** clock and date, outside temperature with the day's low and air quality, inside temperature.
- **Pik column:** Pik (280px; 214px while timers run), name, state pill, round mic button, and up to two timer chips.
- **Bubble:** one item at a time, with a pager ("2 of 5"), dots, previous/next arrows and a "Next" peek pill. It also shows Pik's spoken answers.
- **Pebbles:** Now playing (only while the Echo plays), Energy, Plants, Heat, Lights & watering.
- **Sheets:** Energy, Plants and Home slide up from the bottom; Done or a tap above closes them.

**Behavior rules**

1. **Urgent first.** Urgent items (doorbell, grid outage) always show first and turn the bubble red-orange. Pik shows Heads up, and an open sheet closes.
2. **Auto-cycle.** With nothing urgent, the bubble moves to the next item every 25 seconds. Paging by hand pauses that for 60 seconds.
3. **Theme follows the sun.** Light when `sun.sun` is above the horizon, dark otherwise.
4. **Quiet hours, 11 PM to 7 AM.** Only urgent items show; the rest wait ("3 things are waiting for 7 AM"). The screen dims, pebbles fade to 30%, and Pik shrinks slightly.
5. **Sheets close themselves** after 90 seconds untouched.
6. **Timers.** Up to two chips, each with a countdown, a shrinking ring and cancel. When one finishes, its chip turns red-orange and pulses, three beeps play, Pik shows Heads up, and Stop appears.
7. **Reduced motion.** Respect `prefers-reduced-motion`: no packets, shimmer, pulsing or Pik bob.
8. **Touch targets** are at least 44×44px; body text is at least 13px.

**Pik art.** Use Tyler's five Porch Light SVGs in reference/pik/ as the base (resting, listening, thinking, speaking, mic off) plus the prototype's Heads up face. Motion only while working: listening pulses the sage ring, thinking spins the violet dotted ring, speaking moves the mouth, Heads up pulses a coral ring. Resting is still.

**Fonts and color.** Instrument Serif for display, DM Sans for text. Use the prototype's CSS variables for both themes; don't invent new colors.

**Mock mode.** When `mock: true` in the card config (or no `hass` object), the card runs on the prototype's fake data and "Simulate event" / "Preview day" / "Preview night" buttons appear. In live mode those buttons are hidden.

## Entity map

The card hard-codes no entity IDs. Everything comes from the card's YAML config, so swapping a device means editing config, not code. The IDs below are examples; the real ones are read off Home Assistant once each integration is added.

```yaml
type: custom:pik-house-card
mock: false
quiet_hours: { start: "23:00", end: "07:00" }
weather: weather.home
air_pm25: sensor.wh41_pm2_5
thermostat: climate.ecobee
sun: sun.sun
satellite: assist_satellite.kitchen_chromebook
feed_list: todo.house_feed
energy:
  solar_power: sensor.powerwall_solar_power
  load_power: sensor.powerwall_load_power
  battery_power: sensor.powerwall_battery_power
  grid_power: sensor.powerwall_site_power
  battery_level: sensor.powerwall_charge
  grid_status: binary_sensor.grid_status
  essentials_script: script.essentials_only
plant_groups:            # route order. Tyler's real groups; sensor entity IDs come from the Ecowitt setup
  - { name: Kitchen, indicator: nerve plant, plants: 14,
      moisture: sensor.soil_moisture_1, threshold: input_number.thirst_kitchen }
  - { name: Big aroids, indicator: monstera by the shoe rack, plants: 11,
      moisture: sensor.soil_moisture_2, threshold: input_number.thirst_aroids }
  - { name: Bedroom & office, indicator: spider plant, plants: 8,
      moisture: sensor.soil_moisture_3, threshold: input_number.thirst_bedroom }
  - { name: Trees & palms, indicator: bedroom fiddle leaf fig, plants: 12,
      moisture: sensor.soil_moisture_4, threshold: input_number.thirst_trees }
  - { name: Tough guys, indicator: big ZZ in the yellow pot, plants: 9,
      moisture: sensor.soil_moisture_5, threshold: input_number.thirst_tough }
  - { name: Jungle cacti, indicator: blooming Christmas cactus, plants: 10,
      moisture: sensor.soil_moisture_6, threshold: input_number.thirst_jungle }
  - { name: Desert cacti, indicator: middle succulent trough, plants: 18,
      moisture: sensor.soil_moisture_7, threshold: input_number.thirst_desert }
  # Starting thresholds (%): kitchen 30, aroids 28, bedroom 28, trees 25, jungle 20, tough 12, desert 8.
  # Up to 16 groups: the GW1200 takes 16 sensors, and adding a group is config only.
lights:
  - { name: Living room, entity: switch.wemo_living_room }
  - { name: Porch, entity: light.leviton_porch }
  - { name: Kitchen, entity: light.leviton_kitchen }
watering:
  yard: { name: Rachio, entity: switch.rachio_standby }
  garden: { name: B-Hyve, entity: switch.bhyve_garden }
doorbell:
  camera: camera.front_door
  ding: event.front_door_ding
echo:
  media_player: media_player.kitchen_echo_show
  device_id: <alexa_devices device id>
```

Rules:

- **Missing entity = hidden tile, never an error.** If `air_pm25` is absent, the air text disappears; if `echo` is absent, there's no Now playing pebble.
- **Thresholds live in Home Assistant** as `input_number` helpers (0–100%), so Tyler can tune a thirsty line without touching the card.
- **Watering is detected automatically.** When a group's sensor rises by at least its jump size within 30 minutes, the whole group counts as watered: its plant card or route stop clears, and the house history gets "Kitchen group watered" with the before and after readings. Jump sizes live in `input_number.water_jump_<group>` (start at 12 points; 5 for Desert cacti and Tough guys, which get little water). If a combined card covered several groups, only the detected ones clear.
- A quiet confirmation card follows ("Saw the Bedroom & office group get watered"), with "That wasn't the whole group," which puts the group back on the list until its next jump or a manual tap, and brings the plant card back to the feed if it had cleared.
- The **Watered** buttons stay as a backup for out-of-order days. Tip for Tyler and Charlie: water each group's sensor plant last.
- **Units:** °F, kW, %. Show one decimal for kW and whole numbers everywhere else.

## The "Needs you" feed

Every bubble item is a row in a Home Assistant **Local To-do** list named `House feed`. Automations add rows through one script, `script.feed_post`, and the card subscribes to the list live. This needs no custom integration, survives restarts, and is easy to inspect in Home Assistant's own To-do screen.

**Item shape.** The to-do *summary* is the card title. The *description* holds JSON:

```json
{
  "id": "heat-away",
  "category": "home",
  "label": "Heat · Ecobee",
  "detail": "Want me to drop it to 64° until one of you gets back?",
  "urgent": false,
  "primary": { "label": "Drop to 64°", "script": "script.heat_away_64", "toast": "Done. Holding 64°." },
  "secondary": { "label": "Leave it", "kind": "dismiss" },
  "expires": "2026-11-21T23:00:00-08:00"
}
```

- `category` sets the colored dot: plant, weather, bill, home, package, energy, door, air, light, water, reminder.
- `secondary.kind` is `dismiss` or `snooze` (with `minutes`). Snooze sets the to-do's *due* time; the card hides items due in the future.
- **Buttons may only run `script.*` entities** or open a card view (`open: energy | plants | home | camera`). Never arbitrary services from item text.
- Pressing a button runs its script, shows its toast, and marks the row complete. An hourly cleanup automation deletes completed and expired rows.
- `script.feed_post` updates the existing row when the same `id` is posted again, so a sensor that keeps firing doesn't stack duplicates.

**Who posts what (v1)**

| Card | Trigger | Posted by |
| --- | --- | --- |
| Someone's at the front door (urgent) | Ring doorbell press | Automation |
| Power's out (urgent) | `grid_status` goes off | Automation |
| Power's back | `grid_status` goes on after an outage | Automation |
| Plant groups need water | Any group's moisture below its threshold for 30 min | Automation, one combined card |
| Saw a group get watered | A sensor jumps by its group's jump size within 30 min | Automation; clears that group from the plant card |
| Freeze tonight (with cold spots and garden steps) | Forecast low ≤ 32°F; a hard freeze is ≤ 25°F | Automation at 3 PM + AI Task writes it |
| Recipe sent from a phone | `script.recipe_send` from either Claude app | Script |
| Something logged from a phone ("Charlie changed the furnace filter") | `script.history_add` from a Claude app, when the item is worth telling the other person | Script |
| Added to both calendars (with Undo) | `script.calendar_add_both` | Script |
| House reminder for both ("put the chicken out to thaw") | `script.add_reminder` with `who: both`; also pushes to both phones | Script, then automation |
| Plant doctor result | A plant photo sent from a Claude app | `script.feed_post` from the Claude app |
| Fix-it guide ready | A repair photo sent from a Claude app | `script.guide_send` |
| Model sticker saved | A sticker photo sent from a Claude app | `script.feed_post` + House facts |
| Nobody's home, so I tidied up (with Undo) | Both phones away 10 min | Automation (replaces heat-away and lamps cards) |
| Porch light's on for you | A phone heading home, after sunset | Automation |
| Pik noticed: a suggestion | Sunday logbook review finds a repeat | AI Task, at most 2 a week |
| Free power for the next 3 hours | Powerwall > 95%, exporting > 2 kW for 15 min | Automation, once a day |
| House health | Monday 9 AM if anything needs a hand; urgent items right away | Automation |
| The internet's down / back | `binary_sensor.internet` off for 2 min / back on | Automation, card side |
| Bills, price increases, deliveries | New email under the Gmail label | IMAP + AI Task (Claude) |
| Trash goes out | Tuesday 8:00 AM | Automation |
| Top up the pitcher plant's tray (distilled water) | Weekly, Sunday 10:00 AM | Automation |
| Voice reminders | "Remind me..." | `script.add_reminder`, then automation |
| Sunday house report | Sunday 9:00 AM | AI Task writes it |
| Smoky air outside | PM2.5 above 35 for 20 min | Automation |

## Pik, voice, timers, music and reminders

**Pik follows the real voice pipeline, never timers or guesses.** The card reads the Chromebook's `assist_satellite` entity:

| Satellite state | Pik shows |
| --- | --- |
| `listening` | Listening |
| `processing` | Thinking |
| `responding` | Speaking, with the spoken reply in the bubble |
| `idle` + an urgent feed item or a finished timer | Heads up |
| `idle` + mic muted | Mic off |
| `idle` | Resting |

Tapping Pik starts a conversation on that satellite, the same as the wake word. The mic button mutes the satellite. Its state must come from the satellite itself, not from the card.

**Timers.** "Set a pasta timer for 10 minutes" goes through Voice Satellite, which supports voice timers. The card draws its own chips (countdown, ring, Stop), so it needs each timer's name and end time.

- **Plan A:** read them from Voice Satellite if it exposes active timers to the frontend.
- **Plan B:** a pool of `timer` helpers (start with 8) plus a matching `input_text` label for each, with a `script.kitchen_timer` exposed to Assist that takes the first free one. Claude calls the script, and the card reads the helpers. Adding more helpers raises the ceiling, so there is no practical limit.
- **No silent replacing.** A new timer never cancels a running one. If every helper is busy (Plan B only), Pik says so and asks which one to replace.
- **How they show:** up to three chips next to Pik, soonest first. With more than three, two chips show plus a "+N more timers" pill that opens a Kitchen timers sheet listing all of them. The cooking sheet always lists every running timer.
- Pick after the check in "Things to verify."

**Music and Judy Justice go to the Echo Show.** Two scripts are exposed to Assist with clear descriptions so Claude knows when to use them:

- `script.echo_play(request)`: sends text such as "play Robyn on Amazon Music" or "play Judy Justice on Prime Video" with `alexa_devices.send_text_command`.
- `script.echo_control(action)`: pause, resume, stop, volume up, volume down.
- The Now playing pebble reads the Echo's `media_player` entity: title, source app, playing or paused.

**Reminders.**

- **Fixed ones** (trash every Tuesday at 8 AM) are plain automations that call `script.feed_post`, with category `reminder` and secondary "In an hour" as a 60-minute snooze.
- **Voice reminders** ("remind me at 3 to call the vet") go through `script.add_reminder(text, when)`, exposed to Assist. It creates an event in a Local Calendar named `Reminders`, and a calendar-triggered automation posts the feed card at that time.
- **Recurring voice reminders** are a v2 item. For v1, Tyler asks Claude in chat to add the automation.

## Claude inside Home Assistant

**Conversation agent.** Add the Anthropic integration with Tyler's API key, which has a monthly spending cap set in the Anthropic Console. Create an Assist pipeline that uses Home Assistant Cloud for speech-to-text and text-to-speech and Claude for conversation. Turn on **Prefer handling commands locally**, so "turn off the porch light" runs instantly without a Claude call and Claude handles everything else.

**Expose only what Pik needs:** lights, thermostat, the watering switches, the plant and energy sensors, the Echo scripts, the timer and reminder scripts. Do not expose cameras, the Ring chime, or anything that unlocks, opens or buys.

**Pik's instructions (draft for the agent's prompt)**

```text
You are Pik, the voice of Tyler's house in Reno. Answer in one or two short sentences;
you are heard across a kitchen. Be warm with a dry wit, and joke only about
low-stakes things. Anything about safety, money, the doorbell or a power outage
is plain and direct.
Music and Judy Justice play on the Echo Show: use script.echo_play and
script.echo_control, never another speaker. Timers: script.kitchen_timer.
Reminders: script.add_reminder. Do not invent sensor values; if you don't have
it, say so. Temperatures in °F.
```

**Email cards with AI Task.** The IMAP integration watches one Gmail label, using a Gmail app password. Each new message fires an `imap_content` event. An automation sends the subject, sender and text to `ai_task.generate_data`, asking for structured output:

```yaml
structure:
  kind: { selector: { select: { options: [bill, price_increase, delivery, ignore] } } }
  title: { selector: { text: } }      # under 60 characters, Pik's voice
  detail: { selector: { text: } }     # one sentence, amounts and dates included
  due_date: { selector: { date: } }
```

If `kind` isn't `ignore`, it posts a feed card. Bills get a "Remind me the day before" button backed by `script.add_reminder`. Claude never pays, replies or clicks links in email; the card is information only.

**Sunday report.** Sunday 9 AM: one AI Task call summarizes the week from the feed history, energy totals and watering logs into a single card.

**Cost guardrails.** Local intents first; AI Task only on new labeled email and the weekly report. Expect a few dollars a month, and keep the spending cap as the backstop.

## Made for Tyler and Charlie

House history, cooking and fix-it modes, calendars, reminders, plant doctor, model stickers, the meal plan and freeze smarts. These come from Tyler and Charlie's own wish list. They are Phase 6 and must not slow down Phases 0 to 5. The reference for every screen is **reference/daylight-features-reference.html** (tap "Simulate event" to step through the recipe, calendar, plant doctor, furnace filter, fix-it, reminder and sticker cards; the Coming up pebble opens the calendar sheet, and the Home sheet has a House history button).

**Pebble change in Phase 6:** Heat and Lights merge into one **Home** pebble (setpoint, lights on, inside temperature), and a new **Coming up** pebble shows the next event from either calendar.

**House history**

- A Local Calendar named `House history`. Each entry is an all-day event: the summary is what happened ("Furnace filter changed"), and the description holds who and the details ("Charlie · 16×25×1").
- `script.history_add(what, detail)`: adds today's entry. It records who from the calling user (`context.user_id` mapped to Tyler or Charlie); from the kitchen screen it records "Kitchen screen." Exposed to Assist, so Pik on the screen and Pik in both Claude apps can use it.
- `script.history_lookup(search, days_back)`: returns matching entries, newest first, so Claude can answer "when did we last change the furnace filter?" with a date and a name.
- Watering logs (detected by the sensors, or "Watered" taps) and finished recipes add entries automatically.
- **Good to know:** a Local To-do list named `House facts`. Each item's summary is the fact's name ("Furnace filter") and its description is the value ("16×25×1, every 3 months"). Either person adds facts by telling Pik.
- **The sheet:** opens from the House history button on the Home sheet, and from a "See the history" button on any history card. It shows the 7 newest entries with a colored chip for who did it (Charlie green, Tyler purple, others gray), and the facts list beside them.
- A logged item becomes a feed card only when it's worth telling the other person (a filter change yes, a watering tap no). Claude decides, and the card says who logged it.

**Cooking mode**

- **Sending a recipe:** in either Claude app, paste a link or a recipe and say "send this to the kitchen." Claude rewrites it into short steps and calls `script.recipe_send(title, steps, from)`. Each step has a short name, the instruction, its ingredients, and an optional timer (label + minutes). The script posts a feed card ("Charlie sent tonight's recipe") whose JSON holds the whole recipe.
- **The sheet:** steps listed on the left, the current step large on the right with its ingredients, live timers, and Back / Next step. The last step's button is "Finish · log it", which closes the sheet and adds the meal to the house history. The sheet does not drift home after 90 seconds like the others.
- **Timers start themselves:** reaching a step with a timer calls `script.kitchen_timer` with that step's label and minutes, once per step. They share the pool with voice timers, so they also show as chips by Pik, and they never replace a running timer.
- **Leaving and coming back:** closing the sheet (Done) or getting pulled away by an urgent card never resets the recipe. While a recipe or fix-it guide is in progress, the feed keeps a "Back to the soup? You're on step 4 of 8" card at the front of the non-urgent cards, with "Back to it" and "I'm done." Saying "Pik, let's cook Charlie's recipe" again also resumes at the same step. The step and which steps already started their timers live in Home Assistant (`input_number.cook_step` plus a `cook_started` attribute), so a page reload doesn't lose them either. "I'm done" ends the recipe and leaves running timers alone.
- **Voice:** "Pik, let's cook Charlie's recipe" opens it. "Next step" and "go back" call `script.cook_step(direction)`, which moves `input_number.cook_step`; taps and voice stay in sync because the card reads that helper. These are handled as local sentences (no Claude call), so they're instant.
- **Hands-free mode (on by default while cooking):** for 30 minutes, the screen listens for a short list of cooking phrases with no wake word: "next step," "go back," "repeat that," "start a N-minute timer," "how long on the [timer]?" Everything else still needs "Hey Pik." It turns on when a recipe or fix-it guide starts, or by saying "Hey Pik, hands-free for 30 minutes." A pill under Pik shows "Hands-free · N min left" with Stop; it turns off after 30 minutes, on Stop, or when the recipe ends. The phrases are recognized on the Green (or in the browser), the same way as the wake word, so no kitchen audio leaves the house; only a recognized phrase triggers anything. The cooking sheet has a "Hands-free" toggle.
- **Read steps aloud (off by default):** a toggle on the cooking sheet. When on, Pik speaks each step through the Chromebook as you reach it. "Repeat that" reads the current step aloud either way. The choice is remembered (`input_boolean.cook_read_aloud`).

**Fix-it mode**

- Same sheet as cooking mode, with its own label ("Fix-it · from Charlie's photo"). Charlie or Tyler sends a photo of the problem (a dripping faucet, a loose hinge) to Pik in the Claude app. Claude works out the likely fix, writes short steps with the tools and parts for each, and calls `script.guide_send(kind: fix, title, steps, from)`.
- The card says what's probably wrong, how long it takes and what to buy. "Start the fix" opens the steps. Finishing logs it to the house history ("Fixed the bathroom faucet drip").
- If a job looks unsafe for a DIY fix (gas, the main electrical panel, anything structural), Pik says to call a pro instead of writing steps.

**Calendars and Coming up**

- **Adding to both calendars:** either of you sends Pik a screenshot or a forwarded invite in the Claude app and says "put it on our calendars." Claude reads the title, date, time and place, checks them with you in one line, then calls `script.calendar_add_both(title, start, end, location, notes, from)`. That creates the event on Tyler's Google Calendar (`google.create_event`) and on Charlie's Outlook calendar (Microsoft 365 Calendar's create-event action). It posts an "Added to both your calendars" card with **Undo**, which removes both copies.
- **One person's calendar:** "put it on Charlie's calendar" adds to his only.
- **Coming up pebble:** the next event from either calendar or the house Reminders calendar. Time big, title below.
- **Coming up sheet:** this week, grouped by day. Each row shows the time, title, where it came from, and a chip: Tyler (purple), Charlie (green), Both (gold), House (gray, for house reminders). Events Pik added say so. The right column is **Dinners this week** from the meal plan.
- Pik answers "what's coming up this week?" from the same data.

**Reminders and alarms**

- **Personal ones** ("remind me to call the dentist at 3," "wake me at 6"): handled by each person's Claude app on their own phone. On Charlie's iPhone, the Claude app adds them to Apple Reminders. On Tyler's Android, it can set alarms in the Clock app. The house isn't involved.
- **House ones** ("remind us both Thursday at 6 to put the chicken out"): `script.add_reminder(text, when, who)` with `who: both | tyler | charlie`. At that time, the card posts on the kitchen screen, and a push notification goes to the right phones through the Home Assistant Companion app (time-sensitive on Charlie's iPhone, so it shows through Focus modes).
- Recurring house reminders ("every Sunday, the pitcher plant tray") move from v2 into Phase 6: `script.add_reminder` takes an optional repeat rule and writes a recurring event to the `Reminders` Local Calendar.

**Meal plan (optional; build last)**

- Send Pik a few recipes ("plan dinners this week: these three, and Friday we're out"). Claude calls `script.meal_plan_set(day, title, recipe)` for each day. The plan lives in a Local Calendar named `Dinners`, one all-day event per day; the recipe JSON goes in the description.
- The night before a dinner that needs thawing or soaking, a house reminder posts at 6 PM. At 4 PM on the day, that night's recipe card posts with "Start cooking."
- "Plan the week" on the Coming up sheet just explains how to send recipes.

**Plant doctor**

- Send Pik a photo of a sad plant in the Claude app. Claude names the plant if it can, gives the likely cause in plain words and what to do, and says how sure it is. It posts a plant card ("The bath fiddle leaf is probably too wet") and logs it to the house history.
- It sets a follow-up: a few days later, a push to the sender says "Send me a new photo of the fiddle leaf," and Pik compares the two.
- If the plant is one of the 83 on the Pik House Plants sheet, Claude uses its group's soil reading in the diagnosis.

**Model stickers and manuals**

- Send Pik a photo of a model sticker (furnace, fridge, water heater, washer). Claude reads the brand, model, serial and date, looks up the filter size or part numbers and the warranty length if it can, and adds them to `House facts`. A short card confirms what it saved.
- Later, "what filter does the fridge take?" is answered from `House facts`.

**Freeze smarts (Reno)**

- At 3 PM, if the forecast low is ≤ 32°F, an automation sends AI Task the low, the hour it hits, whether Rachio and B-Hyve skipped, and the `cold_spots` list from the config package. Claude writes one card in Pik's voice.
- Starting `cold_spots`: sun room glass (majesty palm, sago palm); the garden beds (cover before dark). At ≤ 25°F, add the outdoor hose bibs on the season's first hard freeze.
- Buttons: "Done" and "Remind me at 4" (a 60-minute snooze, or until 4 PM). "What's tonight looking like?" answers with the same facts.

## Keeping it running

**Backups (set up on day one).** Turn on Home Assistant Cloud's automatic backups during setup: a nightly encrypted copy stored off the Green, keeping the last several. Also keep one local copy on the Green. Restoring onto a new Green brings back every device, automation, helper, the house history and Pik's settings. The backup encryption key gets saved in Tyler's password manager the same day, because a backup can't be restored without it. Test once: restore the latest backup onto a fresh install (or a spare) and confirm it comes back.

**Internet outages.** The Powerwall covers power outages; internet outages need their own behavior.

- What keeps working with no internet: the card and its buttons, Wemo lights, the Ecowitt plant and air sensors, the Powerwall readings, timers and local automations.
- What stops until it's back: Pik's voice and Claude, Ecobee control, the Echo Show, Ring, calendars, email cards and both Claude apps.
- The card watches an internet check (`binary_sensor.internet`, a ping to two public hosts). When it goes off for 2 minutes, Pik's label reads **Offline**, its line says what still works, and an "The internet's down" card lists both halves above. Tapping Pik shows "I can't hear you while the internet's down. The buttons still work." instead of starting a conversation.
- When it's back, an "The internet's back" card says how long it was out, the down card clears itself, and anything that queued up while offline posts normally.

**House health check.** Pik keeps an eye on its own parts.

- Watched: every soil and air sensor's battery and last-seen time; integrations that need a fresh sign-in (Alexa Devices, Ring, Google, Microsoft 365 are the usual ones); the Ecowitt gateway, the Chromebook satellite, and the backup's last success.
- Monday 9 AM, if anything needs a hand, one "House health" card lists it in plain words with "Show me how" (sends steps to Tyler's phone) and "Tomorrow" (a snooze). Nothing wrong means no card.
- Right away, not weekly: a backup that failed twice in a row, the Chromebook satellite offline for 30 minutes, or a plant group's sensor silent for 24 hours (its group's thirst alerts would stop).

## Pik notices

These make Pik propose things instead of waiting to be asked. Every suggestion needs a yes; nothing changes the house on a guess.

**Pik suggests automations.**

- Sunday night, an AI Task reads the past 14 days of the logbook for things done by hand (lights, heat, Echo, watering logs) and looks for repeats: same thing, similar time, most days.
- At most two suggestions a week, each as a card: what it noticed, with numbers ("on 9 of the last 14 evenings"), and what it would do ("only when someone's home"). Buttons: **Yes, do that** and **No thanks**.
- Yes: the automation is created and labeled "Suggested by Pik," and it's logged to the house history. No: remembered in a `Pik suggestions` list and never offered again.
- Never suggested: anything with locks, doors, cameras, money, or turning heat off while someone's home.

**Coming and going.** Uses the Home Assistant app's home/away location on both phones; each of you turns it on in your own app.

- **Last one out** (both phones away for 10 minutes): Pik turns off lights left on, sets the heat to 64°, and posts "Nobody's home, so I tidied up" with what it did and **Undo**. A push goes to the person who left last. This replaces the separate "heat-away" and "lamps on" cards.
- **First one home** (a phone heading home and within about 10 minutes): heat goes back to the normal setpoint. After sunset, the porch light turns on. A quiet card says who's almost home.
- Not included: garage, doors and locks (out of scope for v1).

**Run on sunshine.**

- When the Powerwall is above 95% and solar is sending more than 2 kW to the grid for 15 minutes, and the forecast says it'll last at least 2 more hours: a "Free power for the next 3 hours" card suggests the laundry or dishwasher. At most once a day, never in quiet hours; "Not today" silences it until tomorrow.
- Storm days: if the forecast has a winter storm or high wind warning, Pik checks that the Powerwall's Storm Watch is on (or the reserve is high) and says so in a card.

## Second screen: the Echo Show 15

Saying **"Alexa, open Pik"** brings the dashboard up on the wall-mounted Echo Show 15. Alexa's own home screen stays the default; Amazon closes the browser after a while and goes back to it, which suits a shared screen. Reference: **reference/echo-show-15-reference.html**.

- **How it opens:** a private Alexa skill that Claude Code builds (Alexa-hosted, so no AWS account; it lives in Tyler's free Amazon developer account and is never published). Its only job is to open the dashboard URL in the Echo's Silk browser. An Alexa routine maps the exact phrase "open Pik" to the skill, since skill names usually need two words ("Pik House").
- **Layout:** the same card with an `echo` layout for 1280×720 CSS px (16:9, landscape): a smaller Pik, shorter stage and pebbles, sheets 560 px tall and scrollable. The card picks it from a `?screen=echo` URL parameter, never by guessing.
- **Touch only:** the Echo's microphone belongs to Alexa, so there's no mic button. Tapping Pik says "On this screen, tap away. To talk to me, use the kitchen screen or your Claude app." A small line under Pik reads "“Alexa, go home” to leave."
- **Its own login:** a Home Assistant user named "Echo" (not an admin) signs in once in Silk, so the Echo's taps are logged as "Echo screen."
- **Now playing:** while the dashboard is open on the Echo, it can't also show video; the pebble still controls music.
- Optional later: open it automatically when someone walks up (the Echo Show 15's own presence detection, through an Alexa routine).

## Pik in Tyler's and Charlie's Claude apps

Each of them texts Pik from the Claude app on their phone, the way Tyler texts his Pik in ChatGPT. Both talk to the same house. Neither sees the other's chats.

- **The connection:** turn on Home Assistant's **Model Context Protocol Server** integration. Claude connects from the cloud, so it uses the Home Assistant Cloud remote URL. It sees and controls only what is exposed to Assist (see "Expose only what Pik needs").
- **Two Home Assistant logins:** Tyler (owner, admin) and Charlie (a regular user, not an admin). Each signs in with their own login when adding the connector, so Home Assistant knows who did what.
- **In each Claude account:** add the Home Assistant custom connector, then make a project named "Pik" with the instructions below. Charlie can use a free Claude account; free accounts allow one custom connector, which is all he needs.
- **What's shared:** the feed, house history, house facts, reminders and recipes, because they all live in Home Assistant. **What's private:** each person's chats, and everything else in their Claude account.
- **Cost:** chats in the Claude apps use each person's Claude plan, not the Anthropic API key.

**Pik's instructions for the Claude app projects (draft)**

```text
You are Pik, the voice of Tyler and Charlie's house in Reno. You're texting from
the house, so keep it short and warm, with a dry wit on low-stakes things.
You can see and run the house through the Home Assistant connector. Use it; never
guess a sensor value.
- "We did X" or "log X": script.history_add. "When did we last X": script.history_lookup.
- A recipe or recipe link to send to the kitchen: rewrite it into short steps with
  ingredients and timers, then script.recipe_send.
- Reminders for the house or both of us: script.add_reminder (who: both, tyler or
  charlie). A reminder or alarm just for the person you're talking to: set it on
  their phone with the phone's own reminders or alarms, not the house.
- A screenshot or invite to "put on our calendars": read it, confirm the details in
  one line, then script.calendar_add_both.
- A photo of a sad plant: diagnose it, say how sure you are, post a plant card,
  and log it. A photo of a repair: write a fix-it guide with script.guide_send, or
  say to call a pro if it's gas, the main panel or structural. A model sticker:
  save it to House facts.
- Anything the other person should know: post it to the feed with script.feed_post.
Never unlock, open, buy or pay for anything. Temperatures in °F.
```

## Holiday cooking mode

For big meals with a plan worked out days ahead (first: Thanksgiving 2026, Tuesday night to Thursday 4 PM; one oven, a smoker and a five-burner stove; everyone pitches in, so no task says who does it). Setup steps: `ha/README.md`. Design: "Holiday cooking: one page v3" on the design canvas.

- **One plan file per meal:** `holiday/<plan>.json` holds the recipes; the timed tasks (day, time, station, the exact recipe steps each task covers, and what each dish looks like once the task is done); the 12 dishes and which get the 140°F check; what the smoker, oven and each burner is doing through the days; the shopping check, assumptions and food-safety notes. The card bundles it; `holiday/gen-ha.mjs` turns it into a Home Assistant package; `holiday/check-plan.mjs` cross-checks it on every build (every recipe step belongs to a task and the right day, every "burner N" task finds burner N busy, oven and smoker tasks find them on, segments don't overlap, every dish changes state and every hot dish gets hot).
- **One page, run by the clock** (`custom:pik-holiday-card`, same bundle as the house feed):
  - Header: clock; when a task's time comes, the alarm takes over the title (with "+N more" and **Got it**); turkey button (lowest reading); Echo mute; **Plan & recipes**; countdown.
  - Stations: smoker, oven, and the five burners, each with what's on it now and next. The smoker tile follows the thermometer if the turkey runs past its planned time.
  - Left: one card per recipe (jobs that belong to no recipe share a "Kitchen" card). A recipe's card is in "Do these now" when its part is due (from 10 minutes ahead); it shows the dish name (links to the whole recipe), "step N of M" for the whole recipe with dots, the part's line, the step and just that step's ingredients (written out per step in the plan) in a column beside it, a "Set N min timer" button that becomes the time left and then "Time's up · OK", and a tick. ‹ › walk the recipe from Tuesday to Thursday and the time on the card follows the step; looking ahead into a later part hides the tick and offers "Back to now". Ticking a part moves the card to the recipe's next part; a just-ticked part stays a few minutes with undo and "Next: …". A part left unticked more than 30 minutes behind a newer one (or over an hour old) folds into "N earlier parts aren't ticked off". The next three recipes are pinned below. Every task in the plan has exactly one recipe (check-plan enforces it).
  - Right: timers that aren't already on a visible task; the 12 dishes and where each is, with cold, ready ones folded into one "Ready" line while anything is cooking. From 3:30 Thursday the hot dishes get a **140°F ✓** button for the 3:55 check.
  - Bottom (Chromebook only): the day's tasks as dots with a now line and the final hour shaded; day buttons preview Tuesday, Wednesday or Thursday; tapping the strip opens the full schedule.
  - **Put on / take off:** the plan lists what goes on which burner, in the oven or on the smoker (`runs`: station, recipe, the part that puts it on, the part whose tick takes it off, and when the plan expects it off). Each card shows an emblem button for those (burner rings with the burner number on the top edge, an oven, a smoker). Tap = it's on; the tile shows it solid with "on N min". Tap again = off; ticking the ending part frees it by itself. Planned but not put on = faded, dashed tile ("planned · not on yet"). If the planned burner is taken, the emblem turns red with "!" and tapping it lists the free burners; the tile with the dish on it says "X is waiting". Stored in `input_text.<prefix>_places` ("run>station@seconds"); Pik's `holiday_place` does the same by voice.
  - **Plan & recipes** sheet: two tabs, Recipes and Full schedule by station (tick or undo anything), with Settings folded at the bottom (moving progress from the backup page, reset). Echo mute is the speaker button in the header.
- **Shared state, so every screen agrees:** each task is an `input_boolean` (on = ticked off); each recipe card's place lives in `input_text.<prefix>_steps` ("recipe:step,…", counted across the whole recipe) and the last-used recipe in `input_text.<prefix>_focus`; hot checks are `input_boolean.<prefix>_hot_<dish>`; turkey probe readings are three `input_number`s; timers use the shared kitchen pool.
- **Alarms:** at each task's time every screen chimes and keeps chiming every 30 s until **Got it**; an automation reads the task out on every Echo (`script.pik_announce`) and can push to phones. Finished timers do the same. All three probe readings at 165°F or more announce "the turkey is done" on the Echos and both phones. The turkey is never called done by a timer.
- **Kitchen timer pool (SPEC "Timers", Plan B, now built):** `timer.kitchen_1…12` with `input_text.kitchen_timer_N` = "kind|label". `script.kitchen_timer` takes the first free slot; the same name restarts its timer; a finished timer keeps its label (ringing) until OK, Got it or "stop the pasta timer", and clears itself after 30 minutes; when all 12 are busy it says so and replaces nothing. "+5" restarts the timer with time left + 5 minutes, because `timer.change` can't go past a timer's original length.
- **Pik:** `script.holiday_whats_next`, `holiday_task_done` (an id or a few words; the unticked match nearest now), `holiday_log_turkey`, `holiday_place`, `holiday_step` ("next step", "go back", "say that again", "read me the gravy steps": walks one recipe from its first part to its last, follows the recipe last used on a screen or by voice, moves the screens along too, and returns the step's timer and task id so Pik can offer the timer and tick the part off), plus the four kitchen timer scripts, exposed to Assist.
- **Backup page:** the same card, inlined into one HTML page in local mode (`card/dist/holiday-standalone.html`, published as the Thanksgiving Kitchen artifact). Its **Copy progress for the hub** code is what the hub's import reads.
- **Tested** on Home Assistant 2026.2 with its real frontend, two screens: ticks and undo, shared recipe steps and Pik's focus, timers (+5, ring, Got it), turkey pad, import, Echo mute all sync both ways; task announcements fire at the minute with no names; every voice script answers. Fake-clock run Tuesday 6:50 PM → Thursday 4:30 PM of the alarms, steps, timers, stations, dish board, hot checks and the Echo layout. Untested until the real devices are added: the Alexa notify entities and Companion app pushes.

## Build phases

Build in this order. Each phase ends with Tyler checking it on the Chromebook, and the next phase starts only after he signs off. Phase 0 needs no hub, so it can start today.

**Repo layout**

```text
pik-house/
  card/src/            TypeScript + Lit source (pik-house-card.ts, views, pik-art.ts, mock-data.ts, holiday/)
  card/dist/           pik-house-card.js (one bundled file, committed for HACS)
  ha/packages/         feed.yaml, plants.yaml, energy.yaml, voice.yaml, reminders.yaml, email.yaml,
                       pik_kitchen.yaml (timers, announcer), pik_holiday_<plan>.yaml (generated)
  ha/dashboards/       thanksgiving.yaml
  holiday/             <plan>.json (one per big meal), gen-ha.mjs
  reference/           daylight-reference.html, pik/ (Pik SVGs)
  hacs.json, README.md, SPEC.md (this file)
```

**Phase 0: card in mock mode** (before the hub)

- [ ] Port the prototype into the Lit card, with mock data and the demo buttons.
- [ ] A GitHub Pages preview of the mock card, so Tyler can open it on the Chromebook in full screen.
- [ ] Done when: side by side with daylight-reference.html it looks the same, and every demo interaction works on the touchscreen.

**Phase 1: live basics**

- [ ] Install through HACS as a custom repository; panel dashboard plus kiosk mode (no header or sidebar).
- [ ] Clock, weather, air, Ecobee, sun theme, quiet hours, Pik bound to the satellite, mic mute.
- [ ] Done when: Pik's face changes while Tyler talks, the theme flips at sunset, and quiet hours dim at 11 PM.

**Phase 2: the feed**

- [ ] `House feed` list, `script.feed_post`, hourly cleanup, live subscription in the card.
- [ ] Automations: doorbell, outage, power back, freeze, heat-away, trash.
- [ ] Done when: a card posted from Developer Tools appears within 2 seconds; buttons run their scripts; snooze and quiet hours hold cards back; the doorbell jumps to the front.

**Phase 3: pebbles and sheets on live data**

- [ ] Energy flow with correct directions, the plant circuit with threshold helpers, home controls.
- [ ] Done when: the arrows match the Tesla app for a day and a night; a light responds within 1 second; "Watered" clears a group and its card; pouring water on a sensor plant clears its group within 5 minutes and logs it.

**Phase 4: voice extras**

- [ ] Echo scripts and the Now playing pebble; timers (Plan A or B); reminders.
- [ ] Done when: "Pik, put on Judy Justice" plays on the Echo Show; two named timers count down and chime; Tuesday's trash card appears at 8:00.

**Phase 5: Claude extras**

- [ ] Email cards from the Gmail label, and the Sunday report.
- [ ] House health check (weekly card plus the right-away items) and the internet outage behavior (Offline label, down/back cards).
- [ ] Done when: a test bill email becomes a card within 2 minutes with the right amount and due date; junk is ignored; unplugging the router shows Offline within 2 minutes while the lights still respond, and plugging it back in clears it; a sensor with its battery pulled shows up in the health card.

**Phase 6: made for Tyler and Charlie**

- [ ] House history calendar, House facts list, `script.history_add` and `script.history_lookup`, and the history sheet.
- [ ] Cooking mode: `script.recipe_send`, `script.cook_step`, `input_number.cook_step`, the cooking sheet, timers that start themselves.
- [ ] Freeze smarts: the 3 PM automation, AI Task card and `cold_spots` list.
- [ ] Fix-it mode: `script.guide_send`, sharing the cooking sheet.
- [ ] Calendars: Google Calendar and Microsoft 365 Calendar, `script.calendar_add_both` with Undo, the Coming up pebble and sheet; Heat and Lights merge into the Home pebble.
- [ ] Reminders: `who` on `script.add_reminder`, Companion app pushes to both phones, recurring reminders.
- [ ] Plant doctor and model stickers: card formats, house history entries, House facts, the follow-up photo push.
- [ ] Meal plan (last): `Dinners` calendar, `script.meal_plan_set`, the 4 PM dinner card and the thaw reminder.
- [ ] Model Context Protocol Server through Home Assistant Cloud; Charlie's login; written setup steps for both Claude apps.
- [ ] Done when: Charlie logs "changed the furnace filter" from his phone and the card says it was him; Tyler asks his own Pik when it was last changed and gets the date and the name; a recipe link sent from a phone becomes steps on the kitchen screen and its timers start themselves; a test forecast of 24°F produces the freeze card with the sun room plants; a screenshot of an event sent from Charlie's phone lands on both calendars and Undo removes both; "remind us both at 6" buzzes both phones and posts the card; a fix-it photo becomes steps on the screen.

**Phase 7: Pik notices**

- [ ] Automation suggestions: the Sunday logbook review, the suggestion card, creating approved automations, the `Pik suggestions` list of declined ones.
- [ ] Coming and going: phone home/away zones, last-one-out with Undo, first-one-home heat and porch light.
- [ ] Run on sunshine: the surplus card and the storm check.
- [ ] Done when: after two weeks of real use, Pik makes at least one sensible suggestion and a yes creates a working automation; both phones leaving turns off a lamp and Undo puts it back; a sunny afternoon with a full Powerwall posts the free-power card once.


## Things to verify before relying on them

These came from research, not from testing on Tyler's hardware. Claude Code checks each one against the current docs or a live install, writes the answer into this table, and tells Tyler if a plan has to change.

| Question | Why it matters | If the answer is no |
| --- | --- | --- |
| Can the wake-word engine run extra phrase models ("next step," "go back," "repeat that") alongside the wake word, switched on and off by a helper? | Hands-free cooking without sending audio out | Keep the wake word, and add "Hey Pik" continued conversation: after each cooking reply, listen 8 seconds for a follow-up |
| Can a custom "Hey Pik" wake word be trained and run reliably on the Chromebook satellite? | The wake word | Use a built-in wake word ("Okay Nabu" or "Hey Jarvis") |
| What is the Echo Show 15's CSS viewport in Silk (expected 1280×720)? | The echo layout | Adjust the echo layout's sizes to match |
| Does Silk on the Echo Show 15 keep the Home Assistant login and run the card smoothly? | Opening fast, no lag | Use a lighter echo layout (no animations), or open a simpler dashboard there |
| Can a one-word "Alexa, open Pik" routine launch the private skill? | The phrase Tyler wants | "Alexa, open Pik House" |
| Does the Voice Satellite expose active timers (name, end time) to the frontend or as entities, with no cap on how many? | The card draws its own timer chips | Plan B: a pool of timer helpers + `script.kitchen_timer` |
| Can the card start a conversation on the satellite and mute it? | Tap-to-talk and the mic button | Keep Voice Satellite's own overlay for tap-to-talk; hide the card's mic button |
| Does the core Alexa Devices integration give the Echo Show a `media_player` with title and play/pause? | The Now playing pebble | Use the Alexa Media Player custom integration (HACS) for the media player only |
| Does `alexa_devices.send_text_command` start Prime Video shows on an Echo Show ("play Judy Justice on Prime Video")? | The Judy Justice request | Send "open Prime Video" plus the show name, or fall back to an Alexa routine triggered by the text command |
| Do text commands still work with the Echo's mic muted? | Tyler may mute Alexa | Leave the Echo mic on |
| Sign conventions in the Powerwall integration (battery charging vs discharging; grid import vs export) | Flow arrows point the right way | Flip in the card config, not in code |
| Does the Ecowitt integration show each WH51 as its own moisture sensor through the GW1200? | Plant groups | Add channels one at a time and label them in Home Assistant |
| Can Rachio and B-Hyve be paused or put in standby from Home Assistant? | "Pause until March" | Show status only; the button opens the vendor app |
| Chromebook kiosk: does Chrome full screen + kiosk mode stay awake and keep the mic on all day? | Always-on counter screen | Try the Kiosk Satellite Android app on the Chromebook; set the screen to stay on while charging |
| Does the claude.ai custom connector sign in to the core MCP Server integration through the Home Assistant Cloud URL? | Pik in both Claude apps | Use the HA-MCP custom component's Home Assistant Cloud webhook URL |
| When a script runs from the MCP Server, does `context.user_id` show which person called it? | "Charlie changed it" vs "Tyler changed it" | Add a `who` field to `script.history_add` and have each Pik project fill it in |
| Can a script exposed to Assist return data (a response) that Claude reads? | `script.history_lookup` answers questions | Expose the House history calendar to Assist and let Claude read events directly |
| Is a long JSON recipe safe in a to-do item's description? | `script.recipe_send` | Store the steps in a separate `Recipe` to-do list, one item per step |
| Does Microsoft 365 Calendar (HACS) sign in to Charlie's Outlook account and create and delete events? | Events on Charlie's calendar | Invite Charlie's Outlook address as a guest on the Google event instead (needs the Google Calendar API directly) |
| Can Home Assistant delete a Google Calendar event it created? | Undo | Undo removes the Outlook copy and posts a card asking Tyler to delete the Google one |
| Do Companion app pushes arrive as time-sensitive on Charlie's iPhone? | House reminders get through Focus modes | Use a critical alert for reminders marked urgent only |
| Can an approved suggestion create an automation from inside Home Assistant (the automation config API, called by a script)? | "Yes, do that" on a Pik suggestion | Save it as a disabled draft and post steps for Tyler to turn it on in Settings |
| Is the Ecobee integration cloud-only, and does Leviton (Matter) keep working offline? | What the Offline card promises | Adjust the offline card's lists to match what actually works |
| Does the Powerwall integration expose Storm Watch or the backup reserve? | The storm-day check | Card just reminds Tyler to check Storm Watch in the Tesla app |

## What Tyler does

**Now, before the hub arrives**

1. ~~Create the GitHub repo~~ Done: `wtlangdon-design/pik-house`, public (HACS installs from public repos). Nothing secret goes in it: API keys and entity IDs live in Home Assistant, not the repo.
2. ~~Add the starter files~~ Done: this SPEC.md, reference/daylight-reference.html and reference/pik/.
3. **Open Claude Code on the repo** and paste:

```text
Read SPEC.md. Build Phase 0 only: the card in mock mode, plus a GitHub Pages
preview I can open on my Chromebook. Match reference/daylight-reference.html exactly,
and use the Pik SVGs in reference/pik/. When you're done, give me the preview link
and a short list of anything you couldn't match.
```

4. **Open the preview link on the Chromebook** in tent mode, full screen, and tap through everything. Send notes back to Claude Code until it feels right.
5. ~~Send Claude your plant list~~ Done: 83 plants in 7 groups, in the Pik House Plants sheet. When the sensors arrive, put each one in its group's indicator plant and note its channel in the sheet's Groups tab.

6. **Charlie makes a Claude account** (free is fine). Nothing else for him until the hub is set up.

**When the Green arrives** (Claude walks through each step in chat)

1. Plug in the Green, create the owner account, and start the Home Assistant Cloud trial. Turn on Home Assistant Cloud's automatic backups right away, and save the backup encryption key in your password manager.
2. Create an Anthropic API key with a monthly spending cap, and add the Anthropic integration.
3. Add the device integrations: Ecowitt, Ecobee, Powerwall, Ring, Rachio, B-Hyve, WeMo, Leviton, Alexa Devices.
4. Install HACS, then Voice Satellite, and set up the Chromebook as a satellite.
5. Back to Claude Code: "Build Phase 1." Then Phases 2 through 5, one at a time, checking each on the Chromebook.
6. Make Charlie's Home Assistant login (not an admin) and turn on the Model Context Protocol Server integration.
7. Install the Home Assistant app on both phones and sign in, each with your own login. Allow location so the house knows home/away (for coming and going).
8. Connect the calendars: Tyler signs in to Google Calendar, and Charlie signs in to Microsoft 365 Calendar (installed through HACS).
9. Each of you adds the Home Assistant connector in your own Claude app and makes a "Pik" project with the instructions above. Claude gives you both the exact steps. In the Claude app's settings, Charlie allows Reminders and Calendar, and Tyler allows Calendar.
10. Back to Claude Code: "Build Phase 6." After two weeks of normal use: "Build Phase 7."
11. Echo Show 15 (any time after Phase 3): make a free Amazon developer account with your Amazon login, then ask Claude Code to build the "Pik House" skill. In the Alexa app, add a routine: when you say "open Pik," open Pik House. On the Echo, sign in once as the "Echo" Home Assistant user.
