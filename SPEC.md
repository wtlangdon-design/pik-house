# Pik House Feed: Build Spec

Nov 21, 2026 · Tyler Langdon · Living version: https://claude.ai/artifact/WBhqdogTLhmR8pmf2NhLMX

## Summary

Build one custom Home Assistant dashboard card, the **Pik House Feed**, that runs full-screen on a Chromebook standing in tent mode on the kitchen counter. It shows the locked **Daylight** design: Pik on the left, one item at a time in a speech bubble, status pebbles along the bottom, and detail sheets that slide up. Claude, running inside Home Assistant, is the brain behind Pik's voice and the email-reading cards.

The working prototype is the reference for every visual and interaction decision. It ships as **reference/daylight-reference.html** in this repo and runs in any browser with fake data. Pik's original artwork (five states) is in **reference/pik/**.

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
| Plants | 40 plants in 7 watering groups, one Ecowitt WH51 soil sensor per group | Ecowitt (GW1200 gateway) |
| Air | Ecowitt WH41 PM2.5, outdoors under cover | Ecowitt |
| Thermostat | Ecobee | Ecobee |
| Energy | Tesla Powerwall 2 + solar | Tesla Powerwall (local) |
| Doorbell | Ring | Ring |
| Yard watering | Rachio | Rachio (needs Cloud for webhooks) |
| Garden watering | B-Hyve | B-Hyve (HACS) |
| Lights | Wemo (local) and Leviton | WeMo; Leviton via Matter or HACS |
| Bills and deliveries | A Gmail label read over IMAP, sorted by Claude | IMAP + AI Task |
| Personality | Warm, dry wit. Humor only on low-stakes cards; urgent cards are plain | Prompt + card copy |

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
plant_groups:            # walking order = route order
  - { name: Kitchen, indicator: basil, plants: 3,
      moisture: sensor.soil_moisture_1, threshold: input_number.thirst_kitchen }
  # ...one entry per group, 7 total (Tyler's real list replaces these)
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
| First freeze tonight | Forecast low ≤ 32°F | Automation, once per evening |
| Nobody's home, heat at 70° | Everyone away 30 min and heat ≥ 68° | Automation |
| Bills, price increases, deliveries | New email under the Gmail label | IMAP + AI Task (Claude) |
| Trash goes out | Tuesday 8:00 AM | Automation |
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
- **Plan B:** two `timer` helpers plus two `input_text` labels, with a `script.kitchen_timer` exposed to Assist. Claude calls the script, and the card reads the helpers.
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

## Build phases

Build in this order. Each phase ends with Tyler checking it on the Chromebook, and the next phase starts only after he signs off. Phase 0 needs no hub, so it can start today.

**Repo layout**

```text
pik-house/
  card/src/            TypeScript + Lit source (pik-house-card.ts, views, pik-art.ts, mock-data.ts)
  card/dist/           pik-house-card.js (one bundled file, committed for HACS)
  ha/packages/         feed.yaml, plants.yaml, energy.yaml, voice.yaml, reminders.yaml, email.yaml
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
- [ ] Done when: the arrows match the Tesla app for a day and a night; a light responds within 1 second; "Watered" clears a group and its card.

**Phase 4: voice extras**

- [ ] Echo scripts and the Now playing pebble; timers (Plan A or B); reminders.
- [ ] Done when: "Pik, put on Judy Justice" plays on the Echo Show; two named timers count down and chime; Tuesday's trash card appears at 8:00.

**Phase 5: Claude extras**

- [ ] Email cards from the Gmail label, and the Sunday report.
- [ ] Done when: a test bill email becomes a card within 2 minutes with the right amount and due date; junk is ignored.

## Things to verify before relying on them

These came from research, not from testing on Tyler's hardware. Claude Code checks each one against the current docs or a live install, writes the answer into this table, and tells Tyler if a plan has to change.

| Question | Why it matters | If the answer is no |
| --- | --- | --- |
| Does Voice Satellite expose active timers (name, end time) to the frontend or as entities? | The card draws its own timer chips | Plan B: timer helpers + `script.kitchen_timer` |
| Can the card start a conversation on the satellite and mute it? | Tap-to-talk and the mic button | Keep Voice Satellite's own overlay for tap-to-talk; hide the card's mic button |
| Does the core Alexa Devices integration give the Echo Show a `media_player` with title and play/pause? | The Now playing pebble | Use the Alexa Media Player custom integration (HACS) for the media player only |
| Does `alexa_devices.send_text_command` start Prime Video shows on an Echo Show ("play Judy Justice on Prime Video")? | The Judy Justice request | Send "open Prime Video" plus the show name, or fall back to an Alexa routine triggered by the text command |
| Do text commands still work with the Echo's mic muted? | Tyler may mute Alexa | Leave the Echo mic on |
| Sign conventions in the Powerwall integration (battery charging vs discharging; grid import vs export) | Flow arrows point the right way | Flip in the card config, not in code |
| Does the Ecowitt integration show each WH51 as its own moisture sensor through the GW1200? | Plant groups | Add channels one at a time and label them in Home Assistant |
| Can Rachio and B-Hyve be paused or put in standby from Home Assistant? | "Pause until March" | Show status only; the button opens the vendor app |
| Chromebook kiosk: does Chrome full screen + kiosk mode stay awake and keep the mic on all day? | Always-on counter screen | Try the Kiosk Satellite Android app on the Chromebook; set the screen to stay on while charging |

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
5. **Send Claude your plant list** (names, rooms, rough pot sizes) so the 7 groups and their indicator plants are real before Phase 3.

**When the Green arrives** (Claude walks through each step in chat)

1. Plug in the Green, create the owner account, and start the Home Assistant Cloud trial.
2. Create an Anthropic API key with a monthly spending cap, and add the Anthropic integration.
3. Add the device integrations: Ecowitt, Ecobee, Powerwall, Ring, Rachio, B-Hyve, WeMo, Leviton, Alexa Devices.
4. Install HACS, then Voice Satellite, and set up the Chromebook as a satellite.
5. Back to Claude Code: "Build Phase 1." Then Phases 2 through 5, one at a time, checking each on the Chromebook.
