# Validation scope

## Automated checks

- `npm test`: domain rules, duplicate acceptance, consent, pause behavior, local storage restoration, malformed-data protection, API input/origin/byte limits, structured response validation, and provider failure handling.
- `npm run build`: production compilation, type checking, and route generation.
- Browser QA in Chrome at 320, 390, 768, 1024, and 1440 CSS px: image loading, layout overflow, typed conversation, gradual growth, family consent/refusal/revocation, pause/resume/reload, completion, source labels, saved-flower collection, and reduced motion.
- Simulated browser speech: recognition is reviewed before growth; an explicit stop interrupts recognition; an aborted recognition callback cannot reopen the review dialog.
- Simulated cloud response: pausing cancels the pending request; a late response cannot modify the paused conversation or resume speech.

## Not verified by these checks

- Real microphone capture, browser speech-provider availability or Chinese recognition quality.
- A real model response with the owner's API credentials, multilingual model quality, or exhaustive protection against fabricated memories.
- Clinical benefit, suitability for an individual patient, or comprehensive accessibility conformance.
- Public-host authentication, family sharing, durable rate limits, or multi-device data recovery. These are not implemented in the local prototype.

All example memories are fictional. Automated provider and voice checks use test doubles, not real patient data or a paid model call.
