import { getUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { RITES, PLACES } from "@/lib/data";
import ListenButton from "@/components/ListenButton";
import HolyMap from "./HolyMap";
import Sos from "./Sos";

export const metadata = { title: "Accompagnement sur place" };

export default async function Page() {
  const [user, { t }] = await Promise.all([getUser(), getT()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="pattern rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Hadj accompagné</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t.rites}</h1>
        <p className="mt-2 max-w-2xl text-emerald-50/80">Disponible hors ligne : une fois ouverte, cette page reste consultable sans Internet sur votre téléphone.</p>
      </div>

      {user?.role === "pelerin" && <Sos labels={{ emergency: t.emergency, emergencyText: t.emergencyText, lost: t.lost, medical: t.medical }} />}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="text-xl font-extrabold">Programme jour par jour</h2>
          <ol className="mt-4 space-y-4">
            {RITES.map((r, i) => (
              <li key={r.title} className="card animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <details open={i === 0} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-lg font-extrabold text-amber-900 dark:bg-amber-950 dark:text-amber-200">{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">{r.day} · {r.place}</span>
                      <span className="block text-lg font-bold">{r.title}</span>
                    </span>
                    <span className="text-2xl text-stone-400 transition group-open:rotate-90 rtl:rotate-180">›</span>
                  </summary>
                  <ul className="mt-4 space-y-2 ps-16">
                    {r.steps.map((s) => (
                      <li key={s} className="flex gap-2"><span className="text-emerald-600">✓</span> {s}</li>
                    ))}
                  </ul>
                  <div className="mt-3 ps-16">
                    <ListenButton text={`${r.title}, ${r.day}, à ${r.place}. ${r.steps.join(". ")}`} label={t.listen} />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-extrabold">{t.map}</h2>
          <HolyMap places={PLACES} />
          <div className="card mt-4">
            <h3 className="font-bold">📋 Consignes essentielles</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
              <li>• Portez toujours votre badge avec QR code.</li>
              <li>• Buvez au moins 3 litres d&apos;eau par jour, utilisez une ombrelle.</li>
              <li>• Point de ralliement en cas de séparation : tente du groupe à Mina.</li>
              <li>• Ne suivez que les consignes de votre encadreur.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
