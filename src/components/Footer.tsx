import Link from "next/link";

export default function Footer() {
  return (
    <footer className="no-print border-t border-stone-200 bg-white py-8 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <p>© 2026 Hadj 2027 Guinée · SGAR / COGEP — prototype de démonstration</p>
        <nav className="flex gap-4">
          <Link href="/verifier" className="hover:text-emerald-700">Vérifier un document</Link>
          <Link href="/accompagnement" className="hover:text-emerald-700">Guide du Hadj</Link>
          <Link href="/payer" className="hover:text-emerald-700">Payer pour un proche</Link>
        </nav>
      </div>
    </footer>
  );
}
