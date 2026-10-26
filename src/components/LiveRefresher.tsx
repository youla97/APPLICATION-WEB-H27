"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Écoute le flux SSE et rafraîchit les données serveur sans recharger la page. */
export default function LiveRefresher() {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        router.refresh();
        setFlash(true);
        setTimeout(() => setFlash(false), 1500);
      }, 250);
    };
    return () => es.close();
  }, [router]);

  return (
    <span
      className="no-print inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"
      role="status"
    >
      <span className="relative flex size-2">
        {flash && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400" />}
        <span className={`relative inline-flex size-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-400"}`} />
      </span>
      {live ? "En direct" : "Hors ligne"}
    </span>
  );
}
