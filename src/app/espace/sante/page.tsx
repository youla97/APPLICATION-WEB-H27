import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dossierOfUser } from "@/lib/dossier";
import HealthForm from "./HealthForm";

export const metadata = { title: "Fiche santé" };

export default async function Page() {
  const user = await requireUser("pelerin");
  const d = dossierOfUser(user.id);
  if (!d || !["valide", "complet"].includes(d.status)) redirect("/espace");
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/espace" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Mon espace</Link>
      <h1 className="mt-2 text-3xl font-extrabold">Fiche santé 🩺</h1>
      <p className="mt-1 text-stone-500">Ces informations sont chiffrées et visibles uniquement par la mission médicale.</p>
      <HealthForm />
    </div>
  );
}
