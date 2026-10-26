import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Smartphone, Wallet, BellRing, MapPin, Phone, Mail, HeartHandshake } from "lucide-react";
import { getT } from "@/lib/lang";
import { getUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { FAQ, HADJ_DATE, NEWS, PACKAGES, PROGRESS_STEPS, TIMELINE, ROLES } from "@/lib/data";
import { gnf, dateFr } from "@/lib/format";
import Countdown from "@/components/Countdown";
import ListenButton from "@/components/ListenButton";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const stats = get<{ inscrits: number; valides: number }>(
    "SELECT COUNT(*) AS inscrits, SUM(status IN ('valide','complet')) AS valides FROM dossiers WHERE status <> 'brouillon'",
  )!;
  const ctaHref = user ? (ROLES[user.role]?.home ?? "/espace") : "/connexion";

  return (
    <>
      {/* Héros */}
      <section className="pattern relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white">
        <div className="absolute -end-24 -top-24 size-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
              <span className="size-2 rounded-full bg-amber-400" /> Inscriptions à partir du 1er février 2027
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">{t.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-lg text-emerald-50/85">{t.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctaHref} className="btn-gold px-7 text-lg">
                {user ? t.mySpace : t.register} <ArrowRight className="size-5 rtl:rotate-180" />
              </Link>
              <Link href="/payer" className="btn border border-white/30 bg-white/5 text-white hover:bg-white/15">
                <HeartHandshake className="size-5" /> {t.payForRelative}
              </Link>
            </div>
            <div className="mt-6">
              <ListenButton text={`${t.heroTitle}. ${t.heroText}`} label={t.listen} lang={lang === "ar" ? "ar-SA" : "fr-FR"} />
            </div>
          </div>
          <div className="animate-fade-up rounded-3xl bg-white/5 p-6 ring-1 ring-white/15 backdrop-blur [animation-delay:120ms]">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">{t.countdown}</p>
            <div className="mt-3">
              <Countdown target={HADJ_DATE} labels={t} />
            </div>
            <p className="mt-3 text-sm text-emerald-100/70">Date approximative (≈ 15 mai 2027), à confirmer selon l&apos;observation lunaire.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-extrabold tabular-nums">{stats.inscrits.toLocaleString("fr-FR")}</div>
                <div className="text-sm text-emerald-100/80">dossiers déposés</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-extrabold tabular-nums">{(stats.valides ?? 0).toLocaleString("fr-FR")}</div>
                <div className="text-sm text-emerald-100/80">dossiers validés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Atouts */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Smartphone, title: "Inscription en 10 min", text: "Sur un simple smartphone, ou assistée par un agent à la préfecture." },
            { icon: Wallet, title: "Paiement par tranches", text: "Orange Money, MTN MoMo ou virement. Reçu avec QR code." },
            { icon: BellRing, title: "Alertes en temps réel", text: "SMS et notifications à chaque étape de votre dossier." },
            { icon: ShieldCheck, title: "Données protégées", text: "Chiffrement, accès par rôle et journal d'audit." },
          ].map((f, i) => (
            <div key={f.title} className="card animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Parcours */}
      <section className="pattern-light bg-sand-100 py-14 dark:bg-stone-900/60">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Un seul dossier, de l&apos;inscription au retour</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Chaque étape franchie déclenche une notification et fait avancer votre barre de progression.</p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRESS_STEPS.map((s, i) => (
              <li key={s.key} className="card flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand-100 text-xl dark:bg-stone-800">{s.icon}</span>
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {t.step} {i + 1}
                  </div>
                  <div className="font-bold">{s.label}</div>
                  <div className="text-sm text-stone-500">{s.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <h2 className="text-3xl font-extrabold tracking-tight">{t.packages} et tarifs</h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">Prix tout compris, payables en 3 tranches maximum.</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.id}
              className={`card relative flex flex-col ${p.highlight ? "border-emerald-600 ring-2 ring-emerald-600 dark:border-emerald-500" : ""}`}
            >
              {p.highlight && <span className="chip absolute -top-3 start-5 bg-amber-400 text-stone-900">Le plus choisi</span>}
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-extrabold">{lang === "ar" ? p.nameAr : p.name}</h3>
                <span className="text-sm text-stone-500">{p.days} jours</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-emerald-800 dark:text-emerald-400">{gnf(p.price)}</div>
              <div className="text-sm text-stone-500">
                {t.perPerson} · soit 3 × {gnf(p.price / 3)}
              </div>
              <p className="mt-4 rounded-xl bg-sand-100 px-3 py-2 text-sm font-medium dark:bg-stone-800">🏨 {p.hotel}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/espace/inscription" : "/connexion"} className={`mt-6 w-full ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
                {t.choose}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Calendrier + actualités */}
      <section id="calendrier" className="scroll-mt-20 bg-white py-16 dark:bg-stone-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{t.calendar}</h2>
            <ol className="relative mt-8 space-y-6 border-s-2 border-emerald-200 ps-6 dark:border-emerald-900">
              {TIMELINE.map((e) => (
                <li key={e.label} className="relative">
                  <span className="absolute -start-[41px] grid size-8 place-items-center rounded-full bg-white text-base ring-2 ring-emerald-500 dark:bg-stone-900">{e.icon}</span>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{e.date}</div>
                  <div className="font-semibold">{e.label}</div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{t.news}</h2>
            <div className="mt-8 space-y-4">
              {NEWS.map((n) => (
                <article key={n.title} className="card">
                  <time className="text-xs font-semibold text-stone-500">{dateFr(n.date)}</time>
                  <h3 className="mt-1 font-bold">{n.title}</h3>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{n.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <h2 className="text-3xl font-extrabold tracking-tight">{t.faq}</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group cursor-pointer open:ring-2 open:ring-emerald-600/30">
              <summary className="flex list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand-100 text-lg transition group-open:rotate-45 dark:bg-stone-800">+</span>
              </summary>
              <p className="mt-3 text-stone-600 dark:text-stone-400">{f.a}</p>
              <ListenButton text={`${f.q} ${f.a}`} className="mt-3" />
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="pattern bg-emerald-900 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Phone className="mt-1 size-6 text-amber-300" />
            <div>
              <div className="font-bold">Centre d&apos;appel (gratuit)</div>
              <div className="text-emerald-100/80">Pular · Malinké · Soussou · Français</div>
              <div className="text-xl font-extrabold">1448</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 size-6 text-amber-300" />
            <div>
              <div className="font-bold">Guichets d&apos;inscription assistée</div>
              <div className="text-emerald-100/80">Dans les 33 préfectures et les 5 communes de Conakry</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-1 size-6 text-amber-300" />
            <div>
              <div className="font-bold">Secrétariat Général des Affaires Religieuses</div>
              <div className="text-emerald-100/80">contact@hadj2027.gov.gn (adresse de démonstration)</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
