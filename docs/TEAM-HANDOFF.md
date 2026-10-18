# Teammate integration guide

The default branch is now `main`. The repository root runs the Next.js Memory Garden app. The previous Vite entry is no longer active; the latest main-branch `src/App.jsx` and `src/index.css` are retained as reference.

## Run and branch

```bash
git clone https://github.com/ayanahmadd/still-here.git
cd still-here
git switch main
git pull --ff-only
git switch -c game/picture-together
npm ci
npm run dev
```

Use `game/familiar-sounds` or `game/little-notes` for the other modules. Run `npm test` and `npm run build` before opening a PR to `main`.

## Connected modules

| Sidebar entry | Existing route | Edit this component |
|---|---|---|
| Picture Together | `/activities/picture-together` | `src/games/PictureTogether.jsx` |
| Familiar Sounds | `/activities/familiar-sounds` | `src/games/FamiliarSounds.jsx` |
| Little Notes | `/activities/little-notes` | `src/games/LittleNotes.jsx` |

These modules are selected by the client adapter `components/games/GardenGameClient.tsx`, rendered by `app/activities/[activity]/page.tsx`. It supplies return, completion, garden ID, embedding, and mute props. Replace the corresponding component body with your game; no new route or sidebar link is needed. Keep the default export. Interactive modules must start with `'use client';`. New files can use JSX or TSX; update the import if you rename the component.

The shared client adapter owns the top **Return to the garden** link and master mute. Its `/?garden=1` destination bypasses the landing screen and restores saved flowers. Do not add a competing page at the same route, import GardenApp into a game, or replace the global CSS reset.

When actual gameplay is ready, set only that module's `ready` field to `true` in `lib/garden-activities.ts`. This changes its sidebar badge from Coming soon to Explore. Matching SVG icons are already in `components/GardenActivityIcon.tsx`.

### Current availability

All three activities use the actual desktop teammate implementations and are marked ready. Picture Together was supplied in the later still-here-20261018T000906Z-1-001 folder. The empty GentleQuestions.jsx is preserved as a separate module. Teammate layouts and steps are retained, with recording privacy/lifecycle, navigation, and storage adapted to the garden.

## Storage and audio contract

- No accounts, passwords, server database, or remote writes are required. Voice notes use local browser IndexedDB.
- `lib/garden.ts` owns the shared garden. `readGarden()` validates/migrates storage and returns a stable `garden_id` and numeric-stage model.
- LocalStorage `memory-garden-v1` contains a version-2 document with named stages and speaker provenance. `gardenName` stores the optional owner name.
- Games must not overwrite the flower document or advance flower stages based on game results. Games are not memory scores.
- Save optional game progress under `memory-garden-game-<game-id>-<garden_id>`. Read browser storage after mounting and handle unavailable storage without crashing. Demo reset clears these app-owned keys and leaves unrelated storage alone.
- The garden's original 64-second background track plays once and stops when the shell unmounts for a game. Games own their audio cleanup and must respect `localStorage.getItem('memory-garden-audio') === 'muted'` before playing sound.
- Start game audio after an intentional gesture, cancel prior speech instead of queuing it, and stop all audio/timers/recording on unmount or pause. Never start the microphone automatically. Little Notes is an explicit exception to transcript-only input: after a disclosed recording/review flow, Save voice note retains its blob locally using `lib/garden-recordings.ts`. Never send it to AI. Notes can be deleted individually and are removed by garden-scoped demo reset.

## Interaction checklist

- [ ] English interface; warm, short, adult language.
- [ ] Existing sidebar route displays the actual game; ready badge changed only for finished modules.
- [ ] Shared return link restores the garden, flowers, and name.
- [ ] Core icon controls are at least 80x80px, labeled, keyboard accessible, and support reduced motion.
- [ ] Preserve garden color/font variables; scope game styles to the module.
- [ ] No scoring, failure pressure, memory-accuracy quizzes, required completion, or shared-state writes.
- [ ] Touch, keyboard, mute, pause, and audio cleanup verified.
- [ ] `npm test` and `npm run build` pass.

## Current callback behavior

Familiar Sounds calls `onComplete` to save the optional reflection in its own garden-scoped localStorage key. A failed write remains retryable. Little Notes saves its audio through the shared IndexedDB helper, then notifies the adapter. Picture Together also saves a separate local picture moment under its own activity key, once per kept round. None of these callbacks creates or blooms a memory flower. The shared header always permits returning, and `embedded` hides redundant initial back buttons.

## Picture Together integration

The original Vite `import.meta.glob` has been replaced by `lib/garden-pictures.json`. Its 15 example photos live in `public/pictures/`, grouped into six themes. Add image paths to the manifest when adding assets; the asset test checks that every theme has packaged files. The original drag engine is the pinned `react-jigsaw-puzzle@1.0.5` dependency, loaded client-side. Its CSS and the supplied scoped PictureTogether.css are retained. Drag play uses mouse/touch; keyboard users can choose Just look at this picture and Keep this picture without solving. Exiting an interrupted touch drag restores page scrolling.
