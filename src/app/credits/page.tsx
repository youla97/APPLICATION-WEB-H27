import Image from "next/image";
import { IMAGES } from "@/lib/images";
import Footer from "@/components/Footer";

export const metadata = { title: "Crédits des images" };

export default function Credits() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Crédits des images</h1>
        <p className="mt-2 text-stone-500">
          Les photographies proviennent de Wikimedia Commons sous licence libre ; les logos proviennent des kits officiels.
        </p>
        <ul className="mt-8 space-y-4">
          {Object.values(IMAGES).map((img) => (
            <li key={img.src} className="card flex items-center gap-4">
              <Image src={img.src} alt={img.alt} width={160} height={110} className="h-20 w-28 shrink-0 rounded-xl bg-sand-100 object-contain" />
              <div className="text-sm">
                <div className="font-bold">{img.caption}</div>
                <div className="text-stone-600 dark:text-stone-400">
                  {img.author} · {img.license}
                </div>
                <a href={img.source} target="_blank" rel="noreferrer" className="text-emerald-700 underline dark:text-emerald-400">
                  Source
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </>
  );
}
