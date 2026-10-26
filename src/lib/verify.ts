import "server-only";
import { headers } from "next/headers";
import crypto from "node:crypto";
import { qrSvg } from "./qr";

// Signature HMAC courte : un QR code falsifié ne passe pas la vérification.
const SECRET = process.env.HADJ_QR_SECRET ?? "hadj2027-demo-secret";

export const sign = (payload: string) => crypto.createHmac("sha256", SECRET).update(payload).digest("base64url").slice(0, 10);

export const verifyCode = (kind: "R" | "B" | "F", id: string) => `${kind}.${id}.${sign(`${kind}.${id}`)}`;

export function checkCode(code: string) {
  const [kind, id, sig] = decodeURIComponent(code).split(".");
  if (!kind || !id || !sig || sign(`${kind}.${id}`) !== sig) return null;
  return { kind, id };
}

export async function verifyQr(kind: "R" | "B" | "F", id: string) {
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return qrSvg(`${origin}/verifier/${verifyCode(kind, id)}`);
}
