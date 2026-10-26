import Link from "next/link";
import { Menu, LogOut, UserRound } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { ROLES } from "@/lib/data";
import { logout } from "@/app/actions/auth";
import Prefs from "./Prefs";
import Logo from "./Logo";

const STAFF_LINKS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Pilotage" },
    { href: "/admin/dossiers", label: "Dossiers" },
    { href: "/admin/paiements", label: "Paiements" },
    { href: "/admin/parametres", label: "Quotas & agences" },
    { href: "/admin/audit", label: "Audit" },
    { href: "/encadreur", label: "Terrain" },
  ],
  agent: [
    { href: "/agent", label: "Inscription assistée" },
    { href: "/admin/dossiers", label: "Dossiers" },
  ],
  medecin: [{ href: "/medecin", label: "Mission médicale" }],
  encadreur: [
    { href: "/encadreur", label: "Mon groupe" },
    { href: "/accompagnement", label: "Rites" },
  ],
  agence: [{ href: "/agence", label: "Mes pèlerins" }],
};

export default async function Header() {
  const [user, { lang, t }] = await Promise.all([getUser(), getT()]);
  const links =
    user && user.role !== "pelerin"
      ? (STAFF_LINKS[user.role] ?? [])
      : user
        ? [
            { href: "/espace", label: t.mySpace },
            { href: "/espace/paiement", label: t.payments },
            { href: "/accompagnement", label: t.rites },
            { href: "/#faq", label: t.faq },
          ]
        : [
            { href: "/#packages", label: t.packages },
            { href: "/#calendrier", label: t.calendar },
            { href: "/accompagnement", label: t.guide },
            { href: "/#faq", label: t.faq },
            { href: "/payer", label: t.payForRelative },
          ];

  return (
    <header className="no-print sticky top-0 z-40 bg-emerald-900/95 text-white backdrop-blur supports-[backdrop-filter]:bg-emerald-900/85">
      <div className="flag-bar h-1" />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href={user ? (ROLES[user.role]?.home ?? "/") : "/"} className="flex items-center gap-2.5 font-bold">
          <Logo className="size-9" />
          <span className="leading-tight">
            <span className="block text-[15px]">{t.appName}</span>
            <span className="block text-[11px] font-medium text-emerald-200/90">{user && user.role !== "pelerin" ? ROLES[user.role].label : "1448 H"}</span>
          </span>
        </Link>
        <nav className="ms-6 hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-emerald-50/90 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <Prefs lang={lang} labels={{ textSize: t.textSize, darkMode: t.darkMode, language: t.language }} />
          {user ? (
            <form action={logout} className="hidden sm:block">
              <button className="ms-1 flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-white/10" title={t.logout}>
                <LogOut className="size-4" /> <span className="hidden md:inline">{t.logout}</span>
              </button>
            </form>
          ) : (
            <Link href="/connexion" className="ms-1 hidden h-10 items-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-bold text-stone-900 transition hover:bg-amber-300 sm:flex">
              <UserRound className="size-4" /> {t.login}
            </Link>
          )}
          <details className="group relative xl:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg hover:bg-white/10 [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="size-6" />
            </summary>
            <div className="animate-pop absolute end-0 top-12 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 text-stone-800 shadow-2xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 font-medium hover:bg-emerald-50 dark:hover:bg-stone-800">
                  {l.label}
                </Link>
              ))}
              <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
              {user ? (
                <form action={logout}>
                  <button className="w-full rounded-xl px-4 py-3 text-start font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-stone-800">{t.logout}</button>
                </form>
              ) : (
                <Link href="/connexion" className="block rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-stone-900">
                  {t.login}
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
