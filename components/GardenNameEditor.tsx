'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { cleanGardenName, DEFAULT_GARDEN_NAME } from '../lib/garden-name';
import { isStopSignal } from '../lib/garden';

type NameSpeech = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: { length: number; [index: number]: { 0: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };

export default function GardenNameEditor({ name, onSave }: { name: string; onSave: (name: string) => boolean }) {
  const [draft, setDraft] = useState(name === DEFAULT_GARDEN_NAME ? '' : name);
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState('');
  const speech = useRef<NameSpeech | null>(null);
  const epoch = useRef(0);
  useEffect(() => { setDraft(name === DEFAULT_GARDEN_NAME ? '' : name); }, [name]);
  useEffect(() => () => { epoch.current++; speech.current?.abort(); }, []);
  function start() {
    const browser = window as Window & { SpeechRecognition?: new () => NameSpeech; webkitSpeechRecognition?: new () => NameSpeech };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice('You can type a name below. Voice input is unavailable here.'); return; }
    const token = ++epoch.current;
    const input = new Constructor(); speech.current = input;
    input.lang = 'en-US'; input.continuous = false; input.interimResults = true;
    input.onresult = event => { if (token !== epoch.current) return; let text = ''; for (let index = 0; index < event.results.length; index++) text += event.results[index][0].transcript; if (isStopSignal(text)) { epoch.current++; input.abort(); setRecording(false); setNotice('We can leave this for another day.'); return; } setDraft(cleanGardenName(text.replace(/^(?:my name is|i am|i'm|this is)\s+/i, '').replace(/[.!?]+$/, ''))); };
    input.onerror = () => { if (token === epoch.current) { setRecording(false); setNotice('You can type the name, or try again later.'); } };
    input.onend = () => { if (token === epoch.current) { setRecording(false); speech.current = null; } };
    try { input.start(); setRecording(true); setNotice('Listening. You can check the name before saving.'); } catch { setRecording(false); setNotice('You can type the name below.'); }
  }
  return <form className="garden-name-editor" onSubmit={event => { event.preventDefault(); epoch.current++; speech.current?.abort(); setRecording(false); if (onSave(draft)) setNotice('Your garden name is saved.'); else setNotice('The name could not be saved on this device.'); }}>
    <label className="garden-field-label" htmlFor="garden-owner-name">Garden name</label>
    <input id="garden-owner-name" autoComplete="off" maxLength={40} value={draft} onChange={event => setDraft(event.target.value)} placeholder="My Garden" />
    <div className="dialog-actions"><button type="submit" className="garden-primary">Save name</button><button type="button" className="garden-secondary name-voice-button" aria-label={recording ? 'Finish saying the name' : 'Say a name'} onClick={() => { if (recording) speech.current?.stop(); else setPermission(true); }}>{recording ? <Square size={24} /> : <Mic size={24} />}<span>{recording ? 'Finish' : 'Say a name'}</span></button></div>
    {permission && !recording && <div className="name-voice-permission"><p>Your browser may process speech online. This app does not save the recording. You can check the name before saving.</p><button className="garden-secondary" type="button" onClick={() => { setPermission(false); start(); }}>Allow voice input</button></div>}
    {notice && <p className="dialog-note" role="status">{notice}</p>}
  </form>;
}
