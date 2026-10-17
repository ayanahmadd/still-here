'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import GardenFlower from './GardenFlower';
import { GardenMemory, GROWTH_STAGES } from '../lib/garden';

export default function GardenCanvas({ flowers, onOpen }: { flowers: GardenMemory[]; onOpen: (memory: GardenMemory) => void }) {
  const view = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const drag = useRef<{ x: number; y: number; offset: number; active: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const ordered = [...flowers].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
  const worldWidth = Math.max(width, 1800 + Math.floor(ordered.length / 6) * 720);
  const maxOffset = Math.max(0, worldWidth - width);
  function pan(next: number) { const value = Math.max(0, Math.min(maxOffset, next)); offsetRef.current = value; setOffset(value); }
  useEffect(() => {
    const node = view.current; if (!node) return;
    const observer = new ResizeObserver(([entry]) => { const next = entry.contentRect.width; setWidth(next); const centered = Math.max(0, 900 - next / 2); offsetRef.current = centered; setOffset(centered); });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  return <div ref={view} className={'garden-canvas' + (dragging ? ' is-panning' : '')} tabIndex={0} role="group" aria-label="Your garden. Drag or swipe left and right to explore your flowers. You can also use the arrow keys."
    onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); pan(offsetRef.current + (event.key === 'ArrowRight' ? 180 : -180)); } if (event.key === 'Home') { event.preventDefault(); pan(900 - width / 2); } }}
    onPointerDown={event => { if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current, active: false }; }}
    onPointerMove={event => { const start = drag.current; if (!start) return; const dx = event.clientX - start.x, dy = event.clientY - start.y; if (!start.active && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) { start.active = true; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); } if (start.active) { event.preventDefault(); pan(start.offset - dx); } }}
    onPointerUp={() => { drag.current = null; setDragging(false); }} onPointerCancel={() => { drag.current = null; setDragging(false); }} onLostPointerCapture={() => { drag.current = null; setDragging(false); }}>
    <div className="garden-world" style={{ width: worldWidth, transform: `translateX(${-offset}px)` }}>
      <Image className="garden-world-landscape" src="/garden/empty-garden-background.png" alt="" fill priority sizes="2200px" quality={85} draggable={false} />
      <div className="garden-world-wash" />
      {ordered.map((memory, index) => {
        const spread = Math.min(340, width * .32);
        const positions = [-spread, spread, -470, 470, -80, 570];
        const x = 900 + Math.floor(index / 6) * 720 + positions[index % 6];
        return <button key={memory.id} className="garden-memory-plant" style={{ left: x, bottom: `${14 + (index % 3) * 7}%` }} aria-label={`${memory.title}. ${GROWTH_STAGES[memory.stage]}. Open this story.`} onClick={() => onOpen(memory)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) pan(x - width / 2); }}>
          <GardenFlower kind={memory.kind} stage={memory.stage} familyBud={memory.familyBud} sensoryDetails={memory.sensoryDetails} />
          <span className="garden-memory-title">{memory.title}</span>
        </button>;
      })}
    </div>
  </div>;
}
