# 3:17 AM — Vertical Slice Alpha playtest

**Branch:** `feature/vertical-slice-alpha`
**Goal:** Verify the game feels believable, readable, and appropriately tense before continuing environment and character art.

## Setup
- [ ] Use a recent Chrome or Edge with WebGL 2; `npm install && npm run dev`
- [ ] Verify apartment displays with no console errors
- [ ] Inspect the orbit cutaway; window framing and the couch should be visible
- [ ] Press **P** and compare Performance, Balanced, and Cinematic graphics
- [ ] Toggle **O** to view FPS; record performance preset and approximate FPS

## Session
- [ ] Press **V** for first person, then click scene to capture mouse
- [ ] Confirm 75-second survival timer counts down in actual seconds
- [ ] Move through the apartment using **WASD**, checking furniture collision
- [ ] Approach the dresser phone and use **E**; dispatch call should succeed
- [ ] Approach the right-wall door and use **E** before the intruder enters
- [ ] Try the power breaker, then the flashlight with **F**
- [ ] Let the intruder enter, listen for footsteps, and test a frying-pan hit
- [ ] Verify a nearby hit staggers the enemy and a miss does not
- [ ] After taking damage, use the first-aid kit on the hall console
- [ ] Survive until the sirens; verify the win screen
- [ ] Restart using **N**, don't call for help, and verify the loss screen
- [ ] Press **V** to return to orbit; ensure the end screen isn't stuck

## Art and feel
- [ ] Does the apartment look believably lived in rather than like floating furniture?
- [ ] Is the scene too bright, too dark, or legible but still threatening?
- [ ] Does the frying pan stay clear of the crosshair when idle?
- [ ] Does a hit feel substantial without excessive camera shake or visual flash?
- [ ] Does the enemy route around the couch or get stuck?
- [ ] Are keyboard prompts close enough to relevant interactive objects?
- [ ] Are ambient sounds present at a comfortable level? Test **M** to mute.

## Known constraints
- The intruder and hands are temporary procedural art.
- Collision and navigation use simplified 2D envelopes, not authored meshes.
- This is a 75-second survival demonstration; full v0.4 feature parity remains future work.
- No screenshot or software-WebGL check proves the build is visually polished on your actual GPU.

## Feedback worth capturing
Record **preset, approximate FPS, three specific visual problems, three gameplay-feel problems, and any console error**. Prioritize blocking issues before new features.
