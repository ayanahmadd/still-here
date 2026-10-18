'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import FamiliarSounds from '../../src/games/FamiliarSounds';
import LittleNotes from '../../src/games/LittleNotes';
import PictureTogether from '../../src/games/PictureTogether';
import { readGarden } from '../../lib/garden';
import { gardenActivities } from '../../lib/garden-activities';

type ActivityId = typeof gardenActivities[number]['id'];

export default function GardenGameClient({ activity }: { activity: ActivityId }) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const [gardenId, setGardenId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [notice, setNotice] = useState('');
  const saved = useRef(false);

  function stopSound() {
    root.current?.querySelectorAll('audio').forEach(audio => audio.pause());
    window.speechSynthesis?.cancel();
  }

  useEffect(() => {
    try { const value = localStorage.getItem('memory-garden-audio') === 'muted'; mutedRef.current = value; setMuted(value); } catch {}
    try { setGardenId(readGarden().garden_id || null); }
    catch { setNotice('Your saved garden could not be opened. You can explore without saving.'); }
    const element = root.current;
    const onPlay = (event: Event) => {
      if (!(event.target instanceof HTMLMediaElement)) return;
      const current = event.target;
      current.loop = false; current.muted = mutedRef.current;
      if (mutedRef.current) current.pause();
      element?.querySelectorAll('audio').forEach(audio => { if (audio !== current) audio.pause(); });
    };
    const onVisibility = () => { if (document.hidden) stopSound(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'memory-garden-audio') return;
      const value = event.newValue === 'muted'; mutedRef.current = value; setMuted(value);
      element?.querySelectorAll('audio').forEach(audio => { audio.muted = value; if (value) audio.pause(); });
    };
    element?.addEventListener('play', onPlay, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    return () => {
      element?.removeEventListener('play', onPlay, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      element?.querySelectorAll('audio').forEach(audio => audio.pause());
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleSound() {
    const value = !mutedRef.current; mutedRef.current = value; setMuted(value);
    root.current?.querySelectorAll('audio').forEach(audio => { audio.muted = value; if (value) audio.pause(); });
    if (value) stopSound();
    try { if (value) localStorage.setItem('memory-garden-audio', 'muted'); else localStorage.removeItem('memory-garden-audio'); } catch {}
  }

  function complete(result: { type?: string; title?: string; reflection?: string; sound?: string }) {
    if (activity === 'familiar-sounds') {
      if (saved.current) return true;
      if (!gardenId) { setNotice('This moment could not be saved. Your garden is unchanged.'); return false; }
      try {
        const key = 'memory-garden-game-familiar-sounds-' + gardenId;
        const previous = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(previous)) throw new Error('Invalid saved moments');
        localStorage.setItem(key, JSON.stringify([{ id: crypto.randomUUID(), createdAt: Date.now(), title: result.title, reflection: (result.reflection || '').slice(0, 1200), sound: result.sound }, ...previous]));
        saved.current = true;
      } catch { setNotice('This moment could not be saved. You can try again.'); return false; }
    }
    setNotice(activity === 'little-notes' ? 'Your voice note is saved on this device.' : 'Your listening moment is saved on this device.');
    return true;
  }

  return <main ref={root} className="garden-activity-page garden-game-shell">
    <header><Link href="/?garden=1" onClick={stopSound} className="garden-text-button"><ArrowLeft size={19} />Return to the garden</Link><span>Memory Garden</span><button className="garden-game-mute" aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={muted} onClick={toggleSound}>{muted ? <VolumeX size={25} /> : <Volume2 size={25} />}</button></header>
    {muted && <p className="garden-game-notice">Sound is muted.</p>}
    {notice && <p className="garden-game-notice" role="status">{notice}</p>}
    <div className="garden-game-content">
      {activity === 'familiar-sounds' ? <FamiliarSounds embedded soundMuted={muted} onBack={() => router.push('/?garden=1')} onComplete={complete} /> : activity === 'little-notes' ? <LittleNotes embedded gardenId={gardenId} soundMuted={muted} onBack={() => router.push('/?garden=1')} onComplete={complete} /> : <PictureTogether />}
    </div>
  </main>;
}
