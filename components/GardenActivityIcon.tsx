export default function GardenActivityIcon({ kind }: { kind: 'picture' | 'sounds' | 'notes' }) {
  return <svg className="garden-activity-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="46" height="46" rx="16" fill="var(--garden-sage)" stroke="none" />
    {kind === 'picture' && <>
      <rect x="9" y="9" width="25" height="29" rx="3" transform="rotate(-8 9 9)" fill="var(--garden-paper)" />
      <rect x="15" y="12" width="25" height="29" rx="3" fill="var(--garden-paper)" />
      <path d="M19 30l6-7 5 5 3-3 3 5M19 33h17M24 37h7" />
      <circle cx="33" cy="19" r="2.4" />
    </>}
    {kind === 'sounds' && <>
      <path d="M12 20h5l7-6v20l-7-6h-5z" fill="var(--garden-paper)" />
      <path d="M29 19c3 3 3 7 0 10M33 14c6 5 6 15 0 20" />
      <path d="M14 36c2 2 5 2 7 0" opacity=".65" />
    </>}
    {kind === 'notes' && <>
      <path d="M13 9h17l7 7v23H13z" fill="var(--garden-paper)" />
      <path d="M30 9v8h7M18 21h12M18 26h9M18 31h6" />
      <path d="M29 34c0-5 4-7 9-7-1 5-4 8-9 7z" fill="var(--garden-sage)" />
      <path d="M28 37l7-7" />
    </>}
  </svg>;
}
