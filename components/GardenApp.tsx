'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flower2, Heart, Leaf, LoaderCircle, Mic, Pause, PenLine, Play, Settings2, ShieldCheck, Sprout, Square, Users, Volume2, VolumeX, X } from 'lucide-react';
import GardenFlower from './GardenFlower';
import GardenDialog from './GardenDialog';
import { COMFORT, GARDEN_KEY, GardenEntry, GardenMemory, GardenStore, MAX_EXPRESSION, OPENING, addFamily, addPatient, exampleFlowers, finishMemory, flowerNames, isStopSignal, localReply, newMemory, readGarden, writeGarden } from '../lib/garden';

type VoiceResult = { results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } };
type SpeechInput = { continuous: boolean; interimResults: boolean; lang: string; onresult: ((event: VoiceResult) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type VoiceWindow = Window & { SpeechRecognition?: new () => SpeechInput; webkitSpeechRecognition?: new () => SpeechInput };
type Modal = 'welcome' | 'text' | 'review' | 'finish' | 'pause' | 'collection' | 'story' | 'settings' | 'mic' | 'family-consent' | 'family-note' | null;

export default function GardenApp() {
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
  const [autoRead, setAutoRead] = useState(false);
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
    try {
      const saved = readGarden();
      gardenRef.current = saved; setGarden(saved);
      if (saved.current) { paused.current = true; setBubble('这段讲述还在这里。想接着说时，我们再慢慢聊。'); }
    } catch {
      setHasCorruptData(true);
      setStorageError('暂时无法读取原来的花园。原始记录没有被覆盖；本次可以先体验，或在设置中导出原始记录。');
      const fallback: GardenStore = { version: 1, flowers: exampleFlowers, current: null };
      gardenRef.current = fallback; setGarden(fallback);
    }
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setSpeechAvailable('speechSynthesis' in window);
    setLoaded(true);
    const controller = new AbortController();
    fetch('/api/garden', { signal: controller.signal, cache: 'no-store' }).then(response => response.json()).then(data => setAiAvailable(data.available === true)).catch(() => {});
    return () => { controller.abort(); request.current?.abort(); voiceEpoch.current++; recognition.current?.abort(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (!garden.current || garden.current.status !== 'growing' || thinking || recording || modal || waitingNotice.current) return;
    const timer = setTimeout(() => { waitingNotice.current = true; setNotification('不用着急，我们可以安静地坐一会儿。'); }, 30000);
    return () => clearTimeout(timer);
  }, [garden.current, thinking, recording, modal]);

  function commit(next: GardenStore) {
    gardenRef.current = next; setGarden(next);
    if (hasCorruptData) return;
    if (!writeGarden(next)) setStorageError('刚才的讲述还在当前页面，但暂时无法保存。请先保持页面打开，可以在设置中导出一份副本。');
    else setStorageError('');
  }

  function stopAudio() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function readAloud(text: string) {
    stopAudio();
    if (!speechAvailable) return;
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'zh-CN'; voice.rate = 0.8;
    voice.onend = () => setSpeaking(false); voice.onerror = () => setSpeaking(false);
    utterance.current = voice; setSpeaking(true); window.speechSynthesis.speak(voice);
  }

  function stopWork() {
    epoch.current++; voiceEpoch.current++;
    request.current?.abort(); request.current = null;
    recognition.current?.abort(); recognition.current = null;
    inFlight.current = false; setThinking(false); setRecording(false); stopAudio();
    setFamilyGranted(false); setFamilyOpen(false); setRequestError(false);
  }

  function pauseConversation() {
    stopWork(); paused.current = true;
    const state = gardenRef.current;
    if (state.current) commit({ ...state, current: { ...state.current, status: 'paused' } });
    setBubble(COMFORT); setModal('pause'); setNotification('花朵和已经说过的话都留在这里，没有变化。');
  }

  function resume() {
    paused.current = false; waitingNotice.current = false;
    const state = gardenRef.current;
    if (state.current) {
      commit({ ...state, current: { ...state.current, status: 'growing' } });
      const last = [...state.current.entries].reverse().find(entry => entry.speaker === 'companion');
      setBubble(last?.text || OPENING);
    } else setBubble(OPENING);
    setModal(null); setNotification('我们慢慢来。麦克风没有自动开启。');
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
    if (!gardenRef.current.current) { setModal('welcome'); return; }
    if (intent === 'text') { stopAudio(); setModal('text'); }
    else requestMic();
  }

  function acceptWelcome() {
    ensureSession(); paused.current = false; setBubble(OPENING); setNotification('');
    if (pendingIntent.current === 'text') setModal('text');
    else requestMic();
  }

  function requestMic() {
    stopAudio();
    const browser = window as VoiceWindow;
    if (!browser.SpeechRecognition && !browser.webkitSpeechRecognition) { setNotification('这个浏览器暂不支持语音识别。我们也可以用文字慢慢说。'); setModal('text'); return; }
    if (!micAccepted) { setModal('mic'); return; }
    startMic();
  }

  function startMic() {
    const Constructor = (window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition;
    if (!Constructor) { setModal('text'); return; }
    stopAudio(); setModal(null); ensureSession();
    const token = ++voiceEpoch.current;
    const speech = new Constructor(); recognition.current = speech;
    speech.lang = 'zh-CN'; speech.continuous = true; speech.interimResults = true;
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
      setNotification(event.error === 'not-allowed' ? '麦克风没有开启。可以用文字说，也可以先休息。' : '刚才没有听清。可以用文字说，或稍后再试。');
      setDraft(transcriptRef.current); setModal('text');
    };
    speech.onend = () => {
      if (token !== voiceEpoch.current || paused.current) return;
      setRecording(false); recognition.current = null;
      if (transcriptRef.current.trim()) setModal('review');
      else setNotification('没有关系，想说的时候再点一下就好。');
    };
    try { speech.start(); } catch { voiceEpoch.current++; setRecording(false); recognition.current = null; setNotification('语音暂时没有开启。可以先用文字说。'); setModal('text'); }
  }

  function cancelRecording() {
    voiceEpoch.current++; recognition.current?.abort(); recognition.current = null;
    setRecording(false); transcriptRef.current = ''; setTranscript(''); setNotification('这次录音没有留下。花园还在这里。');
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
          if (!response.ok) throw new Error(result.error || '暂时没有连上。');
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
      if (autoRead) readAloud(message);
      if (started.current && Date.now() - started.current > 300000) setTimeToRest(true);
    } catch {
      if (token !== epoch.current || paused.current) return;
      setBubble('暂时没有连上。刚才的话还在，我们可以先坐一会儿。'); setRequestError(true);
    } finally {
      if (token === epoch.current) { setThinking(false); inFlight.current = false; request.current = null; }
    }
  }

  function submitPatient(text: string) {
    if (!text.trim() || text.trim().length > MAX_EXPRESSION || inFlight.current || paused.current) return;
    if (isStopSignal(text)) { pauseConversation(); return; }
    const memory = addPatient(ensureSession(), text);
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
    commit({ ...state, flowers: [flower, ...state.flowers], current: null });
    setFeatured(flower); setJustBloomed(true); setModal(null); setTimeToRest(false);
    setBubble('谢谢你和我们分享。这段时光，已经在花园里了。');
    setNotification('花朵已绽放。想看这段讲述时，随时可以回来。');
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
    setModal(null);
  }

  function showStory(memory: GardenMemory) { stopAudio(); setViewing(memory); setModal('story'); }
  function download(data: string, filename: string) {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  }

  const current = garden.current;
  const activeFlower = current || featured;
  const canFinish = !!current?.entries.some(entry => entry.speaker === 'patient');
  const hints = ['先听一听，再等一等。不用急着帮忙补完句子。', '可以轻轻邀请：“你想再说说当时的声音吗？”只选一个方向。', '熟悉的照片或物品可以放在身边。由他／她决定要不要聊。'];
  const lastPatient = [...(current?.entries || [])].reverse().find(entry => entry.speaker === 'patient');

  return <div className={'memory-garden-app' + (reduceMotion ? ' quiet-motion' : '')}>
    <a className="skip-link" href="#garden-main">跳到花园</a>
    <header className="garden-header">
      <a className="garden-brand" href="/" aria-label="Memory Garden 记忆花园"><span className="brand-sprout"><Sprout size={29} strokeWidth={1.3} /></span><span>Memory Garden<small>记 忆 花 园</small></span></a>
      <div className="garden-header-actions"><button className={'soft-button companion-toggle' + (familyOpen ? ' selected' : '')} aria-expanded={familyOpen} onClick={() => { stopAudio(); setFamilyOpen(value => !value); }} disabled={recording || thinking}><Users size={19} /><span>陪伴提示</span></button><button className="rest-button" onClick={pauseConversation}><Pause size={18} /><span>休息一下</span></button></div>
    </header>

    <main id="garden-main">
      <section className={'garden-scene' + (featured && !current ? ' scene-has-bloom' : '')} aria-label="回忆花园">
        <Image className="garden-landscape" src="/garden/garden-background.png" alt="" aria-hidden="true" fill priority sizes="100vw" quality={85} />
        <div className="scene-wash" />
        <div className="garden-introduction"><p><span /> A GARDEN OF LITTLE MOMENTS</p><h1>慢慢说，花会慢慢开。</h1></div>
        <div className="companion-bubble" aria-busy={thinking}>
          <div className="bubble-topline"><span><span className="companion-leaf"><Leaf size={15} /></span>{thinking ? '陪你慢慢整理' : '花园里的陪伴者'}</span>{speechAvailable && <button className="bubble-listen" aria-label={speaking ? '停止朗读' : '听一听这个问题'} onClick={() => speaking ? stopAudio() : readAloud(bubble)} disabled={recording || thinking}>{speaking ? <Square size={15} /> : <Volume2 size={17} />}<span>{speaking ? '停止' : '听一听'}</span></button>}</div>
          <p className="bubble-message" aria-live="polite">{thinking ? <span className="thinking-copy"><LoaderCircle size={22} />我在听，慢慢来。</span> : bubble}</p>
          <span className="bubble-footnote">{current?.status === 'paused' ? '不用完成什么，花园会等你。' : '想到一点，就说一点。不用急。'}</span>
        </div>

        <div className={'current-flower-place' + (justBloomed ? ' freshly-bloomed' : '')} key={activeFlower?.id || 'empty'}>
          <GardenFlower kind={activeFlower?.kind || 'daisy'} stage={activeFlower?.stage || 0} familyBud={activeFlower?.familyBud} />
          <p className="current-flower-label">{current ? current.stage > 0 ? '你说过的话，正在这里生长' : '从一句话，开始一段时光' : featured ? '这一朵，留下了你的讲述' : '留一小块地方，给你的故事'}</p>
          {featured && !current && <button className="new-flower-story" onClick={() => showStory(featured)}>看看这朵花的故事<ChevronRight size={16} /></button>}
        </div>

        <div className="saved-flower-plots" aria-label="已留下的花朵">
          {garden.flowers.filter(flower => flower.id !== featured?.id).slice(0, 3).map((flower, index) => <button key={flower.id} className={`saved-flower saved-flower-${index}`} onClick={() => showStory(flower)} aria-label={`${flower.example ? '示例：' : ''}${flower.title}，查看故事`}><GardenFlower kind={flower.kind} stage={5} /><span className="flower-nameplate">{flower.title}<ChevronRight size={13} /></span>{flower.example && <small>示例回忆</small>}</button>)}
        </div>
        <div className="scene-caption"><span />在这里，每一段讲述都值得被温柔留下<span /></div>

        {familyOpen && <aside className="family-panel" aria-labelledby="family-panel-title"><div className="family-panel-top"><span><Users size={18} />一起陪伴</span><button className="garden-icon-button" aria-label="收起陪伴提示" onClick={() => setFamilyOpen(false)}><X size={20} /></button></div><h2 id="family-panel-title">先陪着，再慢慢说。</h2><div className="family-hint"><Leaf size={20} /><p>{hints[hint]}</p></div><button className="hint-next" onClick={() => setHint(value => (value + 1) % hints.length)}>换一张陪伴提示<ArrowRight size={15} /></button><p className="family-guidance">一次只聊一个方向。不纠正，也不替他／她回答。</p><button className="garden-secondary" disabled={!canFinish || paused.current || thinking} onClick={() => { setFamilyGranted(false); setModal('family-consent'); }}>我想补充一句</button>{!canFinish && <small>先听他／她说一点，再一起补充。</small>}</aside>}
      </section>

      <section className="garden-input-area" aria-label="分享一段回忆">
        {recording ? <div className="recording-area"><div className="recording-status"><span className="recording-dot" /><span>正在听你说，停顿也没关系。</span></div><p className="live-transcript" aria-live="polite">{transcript || '想到什么，都可以慢慢说。'}</p><div className="input-actions"><button className="garden-primary" onClick={() => recognition.current?.stop()}><Square size={18} />我说好了</button><button className="garden-text-button" onClick={cancelRecording}>取消这次录音</button></div></div>
          : <><div className="input-actions"><button className="garden-primary voice-button" aria-label={current?.status === 'paused' ? '继续这段讲述' : '开始说话'} onClick={() => current?.status === 'paused' ? setModal('pause') : begin('voice')} disabled={!loaded || thinking}>{current?.status === 'paused' ? <Play size={22} /> : <Mic size={23} strokeWidth={1.6} />}<span>{current?.status === 'paused' ? '继续这段讲述' : featured && !current ? '再聊一段时光' : '点一下，说说看'}</span></button><button className="write-button" onClick={() => begin('text')} disabled={!loaded || thinking}><PenLine size={20} /><span>用文字说</span></button>{canFinish && <button className="keep-memory-button" onClick={openFinish} disabled={thinking}><Flower2 size={20} />把这段留下</button>}</div><p className="input-reassurance">{thinking ? '你可以随时点「休息一下」。' : current?.status === 'paused' ? '已经说过的话会留在这里。' : '点下按钮后才会开启麦克风，随时可以停。'}</p></>}
        {lastPatient && !recording && <p className="last-shared"><span>你刚才说</span>“{lastPatient.text}”</p>}
        {requestError && <div className="request-recovery"><button className="garden-text-button" onClick={() => current && void replyTo(current)}>再连接一次</button><button className="garden-text-button" onClick={() => { setCloudAllowed(false); setRequestError(false); if (current) setBubble(localReply(current)); }}>继续本地规则演示</button></div>}
        <p className="garden-notification" role="status">{notification || (timeToRest ? '已经一起坐了一会儿，随时可以先把这段留下。' : '\u00a0')}</p>
        {storageError && <p className="garden-storage-error" role="alert">{storageError}</p>}
      </section>

      <section className="garden-keepsakes"><div><span className="little-leaf"><Leaf size={16} /></span><p>有些时光，<em>一直在这里。</em></p></div><button className="garden-text-button" onClick={() => { stopAudio(); setModal('collection'); }}><BookOpen size={18} />看看留下的花<ArrowRight size={17} /></button></section>
    </main>

    <footer className="garden-footer"><span><ShieldCheck size={14} />讲述保存在这台设备</span><button onClick={() => { stopAudio(); setModal('settings'); }}><Settings2 size={15} />{cloudAllowed ? '云端 AI 陪伴' : '本地演示 · 规则回应'}<span className="footer-settings">与设置</span></button><p>不必想起全部。一起坐一会儿，也很好。</p></footer>

    {modal === 'welcome' && <GardenDialog onPause={pauseConversation} title="在花园里，慢慢说就好。" onClose={closeModal}><div className="dialog-symbol"><Sprout size={38} strokeWidth={1.2} /></div><p className="dialog-lead">我们可以聊一点生活里的小事。你想说多少，就说多少。</p><ul className="welcome-notes"><li><Pause size={18} />随时可以休息，不用完成什么。</li><li><ShieldCheck size={18} />讲述保存在这台设备。</li><li><Leaf size={18} />{cloudAllowed ? '你已同意把这段会话的文字交给 OpenAI 回应。' : '当前使用本地规则演示，不会发送给 AI。'}</li></ul><div className="dialog-actions"><button className="garden-primary" onClick={acceptWelcome}>我愿意聊一会儿<ArrowRight size={19} /></button><button className="garden-text-button" onClick={closeModal}>先看看花</button></div></GardenDialog>}

    {modal === 'text' && <GardenDialog onPause={pauseConversation} title="把想说的话，慢慢写下来。" onClose={closeModal}><p className="dialog-context">{bubble}</p><form onSubmit={event => { event.preventDefault(); submitPatient(draft); }}><label className="sr-only" htmlFor="patient-expression">你的讲述</label><textarea id="patient-expression" autoFocus rows={5} maxLength={MAX_EXPRESSION} value={draft} onChange={event => { setDraft(event.target.value); if (isStopSignal(event.target.value)) pauseConversation(); }} placeholder="一句话、一点印象，都可以。" /><div className="dialog-actions"><button className="garden-primary" type="submit" disabled={!draft.trim()}>就这样留下<Check size={19} /></button><button className="garden-text-button" type="button" onClick={pauseConversation}>先休息一下</button></div></form></GardenDialog>}

    {modal === 'mic' && <GardenDialog onPause={pauseConversation} title="开始前，先告诉你。" onClose={closeModal}><div className="dialog-symbol"><Mic size={34} /></div><p className="dialog-lead">语音由浏览器识别，可能需要联网处理声音。我们不会保存原始录音。</p><p className="dialog-note">你说完后，可以先确认文字，再决定留下。也可以一直使用文字。</p><div className="dialog-actions"><button className="garden-primary" onClick={() => { setMicAccepted(true); startMic(); }}>同意，开始说话<Mic size={19} /></button><button className="garden-text-button" onClick={() => setModal('text')}>改用文字</button></div></GardenDialog>}

    {modal === 'review' && <GardenDialog onPause={pauseConversation} title="我听到的是……" onClose={closeModal}><p className="dialog-note">可以看看、改一改，或重新说。不用担心。</p><label className="sr-only" htmlFor="voice-review">确认语音文字</label><textarea id="voice-review" rows={4} maxLength={MAX_EXPRESSION} value={transcript} onChange={event => setTranscript(event.target.value)} /><div className="dialog-actions"><button className="garden-primary" disabled={!transcript.trim()} onClick={() => submitPatient(transcript)}>就这样留下<Check size={19} /></button><button className="garden-text-button" onClick={requestMic}>重新说</button></div></GardenDialog>}

    {modal === 'pause' && <GardenDialog onPause={pauseConversation} title="我们先歇一会儿。" onClose={closeModal}><div className="dialog-symbol"><Heart size={35} strokeWidth={1.2} /></div><p className="dialog-lead">没关系，我们可以改天再来看它。</p><p className="dialog-note">已经说过的话和花朵都留在这里。麦克风与声音已停止。</p><div className="dialog-actions"><button className="garden-primary" onClick={resume}>回到花园<Leaf size={19} /></button><button className="garden-text-button" onClick={closeModal}>今天先到这里</button></div></GardenDialog>}

    {modal === 'finish' && current && <GardenDialog onPause={pauseConversation} title="把这段时光留下。" onClose={closeModal}><p className="dialog-note">不用再补充什么了，这些就很好。</p><label className="garden-field-label" htmlFor="flower-title">这朵花的名字</label><input id="flower-title" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} /><div className="story-excerpts">{current.entries.filter(entry => entry.speaker !== 'companion').map(entry => <blockquote key={entry.id}><span>{entry.speaker === 'patient' ? '你说过' : `${entry.name}补充`}</span><p>{entry.text}</p></blockquote>)}</div><div className="dialog-actions"><button className="garden-primary" onClick={finish}><Flower2 size={21} />让这朵花留下</button><button className="garden-text-button" onClick={closeModal}>再坐一会儿</button></div></GardenDialog>}

    {modal === 'collection' && <GardenDialog onPause={pauseConversation} title="有些时光，一直在这里。" onClose={closeModal} wide><p className="dialog-note">点一朵花，看看或听听那段讲述。不用回答问题。</p><div className="flower-collection">{garden.flowers.map(flower => <button className="collection-flower-card" key={flower.id} onClick={() => showStory(flower)}><div><GardenFlower kind={flower.kind} /></div><span>{flower.title}</span><small>{flower.example ? '示例回忆' : flowerNames[flower.kind]}<ChevronRight size={14} /></small></button>)}</div>{garden.flowers.length === 0 && <p className="dialog-lead">花园还有很多空地。想说的时候，我们再种下一段时光。</p>}</GardenDialog>}

    {modal === 'story' && viewing && <GardenDialog onPause={pauseConversation} title={viewing.title} onClose={closeModal} wide><div className="story-layout"><div className="story-flower"><GardenFlower kind={viewing.kind} /><span>{flowerNames[viewing.kind]}</span></div><div><p className="story-record-label">{viewing.example ? '虚构示例 · 仅用于体验' : '我们留下的讲述'}</p><div className="story-excerpts">{viewing.entries.filter(entry => entry.speaker !== 'companion').map(entry => <blockquote key={entry.id}><span>{entry.speaker === 'patient' ? '你说过' : `${entry.name || '家人'}补充 · 已获得当次同意`}</span><p>{entry.text}</p></blockquote>)}</div>{speechAvailable && <button className="garden-secondary" onClick={() => speaking ? stopAudio() : readAloud(viewing.entries.filter(entry => entry.speaker !== 'companion').map(entry => `${entry.speaker === 'family' ? `${entry.name}补充：` : '你说过：'}${entry.text}`).join('。'))}>{speaking ? <Square size={18} /> : <Volume2 size={19} />}{speaking ? '停止朗读' : '听听这段讲述'}</button>}<p className="dialog-note">记录时间不代表事情发生的时间。这里保留的是讲述本身。</p>{!viewing.example && <button className="delete-story-button" onClick={() => { if (window.confirm('要从这台设备删除这段讲述和它的花朵吗？')) { commit({ ...gardenRef.current, flowers: gardenRef.current.flowers.filter(flower => flower.id !== viewing.id) }); if (featured?.id === viewing.id) setFeatured(null); closeModal(); } }}>删除这段讲述</button>}</div></div></GardenDialog>}

    {modal === 'family-consent' && <GardenDialog onPause={pauseConversation} title="可以让身边的人补充一句吗？" onClose={closeModal}><p className="dialog-lead">补充会单独署名，不会替代你的讲述。</p><div className="dialog-actions"><button className="garden-primary" onClick={() => { setFamilyGranted(true); setModal('family-note'); }}>可以，听听看<Check size={19} /></button><button className="garden-secondary" onClick={() => { setFamilyGranted(false); closeModal(); setNotification('好的，我们先听你说。'); }}>这次不用</button></div></GardenDialog>}

    {modal === 'family-note' && familyGranted && <GardenDialog onPause={pauseConversation} title="轻轻补充一句。" onClose={closeModal}><p className="dialog-note">用“我印象里……”说自己的记忆，不纠正、不替他／她作答。</p><form onSubmit={saveFamily}><label className="garden-field-label" htmlFor="family-name">你的称呼</label><input id="family-name" required maxLength={40} value={familyName} onChange={event => setFamilyName(event.target.value)} placeholder="例如：小林" /><label className="garden-field-label" htmlFor="family-expression">你想补充的一点印象</label><textarea id="family-expression" required rows={3} maxLength={MAX_EXPRESSION} value={familyText} onChange={event => setFamilyText(event.target.value)} placeholder="我印象里……" /><div className="dialog-actions"><button className="garden-primary" type="submit">留下这一句<Leaf size={19} /></button><button className="garden-text-button" type="button" onClick={closeModal}>这次先不补充</button></div></form></GardenDialog>}

    {modal === 'settings' && <GardenDialog onPause={pauseConversation} title="把花园调得更舒服。" onClose={closeModal}><div className="garden-settings"><label><span><Leaf size={19} />减少动效<small>用静态变化呈现花朵生长。</small></span><input type="checkbox" checked={reduceMotion} onChange={event => setReduceMotion(event.target.checked)} /></label><label><span>{autoRead ? <Volume2 size={19} /> : <VolumeX size={19} />}自动轻声朗读<small>使用设备合成声音，不模仿家人。</small></span><input type="checkbox" checked={autoRead} disabled={!speechAvailable} onChange={event => { setAutoRead(event.target.checked); if (!event.target.checked) stopAudio(); }} /></label><label><span><ShieldCheck size={19} />使用云端 AI<small>{aiAvailable ? '开启后，每次发送会把当前会话最近的文字交给 OpenAI；不包含其他花朵或录音。' : '尚未连接。当前为本地规则回应，可以完整体验花园流程。'}</small></span><input type="checkbox" checked={cloudAllowed} disabled={!aiAvailable || thinking || recording} onChange={event => setCloudAllowed(event.target.checked)} /></label></div><p className="dialog-note">你可以随时关闭云端 AI。AI 可能出错；这个花园提供陪伴，不提供诊断、治疗或医疗建议。</p><div className="data-controls"><h3>你的讲述，由你保管。</h3><p>数据保存在当前浏览器。清除浏览器数据会移除花园，可以先导出副本。</p><button className="garden-secondary" onClick={() => download(JSON.stringify(gardenRef.current, null, 2), 'memory-garden.json')}>导出花园副本<ArrowRight size={18} /></button>{hasCorruptData && <button className="garden-text-button" onClick={() => { try { download(localStorage.getItem(GARDEN_KEY) || '', 'memory-garden-original.json'); } catch { setNotification('原始记录暂时无法读取。'); } }}>导出未覆盖的原始记录</button>}</div></GardenDialog>}
  </div>;
}
