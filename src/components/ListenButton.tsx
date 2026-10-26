"use client";
import { useState } from "react";
import { Volume2, Square } from "lucide-react";

/** Lecture vocale du texte (synthèse du navigateur). Les messages en pular, malinké et soussou seront des enregistrements audio. */
export default function ListenButton({ text, label = "Écouter", lang = "fr-FR", className = "" }: { text: string; label?: string; lang?: string; className?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const toggle = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    speechSynthesis.speak(u);
    setSpeaking(true);
  };
  return (
    <button type="button" onClick={toggle} className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 ${className}`}>
      {speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}
      {label}
    </button>
  );
}
