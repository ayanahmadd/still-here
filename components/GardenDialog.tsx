'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function GardenDialog({ title, onClose, onPause, children, wide = false }: { title: string; onClose: () => void; onPause?: () => void; children: React.ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} className={'garden-dialog' + (wide ? ' dialog-wide' : '')} aria-labelledby="garden-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="dialog-paper"><header className="dialog-heading"><h2 id="garden-dialog-title">{title}</h2>{onPause && <button className="dialog-rest" onClick={onPause}>休息一下</button>}<button className="garden-icon-button" onClick={onClose} aria-label="关闭"><X size={23} /></button></header>{children}</article>
  </dialog>;
}
