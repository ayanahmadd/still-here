# Memory Garden

A calm, English-language reminiscence companion for people living with Alzheimer's disease and their family or friends. This hackathon prototype offers a welcoming place to share stories, without testing memory.

## Run locally

Requires Node.js 22 or newer.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. No API key is required for local guided replies; mode details are in Settings → Developer options.

## Experience

1. Begin on a quiet entrance page with an empty watercolor meadow.
2. Enter and choose one of three icon cues: Places, People, or Home. Hover/touch requests the full spoken invitation.
3. Each new companion reply is read once by default. Touch the quiet bubble to reveal its words, then answer by voice or text. No flower appears before a confirmed answer.
4. The first meaningful answer creates a seed. Each distinct additional detail advances one stage: sprout, stem, leaf, bud, petal, then bloom. Repetition is welcome and does not force progress.
5. Choose **Keep this moment**, review the words and title, then save at its current growth stage. Open the story later and choose Continue this story; saving never forces a bloom.
6. Drag or swipe the garden to explore saved flowers. Tap a flower to read/listen, continue it, or delete its story. Settings provides export.

The garden starts without prefilled stories or example flowers. Legacy fictional examples are removed when loading an older garden; personal stories remain intact. A restored unfinished story is paused, and remains available after entering.

## Included

- English interface, companion prompt, local replies, error messages, speech recognition, and device narration.
- Three watercolor plant illustrations; native SVG stages for gradual growth. Only the bloom stage uses the full flower image.
- Voice transcription review before sharing. Typing remains available when recognition is unsupported or permission is declined.
- Family hints, patient consent for every family contribution, separate attribution, and a side bud that does not replace the patient's expression.
- Immediate pause for explicit refusal, fatigue, confusion, or discomfort in English, with legacy Chinese signal support. Pausing cancels recording, narration, and pending replies.
- Local browser persistence, paused restoration, and protection against overwriting unreadable saved data.
- Responsive layouts, large controls, native modal focus management, keyboard access, and reduced motion.

Growth is a symbolic response to sharing, never a score for accuracy, ability, or health. Detail detection uses basic text normalization; it does not establish whether a recollection is true or semantically new. User-authored stories retain their original language.

## Optional cloud AI

Create `.env.local` in this app directory:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-terra
```

Restart the server, open **Settings**, and enable **Use cloud AI**. The API key stays server-side; never give it a `NEXT_PUBLIC_` prefix. Cloud mode is off each time the app opens. The local demo does not pretend to use a language model.

The route uses the [OpenAI Responses API with structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses) and `store: false`. This disables Response application-state storage; it is not a guarantee of zero provider retention. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

Only up to 20 recent text entries from the current conversation, totaling at most 16,000 characters, are sent. Other saved flowers and audio recordings are excluded. Browser speech recognition may process audio through the browser vendor's online service, with a separate explanation before microphone use. The app does not store raw recordings.

Paid cloud calls in this prototype are restricted to localhost and same-origin requests. Public deployment requires authentication, family access controls, persistent rate limits, and an appropriate privacy review.

## Validation

```powershell
npm test
npm run build
npm start
```

Automated tests cover gradual growth, repetition, consent, pauses, empty gardens, legacy example migration, storage recovery, request limits, and structured API replies. API tests use mocks and incur no paid calls. Real microphone quality and live AI output need verification on the intended device with a configured key.

## Source

- `components/GardenApp.tsx`: entrance, topics, conversation, voice, family contributions, and stories.
- `components/GardenFlower.tsx`: gradual native SVG growth and completed watercolor flower.
- `lib/garden.ts`: topics, local replies, growth, pause detection, and persistence.
- `lib/garden-ai.ts`: English companion system prompt and response schema.
- `app/api/garden/route.ts`: optional server-side cloud conversation.
- `docs/ASSETS.md`: generated illustration provenance and prompts.
- `docs/VALIDATION.md`: validation scope and limitations.

This is a companionship prototype, without diagnosis, treatment, or medical advice.

## Incremental M1–M9 update

The entrance has one action and a 750ms transition. Three topic invitations appear 400ms apart; Explore three other ideas changes the whole set. The leaf handle opens a quiet sidebar for **Picture Together**, **Familiar Sounds**, and **Little Notes**, each with an original SVG icon, route, and return-to-garden link. The teammate games are not ready: their pages clearly say Coming soon.

Growth now has eight stages. Saving retains the current stage and supports resuming a saved story. Silence pauses after 30 seconds without input. Add or edit a trusted contact in Settings to enable a user-initiated telephone link while resting; the app never calls automatically and keeps contacts out of AI input.

See [the incremental implementation record](docs/M1-M9-implementation.md) and [the local review diff](docs/M1-M9.patch). The bilingual copy table is documentation only; the app remains English. GitHub upload waits for approval of the local preview.

## Latest cognitive-friendly delivery

See [Completion report](docs/COMPLETION.md) and [Teammate integration guide](docs/TEAM-HANDOFF.md). These describe the current UI and supersede older incremental design notes. The footer and gallery entrance are removed. The top-right Settings drawer includes voice controls, optional name/contact editing, privacy, Developer options, demo reset, and leave.

Names resolve from an optional `?name=Mary` invitation, then localStorage `gardenName`, then `My Garden`. Flower storage is a validated version-2 document with a stable `garden_id`, named stages, public details, and extra provenance fields. No registration or active database is used. New replies are narrated once by default; exploring the same topic or reply never queues repeat narration. A soft original 64-second background piece plays once per visit, without looping. The top-right sound button immediately mutes music and narration, and remembers that choice. Browser autoplay restrictions may defer sound until the first click or key.

## Main branch integration

The default `main` branch runs the Next.js garden. The three activity routes directly import `src/games/PictureTogether.jsx`, `src/games/FamiliarSounds.jsx`, and `src/games/LittleNotes.jsx`. The original GitHub modules were empty; pending pages stay explicit until gameplay is implemented. Teammates can replace those component bodies without changing navigation. See [TEAM-HANDOFF.md](docs/TEAM-HANDOFF.md).
