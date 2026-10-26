"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Smartphone, KeyRound, Loader2 } from "lucide-react";
import { requestOtp, verifyOtp } from "@/app/actions/auth";

type T = { phone: string; sendCode: string; code: string; verify: string; back: string; login: string };

export default function LoginForm({ t, demo }: { t: T; demo: { phone: string; label: string }[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sms, setSms] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const codeRef = useRef<HTMLInputElement>(null);

  const send = (p = phone) =>
    start(async () => {
      setError(null);
      const r = await requestOtp(p);
      if (!r.ok) return setError(r.error ?? "Erreur");
      setSms(r.demoCode ?? null);
      setTimeout(() => codeRef.current?.focus(), 50);
    });

  const verify = (c = code) =>
    start(async () => {
      setError(null);
      const r = await verifyOtp(phone, c);
      if (!r.ok) return setError(r.error ?? "Erreur");
      router.push(r.redirectTo ?? "/espace");
      router.refresh();
    });

  return (
    <div className="space-y-5">
      {sms && (
        <div className="animate-pop fixed inset-x-4 top-20 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-2xl bg-stone-900 p-4 text-white shadow-2xl" role="alert">
          <MessageSquareText className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          <div className="text-sm">
            <div className="font-semibold">SMS · HADJ2027 (simulation)</div>
            Votre code de connexion est <b className="text-lg tracking-widest text-amber-300">{sms}</b>. Valable 5 min.
          </div>
        </div>
      )}

      <div className="card animate-fade-up p-6 sm:p-8">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {sms ? <KeyRound className="size-8" /> : <Smartphone className="size-8" />}
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold">{t.login}</h1>
        <p className="mt-1 text-center text-stone-500">Pas de mot de passe : un code vous est envoyé par SMS.</p>

        {!sms ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label className="label" htmlFor="phone">{t.phone}</label>
            <div className="flex gap-2">
              <span className="input flex w-auto items-center font-semibold text-stone-500">🇬🇳 +224</span>
              <input
                id="phone"
                className="input text-lg tracking-wider"
                inputMode="tel"
                autoComplete="tel"
                placeholder="622 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full text-lg" disabled={pending}>
              {pending && <Loader2 className="size-5 animate-spin" />} {t.sendCode}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
            <label className="label" htmlFor="code">{t.code}</label>
            <input
              id="code"
              ref={codeRef}
              className="input text-center text-3xl font-bold tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setCode(v);
                if (v.length === 6) verify(v);
              }}
            />
            <button className="btn-primary w-full text-lg" disabled={pending || code.length !== 6}>
              {pending && <Loader2 className="size-5 animate-spin" />} {t.verify}
            </button>
            <button type="button" className="btn-ghost w-full" onClick={() => { setSms(null); setCode(""); }}>
              {t.back}
            </button>
          </form>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
      </div>

      <div className="card">
        <p className="text-sm font-bold">Comptes de démonstration</p>
        <p className="text-xs text-stone-500">Tout autre numéro crée un compte pèlerin.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {demo.map((d) => (
            <button
              key={d.phone}
              type="button"
              className="rounded-xl border border-stone-200 px-3 py-2 text-start text-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-stone-700 dark:hover:bg-stone-800"
              onClick={() => { setPhone(d.phone); send(d.phone); }}
            >
              <div className="font-semibold">{d.label}</div>
              <div className="text-xs text-stone-500">{d.phone}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
