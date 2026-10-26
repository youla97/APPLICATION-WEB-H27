"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { assistedRegistration } from "@/app/actions/pelerin";

export default function AssistedForm({ regions, packages, defaultRegion }: { regions: string[]; packages: { id: string; name: string }[]; defaultRegion: string }) {
  const router = useRouter();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  return (
    <form
      key={formKey}
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        start(async () => {
          setError(null);
          const r = await assistedRegistration(data);
          if (!r.ok) return setError(r.error ?? "Erreur");
          setDone(r.numero!);
          setFormKey((k) => k + 1);
          router.refresh();
        });
      }}
    >
      {done && (
        <div className="animate-pop flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-6" /> Dossier <b className="font-mono">{done}</b> créé et soumis. Le pèlerin a reçu un SMS.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="phone" label="Téléphone du pèlerin" placeholder="622 12 34 56" inputMode="tel" />
        <div>
          <label className="label">Sexe</label>
          <select name="sex" className="input" required defaultValue=""><option value="" disabled>—</option><option value="M">Homme</option><option value="F">Femme</option></select>
        </div>
        <Field name="lastName" label="Nom" />
        <Field name="firstName" label="Prénom(s)" />
        <Field name="birthDate" label="Date de naissance" type="date" />
        <Field name="birthPlace" label="Lieu de naissance" required={false} />
        <Field name="passportNo" label="N° de passeport" />
        <Field name="passportExpiry" label="Expiration du passeport" type="date" />
        <div>
          <label className="label">Région</label>
          <select name="region" className="input" defaultValue={defaultRegion} required>{regions.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        <div>
          <label className="label">Package</label>
          <select name="packageId" className="input" required defaultValue=""><option value="" disabled>—</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
        <Field name="emergencyName" label="Personne à prévenir" />
        <Field name="emergencyPhone" label="Son téléphone" inputMode="tel" />
      </div>
      <p className="text-xs text-stone-500">Les pièces originales (passeport, photo) sont scannées au guichet et vérifiées par l&apos;agent. Le consentement oral du pèlerin est recueilli.</p>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending && <Loader2 className="size-5 animate-spin" />} Inscrire et soumettre le dossier</button>
    </form>
  );
}

function Field({ name, label, type = "text", required = true, ...rest }: { name: string; label: string; type?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" required={required} {...rest} />
    </div>
  );
}
