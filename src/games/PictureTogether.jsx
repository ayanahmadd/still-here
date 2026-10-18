'use client';

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import photoManifest from "../../lib/garden-pictures.json";
const JigsawPuzzle = dynamic(() => import("react-jigsaw-puzzle/lib").then(module => module.JigsawPuzzle), { ssr: false, loading: () => <p>Preparing your picture...</p> });
import "react-jigsaw-puzzle/lib/jigsaw-puzzle.css";
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Puzzle,
  Users,
  Trees,
  Baby,
  PartyPopper,
  PawPrint,
  Camera,
} from "lucide-react";
import "./PictureTogether.css";

// Group the imported photos by their folder.
const themes = [
  { name: "Family", emoji: "❤️", description: "People who make us feel at home", icon: Users, folder: "family" },
  { name: "Friends", emoji: "🫶", description: "Special people and shared moments", icon: Heart, folder: "friends" },
  { name: "Scenery", emoji: "🌳", description: "Places and peaceful moments", icon: Trees, folder: "scenery" },
  { name: "Childhood", emoji: "🧸", description: "Memories from younger days", icon: Baby, folder: "childhood" },
  { name: "Celebrations", emoji: "🎉", description: "Birthdays, holidays, and milestones", icon: PartyPopper, folder: "celebrations" },
  { name: "Pets", emoji: "🐾", description: "Beloved animal companions", icon: PawPrint, folder: "pets" },
];

const photosByTheme = Object.fromEntries(themes.map(theme => [theme.name, photoManifest[theme.folder] || []]));

function pickRandomPhoto(photos, previous = "") {
  const choices = photos.filter((photo) => photo !== previous);
  const available = choices.length ? choices : photos;

  return available.length
    ? available[Math.floor(Math.random() * available.length)]
    : "";
}

function CheckedPhoto({ src, alt = "Memory photo" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div>
      {!loaded && !failed && <p>Loading memory photo...</p>}

      {failed ? (
        <p>This photo couldn't be opened. Please try another photo.</p>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            display: loaded ? "block" : "none",
            maxWidth: "100%",
            maxHeight: "65vh",
            margin: "0 auto",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}

export default function PictureTogether({ onBack, onComplete, onExplore, embedded = false }) {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [photo, setPhoto] = useState("");
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const [kept, setKept] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const activePuzzle = useRef(null);
  useEffect(() => { const token = {}; activePuzzle.current = token; return () => { activePuzzle.current = null; }; }, [photo, round, preview]);

  useEffect(() => {
    setImageReady(false); setImageError(false);
    if (!photo) return;
    const image = new window.Image();
    image.onload = () => setImageReady(true);
    image.onerror = () => setImageError(true);
    image.src = photo;
    return () => { image.onload = null; image.onerror = null; };
  }, [photo, round]);

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    const unlock = () => { document.documentElement.style.overflow = previousOverflow; };
    window.addEventListener("touchcancel", unlock);
    return () => { window.removeEventListener("touchcancel", unlock); unlock(); };
  }, [photo, round, preview]);

  function chooseTheme(themeName) {
    onExplore?.();
    const themePhotos = photosByTheme[themeName] || [];
    setSelectedTheme(themeName);
    setPhoto(pickRandomPhoto(themePhotos));
    setSolved(false);
    setKept(false); setPreview(false);
    setRound((current) => current + 1);
  }

  function tryAnotherPhoto() {
    onExplore?.();
    const themePhotos = photosByTheme[selectedTheme] || [];
    setPhoto((current) => pickRandomPhoto(themePhotos, current));
    setSolved(false);
    setKept(false); setPreview(false);
    setRound((current) => current + 1);
  }

  function plantFlower() {
    const result = onComplete?.({
      id: photo + ":" + round,
      title: "A Picture Together",
      emoji: "🌸",
      type: "picture",
      photo,
      theme: selectedTheme,
    });
    if (result !== false) setKept(true);
  }

  return (
    <div className="picture-together">
      {(!embedded || selectedTheme) && <button
        className="picture-back"
        onClick={() => {
          if (selectedTheme) {
            onExplore?.();
            setSelectedTheme("");
            setPhoto("");
            setSolved(false);
    setKept(false); setPreview(false);
          } else {
            onBack?.();
          }
        }}
      >
        <ArrowLeft size={20} />
        {selectedTheme ? "Choose Another Theme" : "Back to Garden"}
      </button>}

      <header className="picture-heading">
        <Puzzle size={34} />
        <h1>Picture Together</h1>
        <p>A little picture to explore, piece by piece.</p>
      </header>

      {!selectedTheme ? (
        <section className="memory-theme-section">
          <h2>Which pictures feel interesting today?</h2>
          <p>Choose a collection to explore together. These are example photos, not your personal memories.</p>

          <div className="memory-theme-grid">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const count = photosByTheme[theme.name]?.length || 0;

              return (
                <button
                  key={theme.name}
                  className="memory-theme-card"
                  onClick={() => chooseTheme(theme.name)}
                >
                  <span className="memory-theme-emoji" aria-hidden="true"><Icon size={36} strokeWidth={1.4} /></span>
                  <span className="memory-theme-title">{theme.name}</span>
                  <span className="memory-theme-description">
                    {theme.description}
                  </span>
                  <span className="memory-theme-count">
                    {count} {count === 1 ? "photo" : "photos"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : !photo ? (
        <section className="picture-message">
          <h2>No photos in {selectedTheme} yet</h2>
          <p>
            This collection is resting for now. You can explore another theme.
          </p>
          <button
            className="picture-primary"
            onClick={() => setSelectedTheme("")}
          >
            Choose Another Theme
          </button>
        </section>
      ) : !solved ? (
        <>
          <p className="picture-instructions">
            {selectedTheme} pictures · Drag the pieces to complete the picture.
            Take your time — there's no rush.
          </p>

          <button className="picture-secondary picture-view-toggle" aria-pressed={preview} onClick={() => setPreview(value => !value)}>{preview ? "Return to the pieces" : "Just look at this picture"}</button>
          {imageError ? <p role="status">This picture is unavailable. You can choose another.</p> : preview ? <div className="picture-preview"><CheckedPhoto key={photo} src={photo} alt={`Example ${selectedTheme.toLowerCase()} picture`} /><button className="picture-primary" onClick={kept ? onBack : plantFlower}>{kept ? "Return to the garden" : "Keep this picture"}</button></div> : !imageReady ? <p role="status">Opening your picture...</p> : <div className="picture-board" role="group" aria-label="Picture puzzle: drag each piece into place" key={`${photo}-${round}`}>
            <JigsawPuzzle
              imageSrc={photo}
              rows={3}
              columns={3}
              onSolved={() => { const token = activePuzzle.current; queueMicrotask(() => { if (token && token === activePuzzle.current) setSolved(true); }); }}
            />
          </div>}
          <button className="picture-secondary picture-view-toggle" onClick={tryAnotherPhoto}>Choose another picture</button>
        </>
      ) : (
        <section className="picture-complete">
          <img src={photo} alt="Completed example picture" />
          <Heart className="picture-heart" size={30} />

          <h2>A lovely picture 💛</h2>
          <p>Every picture holds a story worth keeping.</p>

          <button className="picture-primary" onClick={kept ? onBack : plantFlower}>
            <Heart size={18} />
            {kept ? "Return to the garden" : "Keep this picture"}
          </button>

          <button className="picture-secondary" onClick={tryAnotherPhoto}>
            <RotateCcw size={18} />
            Try Another Picture
          </button>

          <button
            className="picture-secondary"
            onClick={() => {
              onExplore?.();
            setSelectedTheme("");
              setPhoto("");
              setSolved(false);
    setKept(false); setPreview(false);
            }}
          >
            <Camera size={18} />
            Choose Another Theme
          </button>
        </section>
      )}
    </div>
  );
}