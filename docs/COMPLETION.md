# Memory Garden — completion report

Date: 2026-10-17 (America/Los_Angeles)  
Delivery branch: `main` (integrates the `memory-garden` work)  
Repository: https://github.com/ayanahmadd/still-here

## Delivered

- English interface throughout; no registration, passwords, or server database requirement.
- Personalized garden name on the landing page and garden header. Resolution order: `?name=Mary`, then localStorage `gardenName`, then `My Garden`. A URL invitation is consumed after reading so later edits survive reload.
- Optional first-time naming invitation, reviewed voice name entry, and a large Settings name editor. Names never create flowers or count as memory details.
- Watercolor landing page with a large title/name and a translucent leaf target. The leaf is centered; “Enter” appears on hover, focus, or touch.
- Three topic cues with a large icon and a short English word. A whole new set of three can be requested.
- Topic voice hints on deliberate mouse exploration, touchstart, keyboard focus, or selection. Each hint is narrated at most once per visit, and previous narration is cancelled.
- AI bubble initially shows quiet dots. Each new reply is narrated once by default; touch/click/exploration reveals its typewriter text without repeating its voice.
- Eight growth stages: empty → seed → sprout → stem → leaf → bud → petal → bloom. First meaningful expression creates only a seed. Saving retains the current stage.
- Family tips remain separate from activities; each family detail requires consent and retains its source.
- Saved flowers grow directly in a horizontally pannable garden, at their actual stage. Mouse drag, touch swipe, and keyboard exploration are supported. Clicking a flower opens its story.
- Footer, footer divider rules, technical mode text, and the “Visit your flowers” entrance have been removed.
- Top-right Settings icon opens a soft drawer with name editing, sound volume/voice speed, reduced motion, companion-voice preference, a trusted contact, export, privacy information, and a leave action.
- Developer options contain the local/cloud mode controls and one-click demo reset. The exact privacy copy is: **Your stories stay on this device for your privacy.**
- Stable device garden UUID, named-stage localStorage documents, validated legacy-data migration, paused restoration, original-data protection, and app-scoped reset. Unrelated browser data is preserved.
- Refusal, discomfort, and idle pauses cancel voice/recording/pending replies without reducing or removing growth.
- Three original SVG activity icons, navigation, and return routes for **Picture Together**, **Familiar Sounds**, and **Little Notes**.

## Sound update

- A locally hosted, original 64-second soft-key composition plays once per visit. There is no loop, replay timer, or playlist. Ending the track does not restart it.
- Music is enabled by default; browsers may wait for a first click/key. It pauses during narration, microphone use, Settings/rest dialogs, and while the tab is hidden.
- The top-right sound icon and Settings Sound switch mute music and cancel queued/active speech immediately. Mute is remembered in localStorage (`memory-garden-audio`). Unmuting resumes an unfinished piece; it never replays a finished piece.
- Repeated hover, touch, click, and opening/closing Settings do not replay an already narrated automatic hint/reply. The explicit story-listening button remains available when sound is on.
- Music stops when leaving the garden route for a mini-game; games own their audio lifecycle.

## Connected teammate activities

**Familiar Sounds** and **Little Notes** now run the actual teammate implementations supplied from the desktop still-here project. Their sidebar badges say Explore. Picture Together remains Coming soon because its source file is still empty.

- Familiar Sounds: six local sound clips, explicit non-looping play/pause, optional reflection, and a saved listening moment under a garden-scoped localStorage key.
- Little Notes: recipient and prompt selection, explicit microphone capture, review/playback, explicit save, saved-note playback, and individual deletion. The route and heading consistently say Little Notes.
- Voice blobs live only in IndexedDB (`memory-garden-voices-v1`), scoped to the garden ID. They are not sent to AI. Recording stops after two minutes or on exit; late microphone permission releases its tracks.
- Shared return navigation, master mute, single-audio playback, background-tab pause, and audio cleanup are connected. No game result advances the main flower state.
- Reset clears this garden's voice notes as well as its localStorage. Other gardens' notes and unrelated browser data remain. Text garden export does not include voice blobs; notes are managed in Little Notes.

See [TEAM-HANDOFF.md](TEAM-HANDOFF.md) for the module contract.

## Verification

- 14 domain/API tests (including voice payload validation): gradual growth, saving without skipping stages, consent, pauses, schema validation, UUID stability, public stage import, provenance, legacy migration, malformed-data preservation, reset isolation, contact validation, and name precedence.
- Production build, type checks, and generated routes.
- Browser QA at 320, 390, 768, 1024, and 1440 CSS px: layout, large core targets, touch/hover reveal, speech deduplication, message typing/reset, footer removal, settings, name edits/voice, actual saved-stage rendering, panning, and reset.
- Additional browser checks: reviewed speech before growth, immediate refusal during recognition, cancellation of delayed AI replies, 12 flowers without a three-flower cap, real browser touch swipe, and voice volume/rate.
- Audio regression checks: the hosted WAV decodes as 64 seconds, music is non-looping, browser-blocked autoplay retries on a gesture, repeated hover does not repeat narration, master mute cancels sound and survives reload, completed music stays ended after unmute/modal changes, and sound controls retain 80px targets at mobile sizes.
- Voice and cloud calls were mocked for automated checks; no paid model call or telephone call was made. Music decoding used the actual local WAV.

## Practical limits

- A live OpenAI key is optional and currently not part of this delivery. Local guided replies work without it. Cloud calls remain localhost-only and require explicit opt-in.
- Browser speech output, recognition services, installed voices, and telephone handling vary by device. Hover narration may require a prior click/tap; click and text remain available. See the [Chromium user-activation discussion](https://groups.google.com/a/chromium.org/g/blink-dev/c/WsnBm53M4Pc/m/f6c7DBBIBwAJ) and [MDN speech synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak).
- Local storage belongs to this browser and origin. Clearing browser data removes its garden; use Export for a backup. Private browsing and storage limits can affect availability.
- This prototype provides companionship. It makes no clinical-benefit, diagnosis, treatment, or comprehensive accessibility-conformance claim.

## Message you can send to the team

> The Memory Garden shell has been integrated into `main`. The English garden, touch-to-reveal/speak interactions, saved-stage flowers, pannable garden, local storage, naming, and Settings are ready. The sidebar already links to Picture Together, Familiar Sounds, and Little Notes with matching icons. Familiar Sounds and Little Notes now run the supplied games. Picture Together still needs its implementation. Please edit your connected component in `src/games/`, keep the shared top-level return link, and follow `docs/TEAM-HANDOFF.md` for storage and readiness. No route edit is needed. Please avoid editing the shared garden state machine or replacing the shell.

中文转述：

> 花园和两个小游戏已接入 `main`：Familiar Sounds 支持选择声音、播放和保存感受；Little Notes 支持录音、回听、本机保存和删除。Picture Together 仍等待实际拼图代码。后续请从最新 `main` 开分支，按 `docs/TEAM-HANDOFF.md` 接入，保留返回花园和静音功能，不改共享花园状态机。
