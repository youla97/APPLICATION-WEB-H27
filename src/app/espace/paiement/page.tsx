import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dossierOfUser, paidAmount, priceOf } from "@/lib/dossier";
import { pkgById } from "@/lib/data";
import { gnf } from "@/lib/format";
import PayForm from "@/components/PayForm";

export const metadata = { title: "Paiement" };

export default async function Page() {
  const user = await requireUser("pelerin");
  const d = dossierOfUser(user.id);
  const open = d && ["valide", "complet"].includes(d.status);
  const total = d ? priceOf(d) : 0;
  const remaining = d ? total - paidAmount(d.id) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/espace" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Mon espace</Link>
      <h1 className="mt-2 text-3xl font-extrabold">Payer mon Hadj</h1>
      {!open ? (
        <p className="card mt-6">⏳ Le paiement s&apos;ouvre dès que votre dossier est validé par l&apos;administration.</p>
      ) : remaining <= 0 ? (
        <p className="card mt-6 text-center text-lg font-semibold">✅ Votre Hadj est entièrement payé ({gnf(total)}). Qu&apos;Allah l&apos;accepte !</p>
      ) : (
        <>
          <p className="mt-1 text-stone-500">
            Package {pkgById(d.package_id)?.name} · total {gnf(total)} · dossier <span className="font-mono">{d.numero}</span>
          </p>
          <div className="mt-6">
            <PayForm numero={d.numero} remaining={remaining} total={total} payerDefault={d.full_name ?? ""} />
          </div>
        </>
      )}
    </div>
  );
}
