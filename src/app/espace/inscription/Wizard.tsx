"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ChevronRight, CloudCheck, Loader2, ScanLine, UserRound, BookUser, MapPinned, Users, ClipboardCheck, Pencil } from "lucide-react";
import { saveDraft, submitDossier } from "@/app/actions/pelerin";
import { parseMrz, sampleMrz } from "@/lib/mrz";
import { gnf } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import type { Package } from "@/lib/data";
import ListenButton from "@/components/ListenButton";

type Data = Record<string, string | boolean | undefined>;

const STEPS = [
  { icon: UserRound, key: "identity" },
  { icon: BookUser, key: "passport" },
  { icon: MapPinned, key: "choice" },
  { icon: Users, key: "relative" },
  { icon: ClipboardCheck, key: "summary" },
] as const;

const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]+/g, "<");

async function compressImage(file: File, max = 480): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/webp", 0.8);
}

export default function Wizard(props: {
  t: Dict;
  lang: "fr" | "ar";
  initial: Data;
  initialStep: number;
  photo: string | null;
  numero: string | null;
  rejection: string | null;
  regions: string[];
  packages: Package[];
  phone: string;
}) {
  const { t, regions, packages } = props;
  const router = useRouter();
  const [numero, setNumero] = useState(props.numero);
  const [step, setStep] = useState(Math.min(5, Math.max(1, props.initialStep)));
  const [data, setData] = useState<Data>(props.initial);
  const [photo, setPhoto] = useState<string | null>(props.photo);
  const [photoDirty, setPhotoDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "offline">("idle");
  const [error, setError] = useState<string | null>(null);
  const [mrzText, setMrzText] = useState("");
  const [mrzMsg, setMrzMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const first = useRef(true);

  const set = (k: string, v: string | boolean) => setData((d) => ({ ...d, [k]: v }));

  // Sauvegarde automatique (serveur + copie locale pour le mode hors ligne)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try { localStorage.setItem("hadj-draft", JSON.stringify({ data, step })); } catch {}
    setSaveState("saving");
    const id = setTimeout(async () => {
      try {
        const r = await saveDraft(photoDirty && photo ? { ...data, photo } : data, step);
        setNumero(r.numero);
        setPhotoDirty(false);
        setSaveState("saved");
      } catch {
        setSaveState("offline");
      }
    }, 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, step, photo]);

  const go = (n: number) => {
    setError(null);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!data.firstName || !data.lastName) return "Indiquez votre nom et prénom.";
      if (!data.sex) return "Choisissez Homme ou Femme.";
      if (!data.birthDate) return "Indiquez votre date de naissance.";
      if (!photo) return "Ajoutez une photo d'identité.";
    }
    if (step === 2 && (!data.passportNo || !data.passportExpiry)) return "Scannez votre passeport ou saisissez son numéro et sa date d'expiration.";
    if (step === 3 && (!data.region || !data.packageId)) return "Choisissez votre région et votre package.";
    if (step === 4 && (!data.emergencyName || !data.emergencyPhone)) return "Indiquez une personne à prévenir.";
    return null;
  };

  const next = () => {
    const e = validateStep();
    if (e) return setError(e);
    go(step + 1);
  };

  const applyMrz = (text: string) => {
    const r = parseMrz(text);
    if (!r.ok) return setMrzMsg({ ok: false, text: r.error! });
    setData((d) => ({ ...d, lastName: d.lastName || r.lastName, firstName: d.firstName || r.firstName, passportNo: r.passportNo, nationality: r.nationality, birthDate: d.birthDate || r.birthDate, sex: d.sex || r.sex, passportExpiry: r.passportExpiry, mrz: text }));
    setMrzMsg({ ok: true, text: `Passeport ${r.passportNo} lu avec succès · clés de contrôle valides.` });
  };

  const onScan = async (file?: File) => {
    if (!file) return;
    setScanning(true);
    setMrzMsg(null);
    // Démonstration : la lecture OCR de la bande MRZ est simulée à partir de l'identité saisie.
    await new Promise((r) => setTimeout(r, 1600));
    const text = sampleMrz(ascii(String(data.lastName || "DIALLO")), ascii(String(data.firstName || "MAMADOU")));
    setMrzText(text);
    applyMrz(text);
    setScanning(false);
  };

  const submit = () =>
    startSubmit(async () => {
      setError(null);
      const r = await submitDossier(photoDirty && photo ? { ...data, photo } : data);
      if (!r.ok) return setError(r.error ?? "Erreur");
      try { localStorage.removeItem("hadj-draft"); } catch {}
      router.push("/espace");
      router.refresh();
    });

  const pkg = packages.find((p) => p.id === data.packageId);
  const field = (k: string, label: string, type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} type={type} className="input" value={String(data[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...extra} />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-32">
      {/* En-tête des étapes */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-stone-500">{t.step} {step}/5{numero && <span className="ms-2 font-mono">{numero}</span>}</span>
        <span className="flex items-center gap-1.5 text-stone-500" aria-live="polite">
          {saveState === "saving" && <><Loader2 className="size-4 animate-spin" /> {t.saving}</>}
          {saveState === "saved" && <><CloudCheck className="size-4 text-emerald-600" /> {t.autosaved}</>}
          {saveState === "offline" && <span className="text-amber-700">Hors ligne · copie locale</span>}
        </span>
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button type="button" disabled={i + 1 > step && !props.rejection} onClick={() => go(i + 1)} className="w-full text-center disabled:cursor-default">
              <span className={`mx-auto grid size-11 place-items-center rounded-full transition ${i + 1 < step ? "bg-emerald-600 text-white" : i + 1 === step ? "bg-amber-400 text-stone-900 ring-4 ring-amber-200 dark:ring-amber-900" : "bg-stone-200 text-stone-400 dark:bg-stone-800"}`}>
                {i + 1 < step ? <Check className="size-5" /> : <s.icon className="size-5" />}
              </span>
              <span className="mt-1 block text-[11px] font-semibold leading-tight">{t[s.key]}</span>
            </button>
          </li>
        ))}
      </ol>

      {props.rejection && (
        <div className="mt-5 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <b>À corriger :</b> {props.rejection} — modifiez seulement la partie concernée puis renvoyez.
        </div>
      )}

      <div key={step} className="card animate-fade-up mt-5 p-5 sm:p-7">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-extrabold">{t.identity}</h1>
              <ListenButton text="Étape 1. Indiquez votre nom, votre prénom, votre date de naissance et prenez une photo de votre visage." label={t.listen} />
            </div>
            <div className="flex items-center gap-4">
              <label className="relative grid size-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50 transition hover:bg-emerald-100 dark:bg-emerald-950/40">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Photo d'identité" className="size-full object-cover" />
                ) : (
                  <span className="text-center text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Camera className="mx-auto mb-1 size-7" />{t.photo}</span>
                )}
                <input type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setPhoto(await compressImage(f)); setPhotoDirty(true); } }} />
              </label>
              <p className="text-sm text-stone-500">Photo de face, fond clair, sans lunettes. Elle est compressée automatiquement (WebP).</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("lastName", t.lastName, "text", { autoComplete: "family-name" })}
              {field("firstName", t.firstName, "text", { autoComplete: "given-name" })}
            </div>
            <div>
              <span className="label">{t.sex}</span>
              <div className="grid grid-cols-2 gap-3">
                {[["M", "👳 " + t.male], ["F", "🧕 " + t.female]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set("sex", v)} className={`min-h-14 rounded-xl border-2 text-lg font-semibold transition ${data.sex === v ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950" : "border-stone-200 dark:border-stone-700"}`} aria-pressed={data.sex === v}>
                    {l}
                  </button>
                ))}
              </div>
              {data.sex === "F" && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">ℹ️ Les femmes de moins de 45 ans voyagent avec un mahram, à indiquer à l&apos;étape 4.</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("birthDate", t.birthDate, "date")}
              {field("birthPlace", t.birthPlace)}
            </div>
            {field("address", t.address, "text", { autoComplete: "street-address" })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-extrabold">{t.passport}</h1>
              <ListenButton text="Étape 2. Prenez en photo la page de votre passeport avec votre photo. Les informations seront remplies automatiquement." label={t.listen} />
            </div>
            <label className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50 p-6 text-center transition hover:bg-emerald-100 dark:bg-emerald-950/40 ${scanning ? "pointer-events-none" : ""}`}>
              {scanning && <span className="absolute inset-x-0 top-0 h-1 animate-[fade-up_1s_ease-in-out_infinite_alternate] bg-emerald-500 shadow-[0_0_20px_4px] shadow-emerald-400" />}
              <ScanLine className="size-10 text-emerald-700" />
              <span className="mt-2 text-lg font-bold text-emerald-900 dark:text-emerald-200">{scanning ? "Lecture de la bande MRZ…" : t.scanPassport}</span>
              <span className="text-sm text-stone-500">Lecture automatique de la zone en bas de la page (MRZ)</span>
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onScan(e.target.files?.[0])} />
            </label>
            {mrzMsg && <p className={`animate-pop rounded-xl p-3 text-sm font-medium ${mrzMsg.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>{mrzMsg.ok ? "✅ " : "⚠️ "}{mrzMsg.text}</p>}
            <details className="rounded-xl bg-sand-100 p-3 text-sm dark:bg-stone-800">
              <summary className="cursor-pointer font-semibold">Saisir la bande MRZ manuellement</summary>
              <textarea className="input mt-2 min-h-24 py-2 font-mono text-xs" value={mrzText} onChange={(e) => setMrzText(e.target.value)} placeholder={"P<GINDIALLO<<MAMADOU<<<<<<<<<<<<<<<<<<<<<<<<<\nO038712649GIN6203145M3109185<<<<<<<<<<<<<<04"} />
              <button type="button" className="btn-ghost mt-2 min-h-10 text-sm" onClick={() => applyMrz(mrzText)}>Lire la MRZ</button>
            </details>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("passportNo", t.passportNo, "text", { style: { textTransform: "uppercase" } })}
              {field("passportExpiry", t.passportExpiry, "date")}
            </div>
            <p className="text-sm text-stone-500">Le passeport doit être valide au moins jusqu&apos;au 31 décembre 2027.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-extrabold">{t.choice}</h1>
            <div>
              <span className="label">{t.region}</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {regions.map((r) => (
                  <button key={r} type="button" onClick={() => set("region", r)} aria-pressed={data.region === r} className={`min-h-12 rounded-xl border-2 px-3 font-semibold transition ${data.region === r ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "border-stone-200 hover:border-stone-300 dark:border-stone-700"}`}>
                    {r === "Diaspora" ? "🌍 " : "📍 "}{r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">{t.package}</span>
              <div className="space-y-3">
                {packages.map((p) => (
                  <button key={p.id} type="button" onClick={() => set("packageId", p.id)} aria-pressed={data.packageId === p.id} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition ${data.packageId === p.id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950" : "border-stone-200 hover:border-stone-300 dark:border-stone-700"}`}>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${data.packageId === p.id ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300"}`}>{data.packageId === p.id && <Check className="size-4" />}</span>
                    <span className="flex-1">
                      <span className="block font-bold">{props.lang === "ar" ? p.nameAr : p.name} <span className="font-normal text-stone-500">· {p.days} j</span></span>
                      <span className="block text-sm text-stone-500">{p.hotel}</span>
                    </span>
                    <span className="text-end font-extrabold text-emerald-800 dark:text-emerald-400">{gnf(p.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">{t.relative}</h1>
            <p className="text-stone-500">Cette personne sera prévenue en cas d&apos;urgence et pourra suivre votre voyage.</p>
            {field("emergencyName", t.name)}
            {field("emergencyPhone", t.phone, "tel", { inputMode: "tel", placeholder: "622 12 34 56" })}
            <div>
              <label className="label" htmlFor="rel">{t.link}</label>
              <select id="rel" className="input" value={String(data.emergencyRelation ?? "")} onChange={(e) => set("emergencyRelation", e.target.value)}>
                <option value="">—</option>
                {["Époux / épouse", "Fils / fille", "Frère / sœur", "Père / mère", "Mahram accompagnant", "Autre"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">{t.summary}</h1>
            {[
              { s: 1, title: t.identity, rows: [[t.name, `${data.firstName ?? ""} ${data.lastName ?? ""}`], [t.sex, data.sex === "F" ? t.female : data.sex === "M" ? t.male : ""], [t.birthDate, data.birthDate], [t.photo, photo ? "✅" : "❌"]] },
              { s: 2, title: t.passport, rows: [[t.passportNo, data.passportNo], [t.passportExpiry, data.passportExpiry]] },
              { s: 3, title: t.choice, rows: [[t.region, data.region], [t.package, pkg ? `${pkg.name} · ${gnf(pkg.price)}` : ""]] },
              { s: 4, title: t.relative, rows: [[t.name, data.emergencyName], [t.phone, data.emergencyPhone]] },
            ].map((b) => (
              <div key={b.s} className="rounded-2xl bg-sand-50 p-4 dark:bg-stone-800/60">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">{b.title}</h2>
                  <button type="button" onClick={() => go(b.s)} className="flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><Pencil className="size-3.5" /> Modifier</button>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {b.rows.map(([k, v]) => (
                    <div key={String(k)} className="contents">
                      <dt className="text-stone-500">{k}</dt>
                      <dd className={`font-semibold ${!v ? "text-red-600" : ""}`}>{String(v || "manquant")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-stone-200 p-4 dark:border-stone-700">
              <input type="checkbox" className="mt-1 size-6 accent-emerald-700" checked={Boolean(data.consent)} onChange={(e) => set("consent", e.target.checked)} />
              <span className="text-sm">{t.consent}</span>
            </label>
            <p className="text-sm text-stone-500">Alertes envoyées par SMS au +224 {props.phone}.</p>
          </div>
        )}

        {error && <p className="animate-pop mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
      </div>

      {/* Barre d'actions fixe en bas (une action principale par écran) */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 1 && (
            <button type="button" className="btn-ghost" onClick={() => go(step - 1)} aria-label={t.back}>
              <ChevronLeft className="size-5 rtl:rotate-180" /> <span className="hidden sm:inline">{t.back}</span>
            </button>
          )}
          {step < 5 ? (
            <button type="button" className="btn-primary flex-1 text-lg" onClick={next}>
              {t.next} <ChevronRight className="size-5 rtl:rotate-180" />
            </button>
          ) : (
            <button type="button" className="btn-gold flex-1 text-lg" onClick={submit} disabled={submitting || !data.consent}>
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} {t.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
