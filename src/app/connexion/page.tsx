import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { ROLES, DEMO_ACCOUNTS } from "@/lib/data";
import LoginForm from "./LoginForm";

export const metadata = { title: "Connexion" };

export default async function Page() {
  const user = await getUser();
  if (user) redirect(ROLES[user.role]?.home ?? "/espace");
  const { t } = await getT();
  return (
    <div className="pattern-light min-h-[calc(100dvh-68px)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <LoginForm
          t={{ phone: t.phone, sendCode: t.sendCode, code: t.code, verify: t.verify, back: t.back, login: t.login }}
          demo={DEMO_ACCOUNTS.map((a) => ({ phone: a.phone, label: ROLES[a.role].label }))}
        />
      </div>
    </div>
  );
}
