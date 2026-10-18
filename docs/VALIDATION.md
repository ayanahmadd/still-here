# Validation scope

## Automated checks

- `npm test`: domain rules, duplicate acceptance, consent, pause behavior, local storage restoration, malformed-data protection, API input/origin/byte limits, structured response validation, and provider failure handling.
- `npm run build`: production compilation, type checking, and route generation.
- Browser QA in Chrome at 320, 390, 768, 1024, and 1440 CSS px: image loading, layout overflow, typed conversation, gradual growth, family consent/refusal/revocation, pause/resume/reload, completion, source labels, saved-flower collection, and reduced motion.
- Simulated browser speech: recognition is reviewed before growth; an explicit stop interrupts recognition; an aborted recognition callback cannot reopen the review dialog.
- Simulated cloud response: pausing cancels the pending request; a late response cannot modify the paused conversation or resume speech.

## Not verified by these checks

- Real microphone capture, browser speech-provider availability or English recognition quality.
- A real model response with the owner's API credentials, multilingual model quality, or exhaustive protection against fabricated memories.
- Clinical benefit, suitability for an individual patient, or comprehensive accessibility conformance.
- Public-host authentication, family sharing, durable rate limits, or multi-device data recovery. These are not implemented in the local prototype.

Fresh gardens contain no example memories. Automated provider and voice checks use test doubles, not real patient data or a paid model call.

## M1–M9 incremental checks

- Ten domain/API tests include the eight-stage growth invariant, preserving saved stages, one-time migration of legacy growth data, and phone-number validation with contact/story storage separation.
- Browser checks cover the one-button entrance and 750ms transition, three staggered invitations, whole-set replacement, no plants before a confirmed answer, seed-only first expression, resuming saved growth, separate family consent, the activity drawer, routes and return links, phone URI generation, and idle pause.
- The 30-second idle path is tested with only that timer shortened by a test double. Native voice and late cloud responses are also mocked. No telephone call is placed.
- Three teammate game entry points are scaffolds labeled Coming soon; gameplay is not implemented.

## Entrance refinement after local review

The entrance-only additions are in `app/entrance.css`, imported after `garden.css`. The existing watercolor asset, palette variables, garden screens, and input interactions remain in use.

- Title: 63.8px desktop / 48.4px mobile (+10%), weight 600.
- Shared title/subtitle halo: wide white radial gradient, opacity 0.4.
- Content: 5vw left offset. The entrance image crop keeps the gate and path visible on the right.
- CTA: text only; rgba(60,90,60,0.8), 4px backdrop blur. Fine-pointer hover scales 1.05 with opacity 0.9 and a restrained white border glow.
- Click: centered, low-opacity 650ms ripple; supports keyboard activation.
- Background: nested motion wrapper scales 1 to 1.03 over 20 seconds, ease-in-out, alternate infinite. Keeping the breathing transform on a separate wrapper avoids conflicting with the entry zoom.
- Gate: decorative right-path hover region activates a faint 3.5-second breathing glow; it is not a separate navigation control.
- Entry: the outer background frame scales to 1.07 and fades out over 750ms as a central light expands. A separate `arriving` state keeps that light mounted after switching to the empty garden, then fades it for 550ms to avoid an abrupt cut.
- Reduced motion: disables decorative movement and skips the transition delay.

Production build and browser checks passed at 320, 390, 768, 1024, 1440, and 1920 CSS px. Checks included halo/typography, CTA hover and ripple, gate cue, breathing duration and scale, transition completion, no flowers, keyboard entry, and reduced motion. GitHub publication remains pending user approval.

## One-pass audio update (2026-10-17)

- `public/audio/garden-morning.wav` decoded in the browser: 64 seconds, mono, without looping.
- Browser audio test doubles verified default playback, gesture fallback after autoplay denial, music pausing during speech/dialogs, immediate master mute, persisted mute on reload, and no replay after `ended`, unmute, or Settings close.
- Re-entering a hovered topic or touching an already narrated reply does not queue the narration again. A browser-blocked unheard narration may be retried by a deliberate gesture.
- Sound and Settings targets remain at least 80x80px with no horizontal overflow or name overlap at 320, 390, 768, and 1440px.
- Existing reviewed-voice, refusal, late-reply cancellation, saved-stage, touch-pan, and three-game navigation browser checks pass.

## Main branch integration

- Combined the latest GitHub main history with Memory Garden, retaining the existing main-branch src/App.jsx, src/index.css, and empty GentleQuestions.jsx.
- The three activity routes now import the corresponding src/games components directly. Pending pages remain honest because both GitHub and the supplied still-here-main/src/games directory contained empty game files.
- Production build and 13 domain/API tests pass. Browser checks cover all three sidebar links, mobile/desktop navigation, returning to the garden, and the one-pass/mute audio regression.

## Actual game integration

- Production build/type checks and 14 domain/API tests pass, including empty/oversized/unscoped voice payload rejection.
- Browser QA used Chrome's synthetic test microphone, not a real microphone or patient recording. Verified no automatic capture, explicit review before saving, IndexedDB persistence after reload, per-note deletion, and late-permission cleanup after leaving.
- All six supplied MP3 files decode in the browser. Verified play, pause, master mute, no loop, saved sound reflection, and unchanged saved flowers.
- Reset deletes the current garden's voice notes and game progress while preserving another garden's note and unrelated storage.
- Responsive layouts checked at 320, 390, 768, and 1440px.
