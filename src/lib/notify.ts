import "server-only";
import { run } from "./db";
import { emit } from "./events";

/** Notification multicanal simulée : l'envoi SMS/WhatsApp passerait par l'agrégateur local. */
export function notify(userId: number, title: string, body: string, channels: ("sms" | "app" | "whatsapp")[] = ["sms", "app"]) {
  for (const c of channels) {
    run("INSERT INTO notifications (user_id, channel, title, body) VALUES (?,?,?,?)", userId, c, title, body);
  }
  emit({ type: "notification", userId });
}
