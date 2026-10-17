'use client';

import { Gift, Heart, House, Music2, Sun, Trees, Users, Utensils } from 'lucide-react';

const cues = {
  places: { label: 'Places', Icon: House }, people: { label: 'People', Icon: Users }, home: { label: 'Home', Icon: Heart },
  food: { label: 'Food', Icon: Utensils }, music: { label: 'Music', Icon: Music2 }, outdoors: { label: 'Outside', Icon: Trees },
  objects: { label: 'Objects', Icon: Gift }, seasons: { label: 'Seasons', Icon: Sun }, pastimes: { label: 'Pastimes', Icon: Heart },
};

export default function GardenTopicCue({ id, index, selected, disabled, previewing, onPreview, onLeave, onChoose }: {
  id: string; index: number; selected: boolean; disabled: boolean; previewing: boolean;
  onPreview: () => void; onLeave: () => void; onChoose: () => void;
}) {
  const { label, Icon } = cues[id as keyof typeof cues] || cues.places;
  return <button className={'topic-bubble topic-' + index + (selected ? ' topic-selected' : '')} style={{ animationDelay: `${index * 400}ms` }} aria-label={label} data-preview={previewing || undefined} disabled={disabled}
    onPointerMove={event => { if (!disabled && !previewing && event.pointerType === 'mouse') onPreview(); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') onLeave(); }}
    onTouchStart={() => { if (!disabled) onPreview(); }} onFocus={event => { if (!disabled && event.currentTarget.matches(':focus-visible')) onPreview(); }} onBlur={onLeave} onClick={onChoose}>
    <span className="topic-cue-icon"><Icon size={76} strokeWidth={1.2} aria-hidden="true" /></span>
    <span className="topic-title">{label}</span>
  </button>;
}
