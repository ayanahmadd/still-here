'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Leaf, Square } from 'lucide-react';

export default function GardenCompanionBubble({ message, messageKey, thinking, blocked, speaking, reduceMotion, onSpeak, onStop }: {
  message: string; messageKey: string; thinking: boolean; blocked: boolean; speaking: boolean; reduceMotion: boolean;
  onSpeak: (message: string) => void; onStop: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const revealedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageId = useId();

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null; revealedRef.current = false; setRevealed(false); setTyped('');
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [message, messageKey, blocked]);

  function reveal(activate = false) {
    if (blocked || thinking) return;
    if (revealedRef.current) { if (activate) onSpeak(message); return; }
    revealedRef.current = true; setRevealed(true);
    // Call synchronously from the gesture: do not defer speech to the typing timer.
    onSpeak(message);
    if (reduceMotion) { setTyped(message); return; }
    const letters = Array.from(message); let index = 0;
    timer.current = setInterval(() => {
      index++; setTyped(letters.slice(0, index).join(''));
      if (index >= letters.length && timer.current) { clearInterval(timer.current); timer.current = null; }
    }, 38);
  }

  return <div className={'companion-bubble quiet-companion' + (revealed ? ' is-revealed' : '')} aria-busy={thinking}>
    {(revealed || speaking) && <div className="bubble-topline"><span><Leaf size={18} aria-hidden="true" />Your companion</span>{speaking && <button className="bubble-listen" aria-label="Stop voice" onClick={onStop}><Square size={22} aria-hidden="true" /><span>Stop</span></button>}</div>}
    <button className="bubble-reveal" aria-label={revealed ? 'Garden companion message' : 'Listen to your garden companion'} aria-expanded={revealed} aria-controls={messageId} disabled={blocked || thinking}
      onPointerMove={event => { if (event.pointerType === 'mouse') reveal(); }} onTouchStart={() => reveal()}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) reveal(); }} onClick={() => reveal(true)}>
      {revealed ? <span className="bubble-message" aria-hidden="true">{typed || '\u00a0'}</span> : <span className="quiet-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>}
    </button>
    {/* One complete accessible copy; never announce the typewriter character by character. */}
    <p id={messageId} className="sr-only">{revealed ? message : ''}</p>
  </div>;
}
