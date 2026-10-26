import { getUser } from "@/lib/auth";
import { bus, type LiveEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

// Flux temps réel (Server-Sent Events) : statut du dossier, paiements, alertes SOS…
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return new Response("Non authentifié", { status: 401 });
  const staff = user.role !== "pelerin";
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (e: LiveEvent) => {
        const relevant = staff ? e.scope === "staff" || e.scope === "all" : e.userId === user.id;
        if (relevant) controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: e.type })}\n\n`));
      };
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 20000);
      bus.on("event", send);
      controller.enqueue(enc.encode("retry: 3000\n\n"));
      cleanup = () => {
        clearInterval(ping);
        bus.off("event", send);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
