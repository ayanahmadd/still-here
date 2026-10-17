'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function GardenDialog({ title, onClose, onPause, children, wide = false, className = '' }: { title: string; onClose: () => void; onPause?: () => void; children: React.ReactNode; wide?: boolean; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} className={'garden-dialog' + (wide ? ' dialog-wide' : '') + (className ? ' ' + className : '')} aria-labelledby="garden-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="dialog-paper"><header className="dialog-heading"><h2 id="garden-dialog-title">{title}</h2>{onPause && <button className="dialog-rest" onClick={onPause}>Take a rest</button>}<button className="garden-icon-button" onClick={onClose} aria-label="Close"><X size={23} /></button></header>{children}</article>
  </dialog>;
}
