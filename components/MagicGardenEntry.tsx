'use client';

import { useState } from 'react';

export default function MagicGardenEntry({ disabled, entering, label, onEnter }: { disabled: boolean; entering: boolean; label: string; onEnter: () => void }) {
  const [touched, setTouched] = useState(false);
  return <div className="entrance-content">
    <div className="entrance-identity"><p className="entrance-owner-name">{label}</p><h1>Memory Garden</h1></div>
    <button className="enter-garden magic-entry" aria-label="Enter the garden" aria-busy={entering} disabled={disabled} data-touched={touched || undefined} onTouchStart={() => setTouched(true)} onBlur={() => setTouched(false)} onClick={onEnter}>
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
        <path d="M25 74C12 41 42 18 78 19C82 57 62 86 25 74Z" fill="#91ad88" fillOpacity=".55" stroke="#587851" strokeWidth="1.7" />
        <path d="M21 81C34 61 52 43 70 28M36 61L31 43M48 48L61 50M56 40L54 29" stroke="#587851" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <span className="magic-entry-label" aria-hidden="true">Enter</span>
    </button>
  </div>;
}
