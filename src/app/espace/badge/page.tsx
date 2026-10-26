import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dossierOfUser, parseData } from "@/lib/dossier";
import { verifyQr } from "@/lib/verify";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";

export const metadata = { title: "Badge pèlerin" };

export default async function Badge() {
  const user = await requireUser("pelerin");
  const d = dossierOfUser(user.id);
  if (!d || d.status !== "complet") redirect("/espace");
  const data = parseData(d);
  const qr = await verifyQr("B", d.numero);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/espace" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Mon espace</Link>
        <PrintButton label="Imprimer" />
      </div>
      <article className="animate-pop overflow-hidden rounded-3xl bg-white text-stone-900 shadow-2xl ring-1 ring-stone-200">
        <div className="pattern bg-gradient-to-br from-emerald-800 to-emerald-950 px-5 pt-5 pb-14 text-white">
          <div className="flex items-center gap-3">
            <Logo className="size-11" />
            <div>
              <div className="font-extrabold">HADJ 2027 · 1448 H</div>
              <div className="text-xs text-emerald-100/80">République de Guinée · بطاقة الحاج</div>
            </div>
          </div>
        </div>
        <div className="-mt-11 px-5">
          <div className="flex items-end gap-4">
            {d.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.photo} alt="" className="size-24 rounded-2xl object-cover ring-4 ring-white" />
            ) : (
              <div className="grid size-24 place-items-center rounded-2xl bg-sand-200 text-4xl ring-4 ring-white">🧑</div>
            )}
            <div className="pb-1">
              <div className="text-xl leading-tight font-extrabold">{d.full_name}</div>
              <div className="font-mono text-sm text-stone-500">{d.numero}</div>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Passeport", d.passport_no],
              ["Groupe", d.group_name],
              ["Vol", d.flight],
              ["Bus", d.bus],
              ["La Mecque", d.hotel_mecque],
              ["Médine", d.hotel_medine],
              ["Mina", d.tente],
              ["Urgence", `${data.emergencyName ?? ""} · ${data.emergencyPhone ?? ""}`],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-sand-50 p-2.5">
                <dt className="text-[11px] font-semibold text-stone-500 uppercase">{k}</dt>
                <dd className="font-semibold leading-snug">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="my-5 flex items-center gap-4 rounded-2xl border-2 border-dashed border-emerald-200 p-3">
            <div className="size-28 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="text-sm text-stone-600">
              En cas de besoin, montrez ce QR code à un encadreur ou à la police : il permet de retrouver votre groupe et votre hôtel.
              <br />
              <b>Mission médicale : +966 5 00 00 00 00</b>
            </p>
          </div>
        </div>
        <div className="flag-bar h-2" />
      </article>
    </div>
  );
}
