import { Platform } from "react-native";

export function buildInviteUrl(token: string) {
  const path = `/invite/${encodeURIComponent(token)}`;

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  return `animalcare://${path.replace(/^\//, "")}`;
}

export async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error("Clipboard copy is not available on this platform.");
}
