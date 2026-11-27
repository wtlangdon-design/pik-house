# Thanksgiving 2026: debrief

Dinner for 7, Thursday November 26. **It went great; Tyler wouldn't change anything on the menu or the plan.** These notes are for the next holiday plan, mostly from what the hub's data showed on the day.

## What worked
- The plan as a living schedule. Moving things on the fly (dinner prep up to 7 pm Wednesday, the mac topping and sprouts crisps moved to Thursday closer to serving, the turkey shifts) kept every screen and the countdown in step.
- The Inkbird on the turkey, with a check every 10 minutes pushed to both phones, meant nobody had to keep going outside.
- Holding the sides: when the smoker was too hot to hold food, the stuffing stayed in the oven beside the mac and the green beans went in a pre-warmed cooler. Dinner still landed around 4:00.

## What to build into the next plan
1. **Fuel checks on the smoker.** The smoker lost heat twice on Thursday afternoon, needing fuel or a relight each time: 237° → 201° (2:13–2:24) and 318° → 235° (2:33–2:45). Each drop stalled the breast at 150–155°. Add a "fuel check" task before the smoker goes up for the finish, and a refill check every hour after that. When the smoker probe falls 2°+ a minute for 5 minutes, warn right away (it took a 10-minute check to spot it).
2. **Turkey timing.** The breast took longer than planned from 140° to 165° (about 0.3° a minute with the smoker under 250°). Plan the turkey's finish at 325–350° from the start, not as a mid-cook bump. Breast hit 163° at 3:01, then rested.
3. **Inkbird range.** The probes dropped out often from the smoker (each came back within a few minutes). Move the Bluetooth stick closer or add a Bluetooth proxy near the back door before the next long cook.
4. **Fewer announcements.** The Echo read-outs for every task and probe got annoying; this year they were turned off on Wednesday. Next plan: start with phone pushes only, and voice only for timers and "the turkey is done".
5. **Don't let the hot hold depend on the turkey.** The plan put the stuffing and green beans in the smoker at 3:00, so a late turkey bumped them. Default the hold to the warmed cooler and use the smoker only if the turkey is already off.
6. **Phone app.** Tyler's Android app blocked the dashboard ("insecure connection") until "Use Home Assistant Cloud" was turned on and the home Wi-Fi added. Done now; check Charlie's phone has the same setting before the next holiday.

## Where things are
- Plan (reusable template): `holiday/thanksgiving-2026.json`
- Archived hub package and dashboard: `ha/archive/`
- To start the next holiday: see the note at the top of `ha/README.md`.
