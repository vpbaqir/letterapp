# Write & Unlock MVP

## Goal
Build a polished, touch-first handwriting game around one clear loop: write a letter, complete the parent-set target, unlock the Endless Runner, then return to writing.

## Experience
- Start in a ready-to-use child home screen with a sample plan for Adam, plus a clear switch into Parent mode.
- Parent mode supports child name, letter selection, sequential/custom/random order, per-letter writing targets, guided/semi-guided/free modes, and the Runner reward.
- Child mode includes the current-letter home, progress cards, letter journey, a finger/stylus canvas, undo, clear, forgiving attempt validation, encouraging feedback, completion celebration, and game unlock.
- Endless Runner is a short, playable reward with jump controls, obstacles, star collection, score, timer, and return-to-writing flow.
- Progress and parent choices persist on the device without requiring an account.

## Visual Direction
- Premium mobile-game aesthetic with warm cream, sky blue, coral, mint, and golden accents.
- Soft 3D pencil and Runner artwork, spacious rounded surfaces, restrained shadows, large friendly type, and floating navigation.
- Responsive, accessible touch targets across phones, tablets, and desktop; animations respect reduced-motion settings.

## Technical Details
- Keep the complete MVP on the home route as a state-driven app experience; no unused or dead navigation.
- Use pointer events and canvas rendering for handwriting, with stroke length, bounds, segment count, and coverage checks to reject taps while remaining child-friendly.
- Store only non-sensitive plan and progress data locally.
- Add route-specific metadata and a branded favicon.
- Verify the full setup → write → unlock → play → return flow, plus mobile and desktop layouts.

## Scope Boundary
The first version includes one polished reward game, Endless Runner. Additional game cards may appear as future locked rewards but are not playable yet.
