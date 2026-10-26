"use client";
import { Printer } from "lucide-react";

export default function PrintButton({ label = "Télécharger en PDF / imprimer" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary no-print">
      <Printer className="size-5" /> {label}
    </button>
  );
}
