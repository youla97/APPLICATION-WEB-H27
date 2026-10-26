import "server-only";
import { EventEmitter } from "node:events";

// Bus d'événements en mémoire pour le temps réel (SSE). En production : Redis Pub/Sub.
export type LiveEvent = { type: string; userId?: number; dossierId?: number; scope?: "staff" | "all" };

const g = globalThis as unknown as { __hadjBus?: EventEmitter };
export const bus = g.__hadjBus ?? (g.__hadjBus = new EventEmitter().setMaxListeners(1000));

export function emit(e: LiveEvent) {
  bus.emit("event", e);
}
