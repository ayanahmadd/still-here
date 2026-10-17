'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flower2, Heart, Leaf, LoaderCircle, Mic, Pause, PenLine, Play, Settings2, ShieldCheck, Sprout, Square, Users, Volume2, VolumeX, X } from 'lucide-react';
import GardenFlower from './GardenFlower';
import GardenDialog from './GardenDialog';
import GardenActivities from './GardenActivities';
import MagicGardenEntry from './MagicGardenEntry';
import GardenTopicCue from './GardenTopicCue';
import GardenCompanionBubble from './GardenCompanionBubble';
import GardenCanvas from './GardenCanvas';
import GardenNameEditor from './GardenNameEditor';
import { DEFAULT_GARDEN_NAME, NAME_PROMPT_KEY, gardenLabel, readGardenName, writeGardenName } from '../lib/garden-name';
import { GardenContact, normalisePhone, readContact, writeContact } from '../lib/garden-contact';
import { COMFORT, REASSURANCE, GARDEN_KEY, GardenEntry, GardenMemory, GardenStore, MAX_EXPRESSION, OPENING, addFamily, addPatient, finishMemory, flowerNames, isStopSignal, localReply, newMemory, readGarden, resetGarden, topics, writeGarden } from '../lib/garden';

type VoiceResult = { results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } };
type SpeechInput = { continuous: boolean; interimResults: boolean; lang: string; onresult: ((event: VoiceResult) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type VoiceWindow = Window & { SpeechRecognition?: new () => SpeechInput; webkitSpeechRecognition?: new () => SpeechInput };
type Modal = 'welcome' | 'text' | 'review' | 'finish' | 'pause' | 'collection' | 'story' | 'settings' | 'mic' | 'family-consent' | 'family-note' | 'contact' | 'name' | null;

export default function GardenApp() {
  const [screen, setScreen] = useState<'entrance' | 'topics' | 'garden'>('entrance');
  const [entering, setEntering] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [topicSet, setTopicSet] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [previewTopic, setPreviewTopic] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState(DEFAULT_GARDEN_NAME);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0.9);
  const [voiceRate, setVoiceRate] = useState(0.8);
  const [speechNotice, setSpeechNotice] = useState('');
  const [userInteraction, setUserInteraction] = useState(0);
  const speechSequence = useRef(0);
  const speechActive = useRef(false);
  const [contact, setContact] = useState<GardenContact | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState('');
  const contactReturn = useRef(false);
  const transitions = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [garden, setGarden] = useState<GardenStore>({ version: 1, flowers: [], current: null });
  const gardenRef = useRef(garden);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [bubble, setBubble] = useState(OPENING);
  const [draft, setDraft] = useState('');
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [hint, setHint] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [familyText, setFamilyText] = useState('');
  const [familyGranted, setFamilyGranted] = useState(false);
  const [viewing, setViewing] = useState<GardenMemory | null>(null);
  const [featured, setFeatured] = useState<GardenMemory | null>(null);
  const [justBloomed, setJustBloomed] = useState(false);
  const [title, setTitle] = useState('');
  const [notification, setNotification] = useState('');
  const [storageError, setStorageError] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);
  const [cloudAllowed, setCloudAllowed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [micAccepted, setMicAccepted] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [hasCorruptData, setHasCorruptData] = useState(false);
  const [timeToRest, setTimeToRest] = useState(false);
  const started = useRef(0);
  const pendingIntent = useRef<'voice' | 'text'>('voice');
  const recognition = useRef<SpeechInput | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const request = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const voiceEpoch = useRef(0);
  const inFlight = useRef(false);
  const paused = useRef(false);
  const waitingNotice = useRef(false);

  useEffect(() => {
    const name = readGardenName(window.location.search); setOwnerName(name);
    const invitation = new URLSearchParams(window.location.search);
    if (invitation.has('name')) { invitation.delete('name'); window.history.replaceState(null, '', window.location.pathname + (invitation.size ? '?' + invitation.toString() : '')); }
    try {
      const saved = readGarden();
      gardenRef.current = saved; setGarden(saved);
      setShowNamePrompt(name === DEFAULT_GARDEN_NAME && !saved.flowers.length && !saved.current && localStorage.getItem(NAME_PROMPT_KEY) !== 'true');
      if (new URLSearchParams(window.location.search).get('garden') === '1') {
        setScreen(saved.current ? 'garden' : 'topics');
        window.history.replaceState(null, '', '/');
      }
      if (saved.current) { paused.current = true; setBubble('Your story is still here. We can continue whenever you feel ready.'); }
    } catch {
      setHasCorruptData(true);
      setStorageError('Your saved garden could not be opened. The original data is untouched. You can export it in Settings.');
      const fallback: GardenStore = { version: 1, flowers: [], current: null };
      gardenRef.current = fallback; setGarden(fallback);
    }
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setContact(readContact());
    setSpeechAvailable('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
    setLoaded(true);
    const controller = new AbortController();
    fetch('/api/garden', { signal: controller.signal, cache: 'no-store' }).then(response => response.json()).then(data => setAiAvailable(data.available === true)).catch(() => {});
    return () => { speechSequence.current++; speechActive.current = false; transitions.current.forEach(clearTimeout); controller.abort(); request.current?.abort(); voiceEpoch.current++; recognition.current?.abort(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => { if (screen !== 'entrance' && showNamePrompt) { try { localStorage.setItem(NAME_PROMPT_KEY, 'true'); } catch {} } }, [screen, showNamePrompt]);

  useEffect(() => {
    if (screen !== 'garden' || !garden.current || garden.current.status !== 'growing' || thinking || speaking || (modal && modal !== 'text') || waitingNotice.current) return;
    const timer = setTimeout(() => { waitingNotice.current = true; pauseConversation(); }, 30000);
    return () => clearTimeout(timer);
  }, [garden.current, thinking, speaking, recording, modal, screen, draft, transcript, userInteraction]);

  function enterGarden() {
    if (entering || arriving || !loaded) return;
    stopAudio(); setSpeechNotice('');
    setEntering(true);
    transitions.current.push(setTimeout(() => {
      setScreen('topics'); setEntering(false);
      if (!reduceMotion) {
        setArriving(true);
        transitions.current.push(setTimeout(() => setArriving(false), 550));
      }
    }, reduceMotion ? 0 : 750));
  }

  function commit(next: GardenStore) {
    gardenRef.current = next; setGarden(next);
    if (hasCorruptData) return;
    if (!writeGarden(next)) setStorageError('Your words are here, but could not be saved. Keep this page open and export a copy in Settings.');
    else setStorageError('');
  }

  function stopAudio() {
    speechSequence.current++; speechActive.current = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utterance.current = null;
    setSpeaking(false);
  }

  function readAloud(text: string) {
    if (speechActive.current && utterance.current?.text === text) return;
    stopAudio();
    if (!speechAvailable) { setSpeechNotice('Voice is unavailable here. You can read the words instead.'); return; }
    const token = speechSequence.current;
    setSpeechNotice('');
    try {
      const voice = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const english = voices.find(item => item.localService && /^en\b/i.test(item.lang)) || voices.find(item => /^en\b/i.test(item.lang));
      if (english) voice.voice = english;
      voice.lang = 'en-US'; voice.rate = voiceRate; voice.pitch = 1; voice.volume = voiceVolume;
      voice.onend = () => { if (token === speechSequence.current) { speechActive.current = false; setSpeaking(false); } };
      voice.onerror = event => {
        if (token !== speechSequence.current) return;
        speechActive.current = false; setSpeaking(false);
        if (event.error !== 'canceled' && event.error !== 'interrupted') setSpeechNotice(event.error === 'not-allowed' ? 'Tap to hear the words.' : 'Voice is unavailable right now. You can read the words instead.');
      };
      utterance.current = voice; speechActive.current = true; setSpeaking(true);
      // Keep this call synchronous with hover, touchstart, focus, or click.
      window.speechSynthesis.speak(voice);
    } catch { speechActive.current = false; setSpeaking(false); setSpeechNotice('Voice is unavailable right now. You can read the words instead.'); }
  }

  function stopWork(keepAudio = false) {
    epoch.current++; voiceEpoch.current++;
    request.current?.abort(); request.current = null;
    recognition.current?.abort(); recognition.current = null;
    inFlight.current = false; setThinking(false); setRecording(false); if (!keepAudio) stopAudio();
    setPreviewTopic(null);
    setFamilyGranted(false); setFamilyOpen(false); setRequestError(false);
  }

  function pauseConversation() {
    stopWork(); paused.current = true;
    const state = gardenRef.current;
    if (state.current) commit({ ...state, current: { ...state.current, status: 'paused' } });
    setBubble(REASSURANCE); setModal('pause'); setNotification('Your words and your flower are safe here.');
  }

  function resume() {
    paused.current = false; waitingNotice.current = false;
    const state = gardenRef.current;
    if (state.current) {
      commit({ ...state, current: { ...state.current, status: 'growing' } });
      const last = [...state.current.entries].reverse().find(entry => entry.speaker === 'companion');
      setBubble(last && !/[\u3400-\u9fff]/.test(last.text) ? last.text : state.current.entries.some(entry => entry.speaker === 'patient') ? localReply({ ...state.current, entries: state.current.entries.filter(entry => entry.speaker !== 'companion') }) : state.current.opening || OPENING);
    } else setBubble(OPENING);
    setModal(null); setNotification('Take your time. The microphone is off.');
  }

  function ensureSession(): GardenMemory {
    const state = gardenRef.current;
    if (state.current) return state.current;
    const current = newMemory();
    commit({ ...state, current }); setFeatured(null); setJustBloomed(false); started.current = Date.now();
    return current;
  }

  function begin(intent: 'voice' | 'text') {
    if (!loaded || inFlight.current || recording) return;
    pendingIntent.current = intent;
    if (paused.current || gardenRef.current.current?.status === 'paused') { setModal('pause'); return; }
    if (!gardenRef.current.current) { setScreen('topics'); setFeatured(null); return; }
    if (intent === 'text') { stopAudio(); setModal('text'); }
    else requestMic();
  }

  function acceptWelcome() {
    ensureSession(); paused.current = false; setBubble(OPENING); setNotification('');
    if (pendingIntent.current === 'text') setModal('text');
    else requestMic();
  }

  function chooseTopic(question: string, id: string) {
    if (selectedTopic) return;
    setSelectedTopic(id);
    setShowNamePrompt(false);
    stopWork(true); setNotification(''); setDraft('');
    if (autoRead) readAloud(question);
    transitions.current.push(setTimeout(() => {
    const state = gardenRef.current;
    setScreen('garden'); setFeatured(null); setJustBloomed(false);
    const previous = state.current?.entries.some(entry => entry.speaker === 'patient') ? finishMemory(state.current) : null;
    paused.current = false; waitingNotice.current = false;
    commit({ ...state, flowers: previous ? [previous, ...state.flowers.filter(flower => flower.id !== previous.id)] : state.flowers, current: newMemory(question) });
    setBubble(`${REASSURANCE} ${question}`); started.current = Date.now();
    setSelectedTopic(null);
    }, reduceMotion ? 0 : 650));
  }

  function requestMic() {
    stopAudio();
    const browser = window as VoiceWindow;
    if (!browser.SpeechRecognition && !browser.webkitSpeechRecognition) { setNotification('Voice input is unavailable in this browser. You can write instead.'); setModal('text'); return; }
    if (!micAccepted) { setModal('mic'); return; }
    startMic();
  }

  function startMic() {
    const Constructor = (window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition;
    if (!Constructor) { setModal('text'); return; }
    stopAudio(); setModal(null); ensureSession();
    const token = ++voiceEpoch.current;
    const speech = new Constructor(); recognition.current = speech;
    speech.lang = 'en-US'; speech.continuous = true; speech.interimResults = true;
    transcriptRef.current = ''; setTranscript(''); setNotification(''); setRecording(true);
    speech.onresult = event => {
      if (token !== voiceEpoch.current || paused.current) return;
      let text = '';
      for (let index = 0; index < event.results.length; index++) text += event.results[index][0].transcript;
      transcriptRef.current = text.slice(0, MAX_EXPRESSION); setTranscript(transcriptRef.current);
      if (isStopSignal(text)) pauseConversation();
    };
    speech.onerror = event => {
      if (token !== voiceEpoch.current) return;
      voiceEpoch.current++; setRecording(false); recognition.current = null;
      setNotification(event.error === 'not-allowed' ? 'The microphone is off. You can write or take a rest.' : 'That was not clear. You can write or try again later.');
      setDraft(transcriptRef.current); setModal('text');
    };
    speech.onend = () => {
      if (token !== voiceEpoch.current || paused.current) return;
      setRecording(false); recognition.current = null;
      if (transcriptRef.current.trim()) setModal('review');
      else setNotification('That is okay. Tap again whenever you feel ready.');
    };
    try { speech.start(); } catch { voiceEpoch.current++; setRecording(false); recognition.current = null; setNotification('Voice input could not start. You can write instead.'); setModal('text'); }
  }

  function cancelRecording() {
    voiceEpoch.current++; recognition.current?.abort(); recognition.current = null;
    setRecording(false); transcriptRef.current = ''; setTranscript(''); setNotification('This recording was discarded. Your garden is still here.');
  }

  async function replyTo(memory: GardenMemory) {
    const token = ++epoch.current;
    setThinking(true); inFlight.current = true; setRequestError(false);
    let message = localReply(memory);
    let action = 'continue';
    try {
      if (cloudAllowed) {
        const controller = new AbortController(); request.current = controller;
        const timer = setTimeout(() => controller.abort(), 35000);
        try {
          let total = 0;
          const recent: GardenEntry[] = [];
          for (const entry of memory.entries.slice(-20).reverse()) {
            if (total + entry.text.length > 16000) break;
            total += entry.text.length; recent.unshift(entry);
          }
          const response = await fetch('/api/garden', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ entries: recent, cloudConsent: true }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'We could not connect.');
          message = result.message; action = result.action;
        } finally { clearTimeout(timer); }
      }
      if (token !== epoch.current || paused.current) return;
      if (action === 'pause') { pauseConversation(); return; }
      const state = gardenRef.current;
      if (!state.current || state.current.id !== memory.id) return;
      const entry: GardenEntry = { id: crypto.randomUUID(), speaker: 'companion', text: message, createdAt: new Date().toISOString(), mode: cloudAllowed ? 'ai' : 'local' };
      commit({ ...state, current: { ...state.current, entries: [...state.current.entries, entry] } });
      setBubble(message);
      // A new reply stays quiet until the user explores its bubble.
      if (started.current && Date.now() - started.current > 300000) setTimeToRest(true);
    } catch {
      if (token !== epoch.current || paused.current) return;
      setBubble('We could not connect. Your words are safe. We can sit for a while.'); setRequestError(true);
    } finally {
      if (token === epoch.current) { setThinking(false); inFlight.current = false; request.current = null; }
    }
  }

  function submitPatient(text: string) {
    if (!text.trim() || text.trim().length > MAX_EXPRESSION || inFlight.current || paused.current) return;
    if (isStopSignal(text)) { pauseConversation(); return; }
    const previous = ensureSession();
    const memory = addPatient(previous, text);
    if (previous.stage < 7 && memory.stage === 7) setJustBloomed(true);
    commit({ ...gardenRef.current, current: memory });
    setDraft(''); setTranscript(''); transcriptRef.current = ''; setModal(null); setNotification(''); waitingNotice.current = false;
    void replyTo(memory);
  }

  function openFinish() {
    if (!garden.current?.entries.some(entry => entry.speaker === 'patient') || thinking || recording) return;
    stopAudio(); setTitle(garden.current.title); setModal('finish');
  }

  function finish() {
    const state = gardenRef.current;
    if (!state.current) return;
    const flower = finishMemory({ ...state.current, title: title.trim().slice(0, 100) || state.current.title });
    if (!flower) return;
    stopWork(); paused.current = false;
    commit({ ...state, flowers: [flower, ...state.flowers.filter(saved => saved.id !== flower.id)], current: null });
    setFeatured(flower); setJustBloomed(false); setModal(null); setTimeToRest(false);
    setBubble('Thank you for sharing. This little moment now has a place in your garden.');
    setNotification(flower.stage === 7 ? 'Your flower is here, with the words you shared.' : 'Saved just as it is. You can return and continue whenever you like.');
  }

  function saveFamily(event: React.FormEvent) {
    event.preventDefault();
    const state = gardenRef.current;
    if (!state.current || !familyGranted || paused.current || inFlight.current) return;
    const memory = addFamily(state.current, familyText, familyName, true);
    if (memory === state.current) return;
    commit({ ...state, current: memory }); setFamilyText(''); setFamilyGranted(false); setModal(null); setFamilyOpen(false);
    void replyTo(memory);
  }

  function closeModal() {
    stopAudio();
    if (modal === 'family-note' || modal === 'family-consent') setFamilyGranted(false);
    if (modal === 'contact' && contactReturn.current) { setModal('pause'); return; }
    setModal(null);
  }

  function continueStory(memory: GardenMemory) {
    if (memory.stage === 7) return;
    stopWork();
    const state = gardenRef.current;
    const previous = state.current?.id !== memory.id && state.current?.entries.some(entry => entry.speaker === 'patient') ? finishMemory(state.current) : null;
    const flowers = previous ? [previous, ...state.flowers.filter(flower => flower.id !== previous.id)] : state.flowers;
    commit({ ...state, flowers: flowers.filter(flower => flower.id !== memory.id), current: { ...memory, status: 'paused' } });
    setFeatured(null); setScreen('garden'); paused.current = true; setModal('pause');
  }

  function openContact(returnToPause = false) {
    contactReturn.current = returnToPause;
    setContactName(contact?.name || ''); setContactPhone(contact?.phone || ''); setContactError(''); setModal('contact');
  }

  function saveContact(event: React.FormEvent) {
    event.preventDefault();
    const phone = normalisePhone(contactPhone);
    if (!phone || !contactName.trim()) { setContactError('Please add a name and a phone number with 7–15 digits. Include the country code when needed.'); return; }
    const next = { name: contactName.trim(), phone };
    if (!writeContact(next)) { setContactError('This contact could not be saved on this device. Please try again.'); return; }
    setContact(next); setModal(contactReturn.current ? 'pause' : 'settings');
  }

  function saveOwnerName(value: string) {
    const next = writeGardenName(value);
    if (!next) return false;
    setOwnerName(next); setShowNamePrompt(false); return true;
  }

  function leaveGarden() {
    stopWork(); transitions.current.forEach(clearTimeout);
    const state = gardenRef.current;
    const memory = state.current ? finishMemory(state.current) : null;
    commit({ ...state, current: null, flowers: memory ? [memory, ...state.flowers.filter(flower => flower.id !== memory.id)] : state.flowers });
    setFeatured(null); setEntering(false); setArriving(false); setScreen('entrance'); setModal(null); paused.current = false; setSpeechNotice('');
  }

  function clearDemoGarden() {
    stopWork(); transitions.current.forEach(clearTimeout);
    try {
      const fresh = resetGarden(); gardenRef.current = fresh; setGarden(fresh);
      setOwnerName(DEFAULT_GARDEN_NAME); setShowNamePrompt(true); setContact(null);
      setFeatured(null); setViewing(null); setDraft(''); setTranscript(''); transcriptRef.current = '';
      setHasCorruptData(false); setStorageError(''); setNotification(''); setSpeechNotice('');
      setTopicSet(0); setSelectedTopic(null); setEntering(false); setArriving(false); setModal(null); setScreen('entrance');
      setBubble(REASSURANCE); setVoiceVolume(.9); setVoiceRate(.8); paused.current = false;
      setCloudAllowed(false); setAutoRead(true); setMicAccepted(false);
      window.history.replaceState(null, '', '/');
    } catch { setStorageError('This garden could not be reset. Please keep this page open and try again.'); }
  }

  function showStory(memory: GardenMemory) { stopAudio(); setViewing(memory); setModal('story'); }
  function download(data: string, filename: string) {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  }

  const current = garden.current;
  const activeFlower = current;
  const canFinish = !!current?.entries.some(entry => entry.speaker === 'patient');
  const hints = ['Listen, then leave a little space. Let them finish in their own time.', 'Try one gentle invitation: “What sounds come to mind?” Then give them time.', 'A familiar photo or object can sit nearby. Let them choose whether to talk about it.'];
  const lastCompanion = [...(current?.entries || [])].reverse().find(entry => entry.speaker === 'companion');
  const lastPatient = [...(current?.entries || [])].reverse().find(entry => entry.speaker === 'patient');

  return <div className={'memory-garden-app cognitive-garden' + (reduceMotion ? ' quiet-motion' : '')}>
    {screen !== 'entrance' && <a className="skip-link" href="#garden-main">Skip to garden</a>}
    {screen !== 'entrance' && <header className="garden-header">
      <a className="garden-brand" href="/" aria-label="Memory Garden"><span className="brand-sprout"><Sprout size={29} strokeWidth={1.3} /></span><span className="garden-owner-stamp">{gardenLabel(ownerName)}<small>Memory Garden</small></span></a>
      {screen === 'garden' && <div className="garden-header-actions"><button className={'soft-button companion-toggle' + (familyOpen ? ' selected' : '')} aria-label="Family companion tips" aria-expanded={familyOpen} onClick={() => { stopAudio(); setFamilyOpen(value => !value); }} disabled={recording || thinking}><Users size={19} /><span>For family</span></button><button className="rest-button" onClick={pauseConversation}><Pause size={18} /><span>Take a rest</span></button></div>}
    </header>}

    <button className="garden-settings-trigger" aria-label="Settings" onClick={() => { stopAudio(); setModal('settings'); }}><Settings2 size={25} strokeWidth={1.3} aria-hidden="true" /></button>
    <main id="garden-main">
      <section className={'garden-scene screen-' + screen + (featured && !current ? ' scene-has-bloom' : '') + (entering ? ' scene-entering' : '')} data-growth={activeFlower?.stage ? undefined : 'empty'} aria-label="Memory garden">
        {screen === 'entrance' ? <div className="entrance-landscape-frame" aria-hidden="true"><div className="entrance-landscape-motion">
          <Image className="garden-landscape" src="/garden/empty-garden-background.png" alt="" fill priority sizes="100vw" quality={85} />
          <span className="garden-gate-glow" />
        </div></div> : <GardenCanvas flowers={garden.flowers} onOpen={showStory} />}
        <div className="scene-wash" />
        {screen === 'entrance' && <div className="garden-path-hover" aria-hidden="true" />}
        {screen !== 'entrance' && <div className="garden-air" aria-hidden="true"><span /><span /><span /></div>}
        {screen === 'entrance' && <MagicGardenEntry disabled={!loaded || entering} entering={entering} label={gardenLabel(ownerName)} onEnter={enterGarden} />}
        {screen !== 'entrance' && showNamePrompt && <div className="garden-name-prompt"><button aria-label="Name your garden" onClick={() => { if (autoRead) readAloud('Whose garden is this?'); setModal('name'); }}>Whose garden is this?</button><button aria-label="Name this garden later" onClick={() => setShowNamePrompt(false)}>Later</button></div>}
        {screen === 'topics' && <div className="topic-content">
          <button className="topic-back garden-text-button" disabled={!!selectedTopic} onClick={() => { stopAudio(); setPreviewTopic(null); setScreen('entrance'); }}><ArrowLeft size={17} />Back</button>
          <p className="garden-eyebrow">A LITTLE THOUGHT TO BEGIN</p>
          <h1>A little place to begin.</h1>
          <p className="topic-description">Choose what feels close.</p>
          <div key={topicSet} className={'topic-bubbles' + (selectedTopic ? ' is-choosing' : '')}>{topics.slice(topicSet * 3, topicSet * 3 + 3).map((topic, index) => <GardenTopicCue key={topic.id} id={topic.id} index={index} selected={selectedTopic === topic.id} disabled={!!selectedTopic} previewing={previewTopic === topic.id}
            onPreview={() => { setPreviewTopic(topic.id); if (autoRead) readAloud(topic.question); }}
            onLeave={() => setPreviewTopic(value => value === topic.id ? null : value)}
            onChoose={() => chooseTopic(topic.question, topic.id)} />)}</div>
          {(speaking || speechNotice) && <div className="topic-voice-controls">{speaking && <button className="quiet-stop-voice" aria-label="Stop voice" onClick={stopAudio}><Square size={24} aria-hidden="true" /><span>Stop</span></button>}{speechNotice && <p role="status">{speechNotice}</p>}</div>}
          {current?.entries.some(entry => entry.speaker === 'patient') && <button className="resume-story garden-secondary" onClick={() => { setScreen('garden'); setModal('pause'); }}><Play size={18} />Your story is waiting · Continue</button>}
          <button className="garden-text-button topic-refresh" disabled={!!selectedTopic} onClick={() => { stopAudio(); setPreviewTopic(null); setSpeechNotice(''); setTopicSet(value => (value + 1) % (topics.length / 3)); }}>Explore three other ideas<ArrowRight size={17} /></button>
          <p className="topic-note">Choose only if something feels close to you.</p>
        </div>}
        {screen === 'garden' && <>
        <div className="garden-introduction"><p><span /> A GARDEN OF LITTLE MOMENTS</p><h1>Little by little, a memory blooms.</h1></div>
        <GardenCompanionBubble message={bubble} messageKey={lastCompanion?.id || current?.id || featured?.id || 'opening'} thinking={thinking} blocked={thinking || recording || !!modal} speaking={speaking} reduceMotion={reduceMotion} onSpeak={text => { setUserInteraction(value => value + 1); if (autoRead) readAloud(text); }} onStop={stopAudio} />
        {speechNotice && <p className="quiet-speech-notice" role="status">{speechNotice}</p>}

        {activeFlower && activeFlower.stage > 0 && <div className={'current-flower-place' + (justBloomed ? ' freshly-bloomed' : '')} key={activeFlower?.id || 'empty'}>
          <GardenFlower kind={activeFlower?.kind || 'daisy'} stage={activeFlower?.stage || 0} familyBud={activeFlower?.familyBud} sensoryDetails={activeFlower?.sensoryDetails} />
          <p className="current-flower-label">{current ? current.stage > 0 ? 'Your words are gently growing here' : 'A little moment begins with your words' : featured ? 'A little flower for your story' : 'A quiet place for your story'}</p>
          {featured && !current && <button className="new-flower-story" onClick={() => showStory(featured)}>Visit this flower’s story<ChevronRight size={16} /></button>}
        </div>}


        </>}
        {screen === 'garden' && familyOpen && <aside className="family-panel" aria-labelledby="family-panel-title"><div className="family-panel-top"><span><Users size={18} />Being here together</span><button className="garden-icon-button" aria-label="Close companion tips" onClick={() => setFamilyOpen(false)}><X size={20} /></button></div><h2 id="family-panel-title">Be here. Let the words follow.</h2><div className="family-hint"><Leaf size={20} /><p>{hints[hint]}</p></div><button className="hint-next" onClick={() => setHint(value => (value + 1) % hints.length)}>Another gentle idea<ArrowRight size={15} /></button><p className="family-guidance">One invitation at a time. Let their own words lead.</p><button className="garden-secondary" disabled={!canFinish || paused.current || thinking} onClick={() => { setFamilyGranted(false); setModal('family-consent'); }}>Share a little detail</button>{!canFinish && <small>Let them share first, then ask to add a detail.</small>}</aside>}
      </section>

      {screen === 'garden' && <section className="garden-input-area" aria-label="Share a little moment">
        {recording ? <div className="recording-area"><div className="recording-status"><span className="recording-dot" /><span>Listening. Pauses are welcome.</span></div><p className="live-transcript" aria-live="polite">{transcript || 'Share whatever comes to mind, at your own pace.'}</p><div className="input-actions"><button className="garden-primary" onClick={() => recognition.current?.stop()}><Square size={18} />I am finished</button><button className="garden-text-button" onClick={cancelRecording}>Discard recording</button></div></div>
          : <><div className="input-actions"><button className="garden-primary voice-button" aria-label={current?.status === 'paused' ? 'Continue your story' : 'Start speaking'} onClick={() => current?.status === 'paused' ? setModal('pause') : begin('voice')} disabled={!loaded || thinking}>{current?.status === 'paused' ? <Play size={22} /> : <Mic size={23} strokeWidth={1.6} />}<span>{current?.status === 'paused' ? 'Continue your story' : featured && !current ? 'Share another moment' : 'Tap to speak'}</span></button><button className="write-button" onClick={() => begin('text')} disabled={!loaded || thinking}><PenLine size={20} /><span>Write instead</span></button>{canFinish && <button className="keep-memory-button" onClick={openFinish} disabled={thinking}><Flower2 size={20} />Keep this moment</button>}</div><p className="input-reassurance">{thinking ? 'You can choose “Take a rest” at any time.' : current?.status === 'paused' ? 'Your words will stay here.' : 'The microphone starts only when you choose. Stop whenever you like.'}</p></>}
        {lastPatient && !recording && <p className="last-shared"><span>You shared</span>“{lastPatient.text}”</p>}
        {requestError && <div className="request-recovery"><button className="garden-text-button" onClick={() => current && void replyTo(current)}>Try connecting again</button><button className="garden-text-button" onClick={() => { setCloudAllowed(false); setRequestError(false); if (current) setBubble(localReply(current)); }}>Continue with local replies</button></div>}
        <p className="garden-notification" role="status">{notification || (timeToRest ? 'We have spent a little time together. You can keep this moment whenever you like.' : '\u00a0')}</p>
        {storageError && <p className="garden-storage-error" role="alert">{storageError}</p>}
      </section>}

      {(entering || arriving) && <div className={'entry-transition-light' + (arriving ? ' is-arriving' : '')} aria-hidden="true" />}
    </main>

    {screen !== 'entrance' && <GardenActivities onOpen={() => { transitions.current.forEach(clearTimeout); setSelectedTopic(null); stopWork(); const state = gardenRef.current; if (state.current) { paused.current = true; commit({ ...state, current: { ...state.current, status: 'paused' } }); setBubble(COMFORT); } }} />}

    {modal === 'welcome' && <GardenDialog onPause={pauseConversation} title="There is time for your story." onClose={closeModal}><div className="dialog-symbol"><Sprout size={38} strokeWidth={1.2} /></div><p className="dialog-lead">We can share a little moment from life. As much or as little as you like.</p><ul className="welcome-notes"><li><Pause size={18} />Rest whenever you like. There is nothing to complete.</li><li><ShieldCheck size={18} />Your stories stay on this device.</li><li><Leaf size={18} />{cloudAllowed ? 'You have chosen to share this conversation’s text with OpenAI for replies.' : 'Local demo replies are on. Nothing is sent to AI.'}</li></ul><div className="dialog-actions"><button className="garden-primary" onClick={acceptWelcome}>I would like to share<ArrowRight size={19} /></button><button className="garden-text-button" onClick={closeModal}>Just look around</button></div></GardenDialog>}

    {modal === 'text' && <GardenDialog onPause={pauseConversation} title="Write a little, at your own pace." onClose={closeModal}><p className="dialog-context">{bubble}</p><form onSubmit={event => { event.preventDefault(); submitPatient(draft); }}><label className="sr-only" htmlFor="patient-expression">Your story</label><textarea id="patient-expression" autoFocus rows={5} maxLength={MAX_EXPRESSION} value={draft} onChange={event => { setDraft(event.target.value); if (isStopSignal(event.target.value)) pauseConversation(); }} placeholder="A sentence or a little impression is enough." /><div className="dialog-actions"><button className="garden-primary" type="submit" disabled={!draft.trim()}>Share these words<Check size={19} /></button><button className="garden-text-button" type="button" onClick={pauseConversation}>Rest for now</button></div></form></GardenDialog>}

    {modal === 'mic' && <GardenDialog onPause={pauseConversation} title="Before we listen." onClose={closeModal}><div className="dialog-symbol"><Mic size={34} /></div><p className="dialog-lead">Your browser turns speech into text and may process audio online. This app does not save recordings.</p><p className="dialog-note">You can check and edit the words before sharing. Writing is always an option.</p><div className="dialog-actions"><button className="garden-primary" onClick={() => { setMicAccepted(true); startMic(); }}>Allow and start speaking<Mic size={19} /></button><button className="garden-text-button" onClick={() => setModal('text')}>Write instead</button></div></GardenDialog>}

    {modal === 'review' && <GardenDialog onPause={pauseConversation} title="Here is what I heard…" onClose={closeModal}><p className="dialog-note">Read it, change it, or try again. There is no hurry.</p><label className="sr-only" htmlFor="voice-review">Review your words</label><textarea id="voice-review" rows={4} maxLength={MAX_EXPRESSION} value={transcript} onChange={event => setTranscript(event.target.value)} /><div className="dialog-actions"><button className="garden-primary" disabled={!transcript.trim()} onClick={() => submitPatient(transcript)}>Share these words<Check size={19} /></button><button className="garden-text-button" onClick={requestMic}>Try speaking again</button></div></GardenDialog>}

    {modal === 'pause' && <GardenDialog onPause={pauseConversation} title="Let us rest for a while." onClose={closeModal}><div className="dialog-symbol"><Heart size={35} strokeWidth={1.2} /></div><p className="dialog-lead">{REASSURANCE}</p><button className="garden-secondary" onClick={() => readAloud(REASSURANCE)}>Hear these words</button><p className="dialog-note">Your words and flower stay here. The microphone and audio are off.</p><div className="garden-contact-options">{contact ? <><a className="garden-secondary" href={'tel:' + contact.phone}>Call {contact.name}</a><p className="dialog-note">Opens your device’s calling app for {contact.phone}. Review the number before calling.</p></> : <button className="garden-secondary" onClick={() => openContact(true)}>Add someone to call</button>}</div><div className="dialog-actions"><button className="garden-primary" onClick={resume}>Return to the garden<Leaf size={19} /></button><button className="garden-text-button" onClick={closeModal}>Rest for today</button></div></GardenDialog>}

    {modal === 'finish' && current && <GardenDialog onPause={pauseConversation} title="Keep this little moment." onClose={closeModal}><p className="dialog-note">What you have shared is enough.</p><label className="garden-field-label" htmlFor="flower-title">A name for your flower</label><input id="flower-title" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} /><div className="story-excerpts">{current.entries.filter(entry => entry.speaker !== 'companion').map(entry => <blockquote key={entry.id}><span>{entry.speaker === 'patient' ? 'You shared' : `${entry.name} shared`}</span><p>{entry.text}</p></blockquote>)}</div><div className="dialog-actions"><button className="garden-primary" onClick={finish}><Flower2 size={21} />Save for another day</button><button className="garden-text-button" onClick={closeModal}>Stay a little longer</button></div></GardenDialog>}

    {modal === 'collection' && <GardenDialog onPause={pauseConversation} title="Little moments, always here." onClose={closeModal} wide><p className="dialog-note">Choose a flower to read or listen to its story. No questions to answer.</p><div className="flower-collection">{garden.flowers.map(flower => <button className="collection-flower-card" key={flower.id} onClick={() => showStory(flower)}><div><GardenFlower kind={flower.kind} stage={flower.stage} familyBud={flower.familyBud} sensoryDetails={flower.sensoryDetails} /></div><span>{flower.title}</span><small>{flower.example ? 'Example story' : flowerNames[flower.kind]}<ChevronRight size={14} /></small></button>)}</div>{garden.flowers.length === 0 && <p className="dialog-lead">There is room for your first little moment. We can plant it whenever you feel ready.</p>}</GardenDialog>}

    {modal === 'story' && viewing && <GardenDialog onPause={pauseConversation} title={viewing.title} onClose={closeModal} wide><div className="story-layout"><div className="story-flower"><GardenFlower kind={viewing.kind} stage={viewing.stage} familyBud={viewing.familyBud} sensoryDetails={viewing.sensoryDetails} /><span>{flowerNames[viewing.kind]}</span></div><div><p className="story-record-label">{viewing.example ? 'Fictional example · for demonstration' : 'The words we shared'}</p><div className="story-excerpts">{viewing.entries.filter(entry => entry.speaker !== 'companion').map(entry => <blockquote key={entry.id}><span>{entry.speaker === 'patient' ? 'You shared' : `${entry.name || 'Family'} shared · with permission`}</span><p>{entry.text}</p></blockquote>)}</div>{speechAvailable && <button className="garden-secondary" onClick={() => speaking ? stopAudio() : readAloud(viewing.entries.filter(entry => entry.speaker !== 'companion').map(entry => `${entry.speaker === 'family' ? `${entry.name} shared: ` : 'You shared: '}${entry.text}`).join('. '))}>{speaking ? <Square size={18} /> : <Volume2 size={19} />}{speaking ? 'Stop reading' : 'Listen to this story'}</button>}{viewing.stage < 7 && !viewing.example && <button className="garden-primary" onClick={() => continueStory(viewing)}><Play size={19} />Continue this story</button>}<p className="dialog-note">The saved date is the date of sharing, not the date of the event. These are the words as shared.</p>{!viewing.example && <button className="delete-story-button" onClick={() => { if (window.confirm('Delete this story and its flower from this device?')) { commit({ ...gardenRef.current, flowers: gardenRef.current.flowers.filter(flower => flower.id !== viewing.id) }); if (featured?.id === viewing.id) setFeatured(null); closeModal(); } }}>Delete this story</button>}</div></div></GardenDialog>}

    {modal === 'family-consent' && <GardenDialog onPause={pauseConversation} title="May your companion add a little detail?" onClose={closeModal}><p className="dialog-lead">Their words will be named separately. Your story stays in your own words.</p><div className="dialog-actions"><button className="garden-primary" onClick={() => { setFamilyGranted(true); setModal('family-note'); }}>Yes, let us listen<Check size={19} /></button><button className="garden-secondary" onClick={() => { setFamilyGranted(false); closeModal(); setNotification('Of course. We are here to listen to you.'); }}>Not this time</button></div></GardenDialog>}

    {modal === 'family-note' && familyGranted && <GardenDialog onPause={pauseConversation} title="Share one gentle detail." onClose={closeModal}><p className="dialog-note">Start with “My impression is…” and share your own recollection. Leave room for their words.</p><form onSubmit={saveFamily}><label className="garden-field-label" htmlFor="family-name">Your name</label><input id="family-name" required maxLength={40} value={familyName} onChange={event => setFamilyName(event.target.value)} placeholder="For example: Alex" /><label className="garden-field-label" htmlFor="family-expression">A little detail from your perspective</label><textarea id="family-expression" required rows={3} maxLength={MAX_EXPRESSION} value={familyText} onChange={event => setFamilyText(event.target.value)} placeholder="My impression is…" /><div className="dialog-actions"><button className="garden-primary" type="submit">Save this detail<Leaf size={19} /></button><button className="garden-text-button" type="button" onClick={closeModal}>Skip this detail</button></div></form></GardenDialog>}

    {modal === 'settings' && <GardenDialog className="garden-settings-drawer" onPause={pauseConversation} title="Make yourself comfortable." onClose={closeModal}><GardenNameEditor name={ownerName} onSave={saveOwnerName} /><p className="dialog-note">Your stories stay on this device for your privacy.</p><div className="garden-voice-settings"><h3>Voice volume</h3><div><button aria-label="Lower volume" onClick={() => setVoiceVolume(value => Math.max(0, +(value - .1).toFixed(1)))}>−</button><output aria-live="polite">{Math.round(voiceVolume * 100)}%</output><button aria-label="Raise volume" onClick={() => setVoiceVolume(value => Math.min(1, +(value + .1).toFixed(1)))}>+</button></div><h3>Reading speed</h3><div><button aria-label="Slower voice" onClick={() => setVoiceRate(value => Math.max(.5, +(value - .1).toFixed(1)))}>−</button><output aria-live="polite">{Math.round(voiceRate * 100)}%</output><button aria-label="Faster voice" onClick={() => setVoiceRate(value => Math.min(1.2, +(value + .1).toFixed(1)))}>+</button></div></div><div className="garden-settings"><label><span><Leaf size={19} />Reduce motion<small>Show growth without animation.</small></span><input type="checkbox" checked={reduceMotion} onChange={event => setReduceMotion(event.target.checked)} /></label><label><span>{autoRead ? <Volume2 size={19} /> : <VolumeX size={19} />}Read on touch<small>Speaks when you explore a topic or open a reply. You can turn this off.</small></span><input type="checkbox" checked={autoRead} disabled={!speechAvailable} onChange={event => { setAutoRead(event.target.checked); if (!event.target.checked) stopAudio(); }} /></label><details className="garden-developer-options"><summary>Developer options</summary><p>Local demo / guided replies</p><label><span><ShieldCheck size={19} />Use cloud AI<small>{aiAvailable ? 'When on, recent text from this conversation is sent to OpenAI for each reply. Other flowers and recordings are excluded.' : 'Not connected. Local guided replies let you explore the full garden experience.'}</small></span><input type="checkbox" checked={cloudAllowed} disabled={!aiAvailable || thinking || recording} onChange={event => setCloudAllowed(event.target.checked)} /></label><p>Reset removes this app’s stories, contact and name on this device. Other browser data is untouched.</p><button className="garden-secondary" onClick={clearDemoGarden}>Reset demo garden</button></details></div><p className="dialog-note">You can turn cloud AI off at any time. AI can make mistakes. This garden offers companionship, without diagnosis, treatment, or medical advice.</p><div className="data-controls"><h3>Someone close to you.</h3><p>{contact ? contact.name + ' · ' + contact.phone : 'Add someone you would like to call when you want company.'}</p><button className="garden-secondary" onClick={() => openContact()}>{contact ? 'Edit contact' : 'Add a contact'}</button>{contact && <button className="garden-text-button" onClick={() => { if (writeContact(null)) setContact(null); else setNotification('This contact could not be removed. Please try again.'); }}>Remove contact</button>}<p>Contact details stay on this device and are never included in AI conversations. Calls only begin when you choose to call.</p></div><div className="data-controls"><h3>Your stories, in your care.</h3><p>Stories are saved in this browser. Clearing browser data removes your garden. You can export a copy first.</p><button className="garden-secondary" onClick={() => download(JSON.stringify(gardenRef.current, null, 2), 'memory-garden.json')}>Export your garden<ArrowRight size={18} /></button>{hasCorruptData && <button className="garden-text-button" onClick={() => { try { download(localStorage.getItem(GARDEN_KEY) || '', 'memory-garden-original.json'); } catch { setNotification('The original data could not be read.'); } }}>Export original data</button>}</div>{storageError && <p role="alert" className="garden-storage-error">{storageError}</p>}<button className="garden-secondary garden-exit" onClick={leaveGarden}>Leave the garden</button></GardenDialog>}
    {modal === 'name' && <GardenDialog onPause={pauseConversation} title="Whose garden is this?" onClose={closeModal}><GardenNameEditor name={ownerName} onSave={saveOwnerName} /></GardenDialog>}
    {modal === 'contact' && <GardenDialog onPause={pauseConversation} title="Someone you can call." onClose={closeModal}><p className="dialog-note">Choose a family member, friend, or someone you trust. We will never call them automatically.</p><form onSubmit={saveContact}><label className="garden-field-label" htmlFor="contact-name">Contact name</label><input id="contact-name" autoComplete="off" required maxLength={40} value={contactName} onChange={event => setContactName(event.target.value)} /><label className="garden-field-label" htmlFor="contact-phone">Phone number</label><input id="contact-phone" type="tel" inputMode="tel" autoComplete="off" required maxLength={32} aria-describedby="contact-note" value={contactPhone} onChange={event => setContactPhone(event.target.value)} /><p id="contact-note" className="dialog-note">Include the country code when needed. This opens the calling app on your device; a calling app or phone service is required.</p>{contactError && <p className="garden-storage-error" role="alert">{contactError}</p>}<div className="dialog-actions"><button className="garden-primary" type="submit">Save contact<Check size={19} /></button><button className="garden-text-button" type="button" onClick={closeModal}>Not now</button></div></form></GardenDialog>}
  </div>;
}
