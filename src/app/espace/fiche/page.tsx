import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dossierOfUser, parseData } from "@/lib/dossier";
import { pkgById, STATUS } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import { verifyQr } from "@/lib/verify";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";

export const metadata = { title: "Fiche d'inscription" };

export default async function Fiche() {
  const user = await requireUser("pelerin");
  const d = dossierOfUser(user.id);
  if (!d || d.status === "brouillon") redirect("/espace");
  const data = parseData(d);
  const pkg = pkgById(d.package_id);
  const qr = await verifyQr("F", d.numero);
  const rows: [string, unknown][] = [
    ["Nom complet", d.full_name],
    ["Sexe", data.sex === "F" ? "Femme" : "Homme"],
    ["Date de naissance", dateFr(d.birth_date)],
    ["Lieu de naissance", data.birthPlace],
    ["Adresse", data.address],
    ["Téléphone", `+224 ${user.phone}`],
    ["Passeport", `${d.passport_no} (exp. ${dateFr(String(data.passportExpiry))})`],
    ["Région", d.region],
    ["Package", `${pkg?.name} · ${gnf(pkg?.price ?? 0)}`],
    ["Personne à prévenir", `${data.emergencyName} (${data.emergencyRelation || "—"}) · ${data.emergencyPhone}`],
    ["Déposé le", dateFr(d.submitted_at, true)],
    ["Statut", STATUS[d.status]?.label],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/espace" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Mon espace</Link>
        <PrintButton />
      </div>
      <article className="card p-0 text-stone-900 dark:bg-white">
        <div className="flag-bar h-1.5" />
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 p-6">
          <div className="flex items-center gap-3">
            <Logo className="size-12" />
            <div>
              <h1 className="text-lg font-extrabold">Fiche d&apos;inscription · Hadj 2027</h1>
              <p className="font-mono text-sm">{d.numero}</p>
            </div>
          </div>
          <div className="size-24" dangerouslySetInnerHTML={{ __html: qr }} />
        </header>
        <div className="flex gap-6 p-6">
          {d.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photo} alt="" className="h-36 w-28 shrink-0 rounded-lg object-cover ring-1 ring-stone-200" />
          )}
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stone-500">{k}</dt>
                <dd className="font-semibold">{String(v ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="border-t border-stone-200 p-6 text-xs text-stone-500">
          Document généré par la plateforme Hadj 2027 Guinée. Son authenticité se vérifie en scannant le QR code.
        </p>
      </article>
    </div>
  );
}
