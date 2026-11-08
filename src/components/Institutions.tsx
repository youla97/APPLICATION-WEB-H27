import Image from "next/image";
import { IMAGES } from "@/lib/images";

/** Bandeau institutionnel : République de Guinée et Programme Simandou 2040. */
export default function Institutions() {
  return (
    <section className="border-t border-stone-200 bg-white py-10 dark:border-stone-800 dark:bg-stone-900" aria-label="Institutions">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          <Image src={IMAGES.armoiries.src} alt={IMAGES.armoiries.alt} width={285} height={320} className="h-20 w-auto" />
          <div>
            <div className="text-lg font-extrabold">République de Guinée</div>
            <div className="text-sm font-semibold tracking-wide text-stone-500">Travail · Justice · Solidarité</div>
            <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">Secrétariat Général des Affaires Religieuses · COGEP</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="max-w-56 text-end text-sm text-stone-600 max-md:hidden dark:text-stone-400">
            Une plateforme numérique au service des citoyens, dans l&apos;esprit du
          </p>
          <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200 dark:ring-stone-700">
            <Image src={IMAGES.simandou.src} alt={IMAGES.simandou.alt} width={600} height={244} className="h-16 w-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
