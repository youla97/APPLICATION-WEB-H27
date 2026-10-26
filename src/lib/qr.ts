import "server-only";
import QRCode from "qrcode";

export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", margin: 1, color: { dark: "#064e3b", light: "#ffffff" } });
}
