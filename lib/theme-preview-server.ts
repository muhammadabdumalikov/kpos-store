import { headers } from "next/headers";
import { PREVIEW_HEADER, previewThemeKey } from "./theme-preview";

/** The theme this request previews, or null for an ordinary visit (proxy.ts sets the header). */
export async function getThemePreview(): Promise<string | null> {
  const h = await headers();
  return previewThemeKey(h.get(PREVIEW_HEADER));
}
