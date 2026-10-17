# Memory Garden — completion report

Date: 2026-10-17 (America/Los_Angeles)  
Delivery branch: `memory-garden`  
Repository: https://github.com/ayanahmadd/still-here

## Delivered

- English interface throughout; no registration, passwords, or active database requirement.
- Personalized garden name on the landing page and garden header. Resolution order: `?name=Mary`, then localStorage `gardenName`, then `My Garden`. A URL invitation is consumed after reading so later edits survive reload.
- Optional first-time naming invitation, reviewed voice name entry, and a large Settings name editor. Names never create flowers or count as memory details.
- Watercolor landing page with a large title/name and a translucent leaf target. The leaf is centered; “Enter” appears on hover, focus, or touch.
- Three topic cues with a large icon and a short English word. A whole new set of three can be requested.
- Topic voice hints on deliberate mouse exploration, touchstart, keyboard focus, or selection. Speech is deduplicated and previous narration is cancelled.
- AI bubble initially shows quiet dots. Touch/click/exploration reveals a typewriter message and requests device narration. New replies do not narrate themselves.
- Eight growth stages: empty → seed → sprout → stem → leaf → bud → petal → bloom. First meaningful expression creates only a seed. Saving retains the current stage.
- Family tips remain separate from activities; each family detail requires consent and retains its source.
- Saved flowers grow directly in a horizontally pannable garden, at their actual stage. Mouse drag, touch swipe, and keyboard exploration are supported. Clicking a flower opens its story.
- Footer, footer divider rules, technical mode text, and the “Visit your flowers” entrance have been removed.
- Top-right Settings icon opens a soft drawer with name editing, volume/speed, reduced motion, read-on-touch preference, a trusted contact, export, privacy information, and a leave action.
- Developer options contain the local/cloud mode controls and one-click demo reset. The exact privacy copy is: **Your stories stay on this device for your privacy.**
- Stable device garden UUID, named-stage localStorage documents, validated legacy-data migration, paused restoration, original-data protection, and app-scoped reset. Unrelated browser data is preserved.
- Refusal, discomfort, and idle pauses cancel voice/recording/pending replies without reducing or removing growth.
- Three original SVG activity icons, navigation, and return routes for **Picture Together**, **Familiar Sounds**, and **Little Notes**.

## Teammate games still to connect

The three game pages intentionally say **Coming soon**. Their gameplay is not implemented by this delivery. Use [TEAM-HANDOFF.md](TEAM-HANDOFF.md) to connect the teammate components.

## Verification

- 13 domain/API tests: gradual growth, saving without skipping stages, consent, pauses, schema validation, UUID stability, public stage import, provenance, legacy migration, malformed-data preservation, reset isolation, contact validation, and name precedence.
- Production build, type checks, and generated routes.
- Browser QA at 320, 390, 768, 1024, and 1440 CSS px: layout, large core targets, touch/hover reveal, speech deduplication, message typing/reset, footer removal, settings, name edits/voice, actual saved-stage rendering, panning, and reset.
- Additional browser checks: reviewed speech before growth, immediate refusal during recognition, cancellation of delayed AI replies, 12 flowers without a three-flower cap, real browser touch swipe, and voice volume/rate.
- Voice and cloud calls were mocked for automated checks; no paid model call or telephone call was made.

## Practical limits

- A live OpenAI key is optional and currently not part of this delivery. Local guided replies work without it. Cloud calls remain localhost-only and require explicit opt-in.
- Browser speech output, recognition services, installed voices, and telephone handling vary by device. Hover narration may require a prior click/tap; click and text remain available. See the [Chromium user-activation discussion](https://groups.google.com/a/chromium.org/g/blink-dev/c/WsnBm53M4Pc/m/f6c7DBBIBwAJ) and [MDN speech synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak).
- Local storage belongs to this browser and origin. Clearing browser data removes its garden; use Export for a backup. Private browsing and storage limits can affect availability.
- This prototype provides companionship. It makes no clinical-benefit, diagnosis, treatment, or comprehensive accessibility-conformance claim.

## Message you can send to the team

> The Memory Garden shell is finished on the `memory-garden` branch. The English garden, touch-to-reveal/speak interactions, saved-stage flowers, pannable garden, local storage, naming, and Settings are ready. The sidebar already links to Picture Together, Familiar Sounds, and Little Notes with matching icons. Those pages are honest placeholders until your games are ready. Please create your game component under `components/games/`, keep the shared top-level return link, and follow `docs/TEAM-HANDOFF.md` for routing and storage. Please avoid editing the shared garden state machine or replacing the shell.

中文转述：

> 花园主框架已经完成并上传到 `memory-garden` 分支。英文界面、触碰显示/朗读、渐进生长、本机保存、花园拖动、名字和设置都已就绪。侧栏已准备好三个小游戏入口和图标，游戏正文等你们接入。请把各自组件放到 `components/games/`，保留“返回花园”，按 `docs/TEAM-HANDOFF.md` 的路由与存储约定接入，尽量不要改共享花园状态机。
