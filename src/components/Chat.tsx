"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendMessage } from "@/app/actions/pelerin";

type Msg = { id: number; from_admin: number; author: string; body: string; created_at: string };

export default function Chat({ dossierId, messages, staffView = false }: { dossierId: number; messages: Msg[]; staffView?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const mine = (m: Msg) => (staffView ? m.from_admin === 1 : m.from_admin === 0);

  return (
    <div className="flex flex-col">
      <div ref={ref} className="max-h-80 min-h-32 space-y-2 overflow-y-auto rounded-xl bg-sand-50 p-3 dark:bg-stone-950">
        {messages.length === 0 && <p className="py-6 text-center text-sm text-stone-500">{staffView ? "Aucun message avec ce pèlerin." : "Aucun message. Posez votre question à l'administration."}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${mine(m) ? "justify-end" : "justify-start"}`}>
            <div
              className={`animate-fade-up max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                mine(m) ? "rounded-ee-sm bg-emerald-700 text-white" : "rounded-es-sm bg-white shadow-sm dark:bg-stone-800"
              }`}
            >
              {!mine(m) && <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{m.author}</div>}
              {m.body}
              <div className={`mt-0.5 text-[10px] ${mine(m) ? "text-emerald-100" : "text-stone-400"}`}>
                {new Date(m.created_at.replace(" ", "T") + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = text;
          setText("");
          start(async () => {
            await sendMessage(dossierId, body);
            router.refresh();
            setTimeout(() => ref.current?.scrollTo({ top: 1e6, behavior: "smooth" }), 200);
          });
        }}
      >
        <input className="input" placeholder="Votre message…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        <button className="btn-primary px-4" disabled={pending || !text.trim()} aria-label="Envoyer">
          <Send className="size-5 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
}
