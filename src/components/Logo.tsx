import Image from "next/image";
import { IMAGES } from "@/lib/images";

/** Armoiries de la République de Guinée, en tête des documents officiels (reçu, fiche, badge). */
export default function Logo({ className = "" }: { className?: string }) {
  return <Image src={IMAGES.armoiries.src} alt={IMAGES.armoiries.alt} width={285} height={320} className={`object-contain ${className}`} />;
}
