'use client';


import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  Flower2,
  Heart,
} from "lucide-react";


const sounds = [
  {
    name: "A Rainy Afternoon",
    emoji: "🌧️",
    description: "The gentle rhythm of falling rain.",
    question: "How does the sound of rain make you feel?",
    file: "/sounds/rain.mp3",
  },
  {
    name: "Birds in the Garden",
    emoji: "🐦",
    description: "A peaceful morning filled with birdsong.",
    question: "What do you enjoy most about being outside?",
    file: "/sounds/birds.mp3",
  },
  {
    name: "A Familiar Melody",
    emoji: "🎵",
    description: "A little music to brighten your day.",
    question: "What does this melody make you think about?",
    file: "/sounds/music.mp3",
  },
  {
    name: "Ocean Waves",
    emoji: "🌊",
    description: "Gentle waves washing onto the shore.",
    question: "What do you enjoy about being near the water?",
    file: "/sounds/ocean.mp3",
  },
  {
    name: "A Cozy Fireplace",
    emoji: "🔥",
    description: "The comforting crackle of a warm fire.",
    question: "What makes a place feel like home to you?",
    file: "/sounds/fireplace.mp3",
  },
  {
    name: "Morning Coffee",
    emoji: "☕",
    description: "The familiar sound of coffee being poured.",
    question: "What's your favorite way to start the day?",
    file: "/sounds/coffee.mp3",
  },
];


export default function FamiliarSounds({ onBack, onComplete, embedded = false, soundMuted = false }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [answer, setAnswer] = useState("");
  const [audioError, setAudioError] = useState(false);
  const [kept, setKept] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, [step, selected]);

  function chooseSound(index) {
    audioRef.current?.pause();
    setSelected(index);
    setKept(false);
    setAnswer("");
    setPlaying(false);
    setAudioError(false);
    setStep(1);
  }

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio || soundMuted) return;

    if (playing) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
      setPlaying(!audio.paused && !audio.muted);
      setAudioError(false);
    } catch {
      setPlaying(false);
      setAudioError(true);
    }
  }

  function nextStep() {
    audioRef.current?.pause();
    setPlaying(false);
    setStep(2);
  }

  function plantFlower() {
    const result = onComplete?.({
      id: Date.now(),
      title: sounds[selected].name,
      emoji: "🌼",
      type: "sound",
      sound: sounds[selected].file,
      reflection: answer,
    });
    if (result !== false) setKept(true);
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] px-6 py-10">
      <div className="max-w-2xl mx-auto">

        {!embedded && <button
          onClick={() => {
            audioRef.current?.pause();
            onBack?.();
          }}
          className="flex items-center gap-2 text-[#789079] mb-12"
        >
          <ArrowLeft size={20} />
          Back to Garden
        </button>}

        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[#E8EDE5] flex items-center justify-center mx-auto mb-5">
            <Volume2 size={36} className="text-[#789079]" />
          </div>

          <p className="text-[#789079] mb-3">
            A moment just for you
          </p>

          <h1 className="text-5xl text-[#30352F] mb-4">
            Familiar Sounds
          </h1>

          <p className="text-[#789079] text-lg">
            Sometimes a sound can bring a little joy.
          </p>
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-2xl text-center mb-8">
              What would you like to listen to?
            </h2>

            <div className="space-y-4">
              {sounds.map((sound, index) => (
                <button
                  key={sound.name}
                  onClick={() => chooseSound(index)}
                  className="w-full bg-white rounded-3xl p-6 border border-[#E8EDE5] hover:border-[#789079] flex items-center gap-5 text-left transition-colors"
                >
                  <span className="text-5xl">{sound.emoji}</span>

                  <div className="flex-1">
                    <h3 className="text-xl mb-1">
                      {sound.name}
                    </h3>
                    <p className="text-[#789079]">
                      {sound.description}
                    </p>
                  </div>

                  <ArrowRight size={22} className="text-[#789079]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && selected !== null && (
          <div className="bg-white rounded-3xl p-8 border border-[#E8EDE5] text-center shadow-sm">

            <div className="text-7xl mb-6">
              {sounds[selected].emoji}
            </div>

            <h2 className="text-3xl mb-3">
              {sounds[selected].name}
            </h2>

            <p className="text-[#789079] mb-8">
              {sounds[selected].description}
            </p>

            <audio
              ref={audioRef}
              muted={soundMuted}
              loop={false}
              src={sounds[selected].file}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() => {
                setPlaying(false);
                setAudioError(true);
              }}
            />

            <button
              onClick={toggleAudio}
              aria-label={playing ? "Pause sound" : "Play sound"}
              disabled={soundMuted}
              className="w-24 h-24 rounded-full bg-[#789079] text-white flex items-center justify-center mx-auto mb-5 hover:scale-105 transition-transform"
            >
              {playing ? <Pause size={38} /> : <Play size={38} />}
            </button>

            <p className="text-[#789079] mb-8">
              {soundMuted ? "Sound is muted. You can turn it on above." : playing ? "Playing..." : "Press play to listen"}
            </p>

            {audioError && (
              <p role="status" className="text-[#536454] mb-6">
                This sound is unavailable right now. You can choose another.
              </p>
            )}

            <div className="h-px bg-[#E8EDE5] mb-8" />

            <Heart
              size={28}
              className="text-[#789079] mx-auto mb-4"
            />

            <h3 id="sound-reflection-prompt" className="text-2xl mb-5">
              {sounds[selected].question}
            </h3>

            <textarea
              aria-labelledby="sound-reflection-prompt"
              maxLength={1200}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Share anything that comes to mind..."
              className="w-full min-h-32 bg-[#FAF7F0] rounded-2xl p-5 border border-[#E8EDE5] focus:outline-none focus:border-[#789079] resize-none text-lg"
            />

            <p className="text-sm text-[#789079] mt-3 mb-8">
              Share as much or as little as you like. You can skip this.
            </p>

            <button
              onClick={nextStep}
              className="bg-[#789079] text-white px-10 py-4 rounded-full text-lg flex items-center gap-3 mx-auto"
            >
              Continue
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => {
                audioRef.current?.pause();
                setPlaying(false);
                setStep(0);
              }}
              className="block mx-auto mt-5 text-[#789079]"
            >
              Choose another sound
            </button>
          </div>
        )}

        {step === 2 && selected !== null && (
          <div className="bg-white rounded-3xl p-10 border border-[#E8EDE5] text-center shadow-sm">

            <div className="text-7xl mb-6">🌼</div>

            <h2 className="text-4xl mb-5">
              A lovely little moment.
            </h2>

            <p className="text-lg text-[#789079] mb-4">
              Thank you for sharing this moment.
            </p>

            <p className="text-[#6F786B] mb-10">
              You can keep this listening moment on this device.
            </p>

            <button
              onClick={kept ? onBack : plantFlower}
              className="bg-[#789079] text-white px-10 py-4 rounded-full text-lg flex items-center gap-3 mx-auto"
            >
              <Flower2 size={22} />
              {kept ? "Return to the garden" : "Keep this moment"}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-10">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-2 rounded-full ${
                index === step
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
