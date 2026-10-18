'use client';


import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Flower2,
  Heart,
  Check,
} from "lucide-react";

import { saveVoice, getVoices, deleteVoice } from "../../lib/garden-recordings";

const recipients = [
  {
    id: "someone",
    emoji: "💛",
    title: "Someone I care about",
    greeting: "To someone special",
  },
  {
    id: "myself",
    emoji: "🌷",
    title: "Myself",
    greeting: "Dear me",
  },
  {
    id: "anyone",
    emoji: "🌎",
    title: "Anyone who needs a smile",
    greeting: "To you",
  },
  {
    id: "today",
    emoji: "☀️",
    title: "Just for today",
    greeting: "A note for today",
  },
];

const prompts = [
  "What made you smile today?",
  "What is something you love?",
  "What would you like someone to know?",
  "What is a little moment you're grateful for?",
];

function AudioPlayer({ blob, muted = false }) {
  const [url, setUrl] = useState(null);
  const audioRef = useRef(null);
  useEffect(() => { const audio = audioRef.current; return () => audio?.pause(); }, [url]);

  useEffect(() => {
    if (!blob) return;

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  if (!url) return null;

  return (
    <audio
      ref={audioRef}
      aria-label="Listen to your voice note"
      muted={muted}
      loop={false}
      controls
      src={url}
      className="w-full"
    />
  );
}

export default function LittleNotes({ onBack, onComplete, gardenId, embedded = false, soundMuted = false }) {
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [prompt, setPrompt] = useState(prompts[0]);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [savedVoices, setSavedVoices] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const activeRef = useRef(true);
  const captureToken = useRef(0);
  const captureTimer = useRef(null);
  const [requesting, setRequesting] = useState(false);

  const chosenRecipient = recipients.find(
    (item) => item.id === recipient
  );

  async function loadVoices() {
    try {
      if (!gardenId) return;
      const voices = await getVoices(gardenId);

      if (activeRef.current) {
        setSavedVoices(voices);
      }
    } catch (err) {
      console.error("Could not load voices:", err);
      if (activeRef.current) {
        setError("Saved recordings could not be loaded.");
      }
    }
  }

  useEffect(() => {
    activeRef.current = true;
    loadVoices();
    const hidden = () => {
      if (!document.hidden) return;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      else { captureToken.current++; setRequesting(false); }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      activeRef.current = false; captureToken.current++;
      clearTimeout(captureTimer.current);
      document.removeEventListener("visibilitychange", hidden);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [gardenId]);

  async function startRecording() {
    if (requesting || recording) return;
    const token = ++captureToken.current;
    setError("");
    setAudioBlob(null);
    setSaved(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    if (!window.MediaRecorder) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!activeRef.current || token !== captureToken.current) { stream.getTracks().forEach(track => track.stop()); return; }
      setRequesting(false);
      streamRef.current = stream;
      const chunks = [];
      chunksRef.current = chunks;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      let timeout;
      recorder.ondataavailable = (event) => {
        if (activeRef.current && token === captureToken.current && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimeout(timeout);
        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (activeRef.current && token === captureToken.current && blob.size > 0 && blob.size <= 8 * 1024 * 1024) {
          setAudioBlob(blob);
        }

        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;

        if (activeRef.current && token === captureToken.current) {
          if (blob.size > 8 * 1024 * 1024) setError("This recording is a little large. You can try a shorter note.");
          setRecording(false);
        }
      };

      recorder.onerror = () => {
        clearTimeout(captureTimer.current);
        if (recorder.state === "recording") recorder.stop();
        if (activeRef.current && token === captureToken.current) {
          setError("Something went wrong while recording.");
          setRecording(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      timeout = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 120000);
      captureTimer.current = timeout;
    } catch (err) {
      if (activeRef.current && token === captureToken.current) { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setError("Microphone access is unavailable. You can return to the garden and try another time."); setRequesting(false); }
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function goBack() {
    captureToken.current++; clearTimeout(captureTimer.current); setRequesting(false);
    streamRef.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
    if (recording) {
      stopRecording();
    }

    if (step === 0) {
      onBack?.();
    } else {
      setStep(step - 1);
    }
  }

  async function plantFlower() {
    if (!audioBlob || saving || saved) return;
    if (!gardenId) { setError("Your garden could not be opened for saving. You can listen here or return to the garden."); return; }

    setSaving(true);
    setError("");

    const id = crypto.randomUUID();

    const voice = {
      id,
      gardenId,
      title: "A Little Voice",
      emoji: "🌷",
      type: "voice",
      recipient: chosenRecipient?.greeting || "A little voice",
      prompt,
      audio: audioBlob,
      createdAt: Date.now(),
    };

    try {
      await saveVoice(voice);
      await loadVoices();

      if (!activeRef.current) return;
      setSaved(true);

      onComplete?.({
        id,
        title: voice.title,
        emoji: voice.emoji,
        type: "voice",
        recipient: voice.recipient,
        prompt: voice.prompt,
        recordingId: id,
      });
    } catch (err) {
      console.error(err);
      if (activeRef.current) setError("Your recording could not be saved. You can try again.");
    } finally {
      if (activeRef.current) setSaving(false);
    }
  }

  function startNewVoice() {
    setAudioBlob(null);
    setSaved(false);
    setRecipient(null);
    setPrompt(prompts[0]);
    setStep(0);
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] px-5 py-10 text-[#30352F]">
      <div className="max-w-3xl mx-auto">

        {(!embedded || step > 0) && <button
          onClick={goBack}
          className="flex items-center gap-2 text-[#789079] mb-10 text-lg"
        >
          <ArrowLeft size={20} />
          {step === 0 ? "Back to Garden" : "Go Back"}
        </button>}

        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[#E8EDE5] flex items-center justify-center mx-auto mb-5">
            <Mic size={36} className="text-[#789079]" />
          </div>

          <p className="text-[#789079] mb-3">
            Every voice holds something special
          </p>

          <h1 className="text-5xl mb-4">
            Little Notes
          </h1>

          <p className="text-[#789079] text-lg">
            Share a little moment, in your own words.
            No need to remember anything.
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-[#E8EDE5] border border-[#D7DDCA] text-[#31463A] rounded-2xl p-5 mb-6">
            {error}
          </div>
        )}

        {step === 0 && (
          <div>
            <h2 className="text-2xl text-center mb-8">
              Who would you like this voice message to be for?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recipients.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setRecipient(item.id);
                    setStep(1);
                  }}
                  className="bg-white border border-[#E8EDE5] hover:border-[#789079] rounded-3xl p-7 text-center"
                >
                  <div className="text-5xl mb-4">
                    {item.emoji}
                  </div>

                  <h3 className="text-xl mb-2">
                    {item.title}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-[#E8EDE5] text-center">

            <Heart
              size={30}
              className="text-[#789079] mx-auto mb-5"
            />

            <h2 className="text-3xl mb-4">
              What would you like to share?
            </h2>

            <p className="text-[#789079] mb-6">
              Choose a gentle prompt, or simply speak from your heart.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {prompts.map((item) => (
                <button
                  key={item}
                  onClick={() => setPrompt(item)}
                  className={`p-4 rounded-2xl border text-left ${
                    prompt === item
                      ? "bg-[#E8EDE5] border-[#789079]"
                      : "bg-[#FAF7F0] border-[#E8EDE5]"
                  }`}
                >
                  {item}
                  {prompt === item && (
                    <Check
                      size={16}
                      className="inline ml-2 text-[#789079]"
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="bg-[#789079] text-white px-9 py-4 rounded-full text-lg flex items-center gap-3 mx-auto"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8EDE5] text-center">

            <p className="text-[#789079] mb-4">
              {chosenRecipient?.greeting}
            </p>

            <h2 className="text-3xl mb-4">
              Your voice matters
            </h2>

            <p className="text-[#789079] text-lg mb-10">
              {prompt}
            </p>

            {!audioBlob && <p className="text-[#536454] mb-6">Your microphone starts only when you choose Record. Review your note before saving. Saved audio stays in this browser and can be deleted below.</p>}
            {!audioBlob && (
              <button
                aria-label={recording ? "Stop recording" : requesting ? "Opening microphone" : "Record a voice note"}
                disabled={requesting}
                onClick={recording ? stopRecording : startRecording}
                className={`w-28 h-28 rounded-full text-white flex items-center justify-center mx-auto mb-5 ${
                  recording ? "bg-[#B56D69]" : "bg-[#789079]"
                }`}
              >
                {recording ? (
                  <Square size={36} fill="white" />
                ) : (
                  <Mic size={42} />
                )}
              </button>
            )}

            {!audioBlob && (
              <p className="text-[#789079] mb-8">
                {recording
                  ? "Recording... Tap to stop"
                  : requesting ? "Opening your microphone..." : "Tap the microphone to begin"}
              </p>
            )}

            {audioBlob && (
              <div className="space-y-6">
                <p className="text-[#789079] text-lg">
                  Your recording is ready!
                </p>

                <AudioPlayer blob={audioBlob} muted={soundMuted} />

                <button
                  onClick={() => setAudioBlob(null)}
                  className="flex items-center gap-2 mx-auto text-[#789079]"
                >
                  <RotateCcw size={18} />
                  Record Again
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="bg-[#789079] text-white px-9 py-4 rounded-full text-lg flex items-center gap-3 mx-auto"
                >
                  Continue
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl p-10 border border-[#E8EDE5] text-center">

            <div className="text-7xl mb-6">
              🌷
            </div>

            <h2 className="text-4xl mb-5">
              Something beautiful, made by you.
            </h2>

            <p className="text-[#789079] text-lg mb-8">
              Your voice is a memory worth keeping.
            </p>

            {audioBlob && (
              <div className="mb-8">
                <AudioPlayer blob={audioBlob} muted={soundMuted} />
              </div>
            )}

            {!saved ? (
              <button
                onClick={plantFlower}
                disabled={saving || !gardenId}
                className="bg-[#789079] text-white px-10 py-4 rounded-full text-lg flex items-center gap-3 mx-auto disabled:opacity-50"
              >
                <Flower2 size={22} />
                {saving ? "Saving..." : "Save voice note"}
              </button>
            ) : (
              <button
                onClick={startNewVoice}
                className="bg-[#789079] text-white px-10 py-4 rounded-full text-lg mx-auto"
              >
                Record Another Memory
              </button>
            )}
          </div>
        )}

        {savedVoices.length > 0 && step === 0 && (
          <div className="mt-12 bg-white rounded-3xl p-7 border border-[#E8EDE5]">
            <h2 className="text-2xl mb-5">
              🌼 Your Saved Voices
            </h2>

            <div className="space-y-5">
              {savedVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="bg-[#FAF7F0] rounded-2xl p-5"
                >
                  <p className="font-medium mb-1">
                    🌷 {voice.recipient}
                  </p>

                  <p className="text-[#789079] text-sm mb-3">
                    {new Date(voice.createdAt).toLocaleString('en-US')}
                  </p>

                  <AudioPlayer blob={voice.audio} muted={soundMuted} />
                  <button className="garden-text-button" onClick={async () => {
                    if (!window.confirm("Delete this voice note from this device?")) return;
                    try { await deleteVoice(voice.id, gardenId); await loadVoices(); }
                    catch { setError("This voice note could not be deleted. You can try again."); }
                  }}>Delete voice note</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-10">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-2 rounded-full ${
                step === index
                  ? "w-8 bg-[#789079]"
                  : "w-2 bg-[#DCE5D9]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
