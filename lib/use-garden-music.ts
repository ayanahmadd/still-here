'use client';

import { useEffect, useRef } from 'react';

/** One finite piece per visit. Pausing or unmuting never restarts a finished piece. */
export function useGardenMusic(enabled: boolean, paused: boolean, volume: number) {
  const player = useRef<HTMLAudioElement | null>(null);
  const completed = useRef(false);
  const playback = useRef({ enabled, paused, volume });
  playback.current = { enabled, paused, volume };

  useEffect(() => {
    const audio = new Audio('/audio/garden-morning.wav');
    audio.loop = false;
    audio.preload = 'auto';
    player.current = audio;
    completed.current = false;
    const ended = () => { completed.current = true; };
    const play = () => {
      const state = playback.current;
      if (!state.enabled || state.paused || state.volume <= 0 || completed.current || !audio.paused) return;
      audio.muted = false;
      audio.volume = state.volume;
      // Some browsers require the first intentional click/key before allowing sound.
      void audio.play().catch(() => {});
    };
    const visibility = () => { if (document.hidden) audio.pause(); else play(); };
    audio.addEventListener('ended', ended);
    document.addEventListener('pointerdown', play);
    document.addEventListener('keydown', play);
    document.addEventListener('visibilitychange', visibility);
    play();
    return () => {
      document.removeEventListener('pointerdown', play);
      document.removeEventListener('keydown', play);
      document.removeEventListener('visibilitychange', visibility);
      audio.removeEventListener('ended', ended);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      player.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = player.current;
    if (!audio) return;
    audio.muted = !enabled;
    audio.volume = volume;
    if (!enabled || paused || volume <= 0 || document.hidden || completed.current) audio.pause();
    else if (audio.paused) void audio.play().catch(() => {});
  }, [enabled, paused, volume]);

  // Synchronous silence for the mute gesture, without waiting for a React effect.
  return () => { if (player.current) { player.current.muted = true; player.current.pause(); } };
}
