"use client";
import { useState, useTransition } from "react";
import { Siren, MapPinOff, HeartPulse, Loader2, CheckCircle2 } from "lucide-react";
import { triggerSos } from "@/app/actions/pelerin";

type L = { emergency: string; emergencyText: string; lost: string; medical: string };

export default function Sos({ labels }: { labels: L }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const send = (kind: string) =>
    start(async () => {
      const pos = await new Promise<GeolocationPosition | null>((res) => {
        if (!navigator.geolocation) return res(null);
        navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 6000, enableHighAccuracy: true });
      });
      await triggerSos(kind, pos?.coords.latitude ?? null, pos?.coords.longitude ?? null);
      setSent(true);
    });

  return (
    <div className="mt-6">
      {!open ? (
        <button onClick={() => setOpen(true)} className="animate-pulse-ring flex w-full items-center justify-center gap-3 rounded-3xl bg-gn-red p-5 text-2xl font-extrabold text-white shadow-xl shadow-red-900/30 transition active:scale-[0.98]">
          <Siren className="size-8" /> {labels.emergency}
        </button>
      ) : sent ? (
        <div className="animate-pop flex items-center gap-4 rounded-3xl bg-emerald-700 p-5 text-white">
          <CheckCircle2 className="size-10 shrink-0" />
          <div>
            <div className="text-lg font-bold">Alerte envoyée avec votre position</div>
            <div className="text-emerald-50/90">Restez où vous êtes. Votre encadreur arrive.</div>
          </div>
        </div>
      ) : (
        <div className="animate-pop rounded-3xl border-2 border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
          <p className="font-semibold text-red-900 dark:text-red-200">{labels.emergencyText}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button disabled={pending} onClick={() => send("perdu")} className="btn-danger min-h-16 text-lg">
              {pending ? <Loader2 className="size-6 animate-spin" /> : <MapPinOff className="size-6" />} {labels.lost}
            </button>
            <button disabled={pending} onClick={() => send("malaise")} className="btn-danger min-h-16 text-lg">
              {pending ? <Loader2 className="size-6 animate-spin" /> : <HeartPulse className="size-6" />} {labels.medical}
            </button>
          </div>
          <button onClick={() => setOpen(false)} className="mt-3 w-full text-sm font-semibold text-stone-500">Annuler</button>
        </div>
      )}
    </div>
  );
}
