# Teammate integration guide

Start from the `memory-garden` branch. The repository root is the Next.js app.

## Run and branch

```bash
git clone https://github.com/ayanahmadd/still-here.git
cd still-here
git switch memory-garden
git switch -c game/picture-together
npm ci
npm run dev
```

Use `game/familiar-sounds` or `game/little-notes` for the other modules. Run `npm test` and `npm run build` before requesting integration. Keep one teammate responsible for the small shared routing edit below to avoid conflicts.

## Reserved entry points

| Game | Existing route | Suggested component |
|---|---|---|
| Picture Together | `/activities/picture-together` | `components/games/PictureTogether.tsx` |
| Familiar Sounds | `/activities/familiar-sounds` | `components/games/FamiliarSounds.tsx` |
| Little Notes | `/activities/little-notes` | `components/games/LittleNotes.tsx` |

- Sidebar: `components/GardenActivities.tsx`.
- Names, descriptions, audience labels, IDs: `lib/garden-activities.ts`.
- Existing matching SVG icons: `components/GardenActivityIcon.tsx`.
- Shared route and return links: `app/activities/[activity]/page.tsx`.
- The routes currently show **Coming soon**; no game is presented as complete.

## Component contract

Each teammate delivers a default-export React component. Interactive games use `'use client'`. Keep game logic, styles, and assets inside that module's own files. Do not import `GardenApp` or add a second global stylesheet reset.

Example:

```tsx
'use client';
import { useState } from 'react';

export default function PictureTogether() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section aria-label="Picture Together">
      {/* Your actual game UI and local state. */}
      <button
        style={{ minWidth: 80, minHeight: 80 }}
        aria-label="Choose this picture"
        onClick={() => setSelected('picture-1')}
      >
        Choose
      </button>
      {selected && <p>You chose a picture.</p>}
    </section>
  );
}
```

When a module is ready, the integrator imports it in the existing activity route and replaces only the corresponding placeholder body. Preserve the shared header:

```tsx
// In app/activities/[activity]/page.tsx:
import PictureTogether from '../../../components/games/PictureTogether';

// After resolving and validating `activity`:
if (activity === 'picture-together') {
  return (
    <main className="garden-activity-page">
      <header>
        <Link href="/?garden=1" className="garden-text-button">
          <ArrowLeft size={19} />Return to the garden
        </Link>
        <span>Memory Garden</span>
      </header>
      <PictureTogether />
    </main>
  );
}
```

Use the same pattern for the other two IDs. Do not create a second page with the same URL alongside the shared generated route. The sidebar currently marks all modules Coming soon. When the first game is connected, replace its shared badge with a per-ID availability check, for example: `const connected = new Set(['picture-together']);` and `<em>{connected.has(activity.id) ? 'Explore' : 'Coming soon'}</em>`. Add other IDs only after their actual components are connected.

The `/?garden=1` return link bypasses the landing screen and restores the garden. Opening activities through the sidebar stops narration/recording and pauses the current story before navigation.

## Storage contract

No login, passwords, Supabase calls, or remote writes are needed.

- `lib/garden.ts`: `readGarden()`, `writeGarden()`, `GROWTH_STAGES`, and `resetGarden()`.
- `garden_id`: stable UUID in localStorage and in the saved garden document.
- `gardenName`: optional owner name, managed by `lib/garden-name.ts`.
- `memory-garden-v1`: existing compatibility key; the **document inside is now version 2**, with string stages and public flower fields.
- `readGarden()` returns the internal numeric-stage model for `GardenFlower`, after validation/migration. It restores an unfinished conversation paused.
- Public flower fields: `id`, `memory_title`, `stage`, `created_at`, and `details`. Additional entries preserve speaker attribution and consent. Do not flatten family notes into patient statements.

Games should store their own progress under a separate app-owned key, for example:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { readGarden } from '../../lib/garden';

export function useGameStorageKey(gameId: string) {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    try {
      const garden = readGarden();
      setKey('memory-garden-game-' + gameId + '-' + garden.garden_id);
    } catch {
      setKey(null); // Let the game run without persistence.
    }
  }, [gameId]);
  return key;
}
```

The import path above assumes the helper is directly under `components/games/`; adjust relative imports if you nest it further. Write/read a small JSON value only after the key is available. Handle storage errors with an English message rather than crashing.

Demo reset removes the garden, name, contact, and keys beginning with `memory-garden-game-`. It leaves unrelated localStorage keys untouched.

**Do not directly overwrite the shared flower document or advance its stage from game results.** Game outcomes are not a memory score. Any future game-to-flower contribution should be explicitly designed with the garden owner first.

## Interaction rules

- English UI; short, adult, warm language.
- No quizzes about memory accuracy, failure states, scores, rankings, or pressure.
- Large interactive targets (80×80px for core icon controls), accessible labels, keyboard operation, and reduced motion.
- Preserve `--garden-paper`, `--garden-ink`, `--garden-green`, `--garden-sage`, and `--garden-serif`.
- Start audio after an intentional gesture. Cancel previous speech to avoid queues. Stop audio/timers/recognition on unmount and pause.
- Do not start a microphone automatically or store raw audio.
- Keep game controls out of the family consent panel.
- A user can leave at any time. Never require game completion before returning.

## Integration acceptance

- [ ] Existing sidebar route opens the real game.
- [ ] “Coming soon” is removed only for ready modules.
- [ ] Top return link brings the user to the garden.
- [ ] Returning preserves existing flowers and name.
- [ ] No extra login, remote storage, or shared-stage writes.
- [ ] Touch, keyboard, audio cleanup, and reduced motion work.
- [ ] `npm test` and `npm run build` pass.
