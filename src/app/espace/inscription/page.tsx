import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { dossierOfUser, parseData } from "@/lib/dossier";
import { PACKAGES, REGIONS } from "@/lib/data";
import Wizard from "./Wizard";

export const metadata = { title: "Inscription" };

export default async function Page() {
  const user = await requireUser("pelerin");
  const { t, lang } = await getT();
  const d = dossierOfUser(user.id);
  if (d && !["brouillon", "rejete"].includes(d.status)) redirect("/espace");
  return (
    <Wizard
      t={t}
      lang={lang}
      initial={parseData(d)}
      initialStep={d?.status === "rejete" ? 5 : (d?.step ?? 1)}
      photo={d?.photo ?? null}
      numero={d?.numero ?? null}
      rejection={d?.status === "rejete" ? d.rejection_reason : null}
      regions={[...REGIONS]}
      packages={PACKAGES}
      phone={user.phone}
    />
  );
}
