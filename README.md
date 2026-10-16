# Career Day Playground

Four deliberately boring webcam demos + a landing page, built to be transformed
live by students and an AI coding agent. React + TypeScript + Vite +
Tailwind + MediaPipe Tasks Vision, 100% local.

See `AGENTS.md` for how the code is organized and how the agent should work.

## Startup

```bash
pnpm install          # once (needs internet)
pnpm dev              # http://localhost:5173
```

- Open **http://localhost:5173** in Chrome. Allow the camera when asked.
- Drag that window to the **external monitor** and press `Ctrl+Cmd+F`
  (macOS full screen) or Chrome's `Cmd+Shift+F`. That's the student screen.
- Keep the terminal / coding agent / editor on the MacBook screen.
- **Presenter controls:** open a second tab or window on the MacBook screen at
  **http://localhost:5173/presenter** (also reachable from the tiny
  "presenter" link at the bottom of the landing page). Entries sync live to the
  student screen.
- **Evolution page:** http://localhost:5173/evolution
- Stop: `Ctrl+C` in the terminal. Restart: `pnpm dev`. The browser tab
  reconnects on its own.

Useful scripts:

```bash
pnpm check     # type-check
pnpm build     # production build (sanity check; not needed for the event)
```

After `pnpm install` the app needs **no internet**: models are in
`public/models`, the WASM runtime is in `public/wasm`.

## Routes

| Route                  | What                                   |
| ---------------------- | -------------------------------------- |
| `/`                    | Landing page (student screen)          |
| `/reality-hacker`      | Face tracking + effects                |
| `/boss-battle`         | Hand-controlled shooter                |
| `/motion-lab`          | Body pose skeleton                     |
| `/rock-paper-scissors` | Gesture RPS vs random computer         |
| `/evolution`           | Timeline + counts of accepted changes  |
| `/presenter`           | Record / accept / edit contributions   |

## Webcam troubleshooting

- **"Camera permission was denied"** → click the camera icon at the right end
  of Chrome's address bar → Allow → press *Retry camera*. If it's not there:
  System Settings → Privacy & Security → Camera → enable Google Chrome.
- **"Webcam is busy"** → quit Zoom / FaceTime / Photo Booth / other tabs
  using the camera, then *Retry camera*.
- **Wrong camera** (built-in instead of USB) → Chrome: `chrome://settings/content/camera`
  pick the device, reload the tab.
- **Black picture but no error** → reload the tab (`Cmd+R`).
- **Face/hand/body not detected** → more light on the student, plain-ish
  background, hand fully inside the frame, 2–4 ft from the camera. Hand
  gestures work best with the palm facing the camera.
- **Laggy** → close other GPU-heavy apps; only one demo tab open at a time
  (each open demo tab runs its own inference loop).
- **Model fails to load** → check the terminal for 404s on `/models/*.task`
  or `/wasm/*`; those files must exist in `public/`.
- Keyboard fallbacks: Boss Battle (arrows/A-D + Space, R restart; or mouse),
  Rock Paper Scissors (tap ✊ ✋ ✌️, Space to play).

## Safe modification workflow (with students watching)

1. Student picks a demo and plays it. Ask: "What would you change?"
2. Agree on something concrete. Say it out loud so everyone hears the spec.
3. Tell the coding agent (see prompts below). Always end with
   *"Keep everything that already works. Test it. Don't commit."*
4. Watch the diff on the MacBook screen; narrate what it's doing.
5. The browser hot-reloads. Student tests it on the big screen.
6. Not right? "Make the lasers twice as long" → iterate.
7. Accepted? → `git add -A && git commit -m "Student: <title> — <demo>"`
   (or tell the agent "checkpoint this as <title>").
8. Record it in `/presenter` (title, one line, nickname) → *Save as accepted*.
   The landing page counter updates immediately.

Something broke badly? Ask the agent to fix forward first. To throw away the
unaccepted work in a file: `git checkout -- path/to/file`. To compare with the
original: `git diff baseline -- src/demos/boss-battle`.

## Example prompts for the agent

**Reality Hacker**
> Modify Reality Hacker so my eyes shoot red laser beams when I open my mouth.
> Add it as a new effect in effects.ts so it can be toggled. Keep the existing
> effects working. Test it and show me the changes. Do not commit.

> Add a "Fire head" effect to Reality Hacker: animated flames rising from the
> top of my head that scale with my face size. Keep all existing effects.

**Boss Battle**
> Make the boss shoot slow purple blobs down at the player every 2 seconds.
> The player has 3 lives; getting hit removes one and shows it in the HUD.
> Keep hand controls and keyboard fallback working. Test it. Do not commit.

> When the boss is defeated, split it into three smaller bosses with 3 HP each
> that move faster. Winning requires defeating all of them.

**Motion Lab**
> Add a jumping-jack counter to Motion Lab: count one rep each time both hands
> go above the head and then back below the shoulders. Show the count big.
> Keep the skeleton and the hands-up color change.

> Make my hands leave fading rainbow trails on the screen in Motion Lab.

**Rock Paper Scissors**
> Modify the Rock Paper Scissors game to make the computer celebrate when it
> wins with confetti and a taunt message. Keep all existing rules and gameplay
> working. Implement the celebration, test it, and show me the changes. Do not
> commit until I approve.

> Add a fourth move "lizard" (thumb + pinky out): lizard beats paper, rock and
> scissors beat lizard, paper and lizard tie with themselves as usual. Update the live gesture indicator and the fallback
> buttons. Keep the computer's choice fair.

**Checkpoint**
> That's accepted. Commit it as "Student: Laser Eyes — Reality Hacker".

## Git

- `baseline` tag = the original boring software. `git diff baseline --stat`
  shows everything students changed.
- One commit per accepted improvement keeps the history readable and
  reversible (`git revert <sha>` undoes one student's change without touching
  the others).
