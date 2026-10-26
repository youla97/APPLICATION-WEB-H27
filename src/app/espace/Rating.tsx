"use client";
import { useState, useTransition } from "react";
import { rateTrip } from "@/app/actions/pelerin";

export default function Rating({ initial }: { initial: number | null }) {
  const [rating, setRating] = useState(initial ?? 0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(initial != null);
  const [pending, start] = useTransition();

  if (sent) return <p className="animate-pop mt-4 rounded-xl bg-emerald-50 p-4 text-center font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Merci pour votre avis ({rating}/5) 🤲</p>;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-center gap-1" role="radiogroup" aria-label="Note sur 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} sur 5`}
            onClick={() => setRating(n)}
            className={`text-4xl transition hover:scale-110 ${n <= rating ? "" : "opacity-25 grayscale"}`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea className="input min-h-20 py-3" placeholder="Un commentaire (facultatif)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn-primary w-full" disabled={!rating || pending} onClick={() => start(async () => { await rateTrip(rating, comment); setSent(true); })}>
        Envoyer mon avis
      </button>
    </div>
  );
}
