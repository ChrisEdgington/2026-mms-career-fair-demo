# AGENTS.md — read this before changing anything

## What this project is

A playground for a middle-school career fair (Oct 16, 2026). Students propose
changes to four deliberately boring webcam demos; an AI coding agent (you)
implements them live; the presenter (Chris) reviews, tests, and accepts them.
The point is to show that software engineering = imagining, describing,
building, testing, improving — and that AI agents now do a lot of the typing.

**The demos start simple on purpose. Students supply the creativity. You
build real, working features. Nothing is faked.**

## Ground rules

1. **Build the real thing.** Implement genuinely working features. Never
   simulate AI activity, stub a feature behind a toggle, or fake a result.
2. **Changes accumulate.** Keep every previously accepted improvement working
   unless the presenter explicitly asks to remove or replace it. Add; don't
   overwrite.
3. **The presenter approves.** Implement what you're asked, test it, show the
   diff summary, and stop. **Never `git commit`, `git checkout`, `git reset`,
   or `git stash` on your own.** Commit only when the presenter says the
   change is accepted ("checkpoint it", "commit this").
4. **Protect shared infrastructure.** `src/camera/` and `src/vision/` are
   shared by all four demos. Don't modify them for a demo-specific feature
   unless the feature truly needs a new shared capability (e.g. a new helper in
   `vision/handGestures.ts`). If you must touch them, re-test all four demos.
5. **Keep the other three demos working.** After a change, confirm `pnpm
   check` passes (type-check) and open the affected demo in the browser. If
   you have browser automation, click through the landing page and the demo.
6. **Don't collect or store student data.** No names (nicknames are fine), no
   saving webcam frames, no network calls with camera data, no face
   recognition. Everything stays local and ephemeral.
7. **Be ambitious, stay simple.** Big features are welcome (new mechanics,
   new CV interactions, multi-file changes). Plain functions and plain data
   beat frameworks and abstractions. No new heavy dependencies without asking.
8. **No cloud, no backend, no CDN.** Everything runs from `localhost`. Model
   and WASM files live in `public/`.

## Layout

```
src/
  app/App.tsx                 routes (add a route here for a new page)
  app/navigation/projects.ts  the four demos: names, paths, colors
  components/                 DemoShell (frame + back button), StatusPill,
                              DemoErrorBoundary, useAnimationLoop
  camera/                     SHARED webcam: cameraManager (singleton stream),
                              useCamera, CameraView (video + overlay canvas)
  vision/                     SHARED CV: models.ts (lazy local MediaPipe
                              loaders), useVisionModel hooks, coords (mirror
                              mapping), draw helpers, handGestures (finger
                              states, hand shapes, stabilizer), faceLandmarks
                              (face indices, geometry, blendshapes)
  demos/reality-hacker/       RealityHacker.tsx (loop) + effects.ts (EFFECTS list)
  demos/boss-battle/          BossBattle.tsx (page, input merging, loop)
                              useHandControls.ts (hand → aim/fire)
                              game/state.ts (data + constants)
                              game/update.ts (rules/physics)
                              game/render.ts (drawing)
  demos/motion-lab/           MotionLab.tsx + skeleton.ts (pose helpers)
  demos/rock-paper-scissors/  RockPaperScissors.tsx (round state machine)
                              rules.ts (moves, winner), gestureToMove.ts
  contributions/              localStorage history: store.ts, hooks,
                              RecentImprovements footer
  pages/                      Landing, Evolution, Presenter
  styles/index.css            Tailwind + a few global keyframes/buttons
public/models/*.task          MediaPipe models (face, hand, gesture, pose)
public/wasm/                  MediaPipe WASM runtime
```

## How the demos work (so you can extend them)

Every demo follows the same pattern:

```
useCamera (via CameraView) → useXxxLandmarker() → useAnimationLoop(ready, (now) => {
  if (video has a new frame) result = model.detectForVideo(video, now)
  clear(ctx); draw stuff using toCanvas()/px() for mirrored coordinates
})
```

- The video is mirrored with CSS; the canvas is **not**. Always convert
  normalized landmarks with `toCanvas()` (or `frame.px()` in effects) so x is
  flipped. Text and images then draw the right way round.
- Canvas pixel size == video pixel size (set by CameraView on metadata).
- Inference only runs when `video.currentTime` changes (one inference per
  camera frame). Keep heavy work inside the loop cheap; precompute outside.
- React state updates inside the loop should be guarded (only `setState` when
  a value actually changes) to avoid re-rendering 30× per second.

### Reality Hacker — add an effect
Add an `Effect` to `EFFECTS` in `src/demos/reality-hacker/effects.ts`. The
`FaceFrame` gives you `ctx`, `px()`, `face` (eyes, nose, mouth, chin,
forehead, width, height, roll), `expr` (smile, mouthOpen, blinks, browsUp),
all `landmarks`, `time`, and `faceWidthPx`. Buttons appear automatically.
For images/sprites, create an `Image` once at module level and draw it.
For particles (fire, ducks, lasers), keep an array at module level or in a
`useRef` and update it each frame using `frame.time`.

### Boss Battle — change gameplay
- New fields → `game/state.ts` (and `createInitialState`).
- Rules, movement, collisions → `game/update.ts` (pure, dt in seconds).
- Looks → `game/render.ts`. World is 960×540 logical pixels.
- New gestures → `useHandControls.ts` (uses `classifyHandShape` from
  `vision/handGestures.ts`; add shapes there if needed).
- Keyboard: arrows/A-D move, Space fires, R restarts. Mouse: move + click.
  Keep a non-camera fallback for anything new you add.

### Motion Lab — add body interactions
Pose landmarks are 33 points (`POSE` indices in `skeleton.ts`), each with
`visibility`. Use `MIN_VISIBILITY`; many students will only show their upper
body. Add detectors as small pure functions (like `bothHandsUp`) and call them
from the loop in `MotionLab.tsx`. For games, follow the Boss Battle split
(state / update / render) in a `game/` folder.

### Rock Paper Scissors — new rules or moves
- Moves and who-beats-whom → `rules.ts` (`Move`, `MOVES`, `BEATS`, emoji).
- Gesture → move mapping → `gestureToMove.ts` (hand shapes come from
  `vision/handGestures.ts`; add a new shape there, e.g. `'thumb'`).
- Round flow / timing → `RockPaperScissors.tsx` (`Phase`, `COUNT_STEP_MS`,
  `SHOOT_WINDOW_MS`). The computer's move is chosen in `startRound` BEFORE the
  player's gesture is read. Keep it that way; the game must not cheat.

### Adding a 5th demo
Add it to `PROJECTS` in `app/navigation/projects.ts` (the `DemoId` union too),
add a route in `App.tsx` wrapped in `DemoErrorBoundary`, create
`src/demos/<name>/`. Use `DemoShell` for the frame.

## Testing after a change

```
pnpm check          # tsc type-check (must be clean)
```
Then look at it in the browser at http://localhost:5173 (dev server should
already be running; hot reload keeps the camera stream alive). If you can
drive a browser: load the landing page, open the demo, confirm no console
errors, click its buttons, press ← Menu. Report what you verified and what
needs a human with a webcam.

## Recording an accepted contribution

The presenter records it at http://localhost:5173/presenter (demo, title,
description, optional nickname → "Save as accepted"). It's localStorage;
you normally don't need to touch it. If asked to add one from code, use
`addContribution()` in `src/contributions/store.ts`.

## Checkpoints (only when the presenter says so)

```
git add -A && git commit -m "Student: <title> — <demo>"
```
Tag notable moments if asked: `git tag -a <name> -m "..."`. The original
software is tag `baseline`.

## Recovering from a broken change

- First try to fix forward: read the error (browser console / terminal),
  fix the file, re-check types.
- A demo crash shows the error boundary; "Try again" remounts it.
- To discard an unaccepted change to specific files (only when asked):
  `git checkout -- <file>` or `git diff` to review first.
- To see the original: `git show baseline:<path>` or `git diff baseline`.
- Never `git reset --hard` without explicit approval — it would delete other
  students' uncommitted work.
- If the webcam dies: press "Retry camera" in the demo; if that fails, reload
  the browser tab. The dev server itself rarely needs a restart (`pnpm dev`).
