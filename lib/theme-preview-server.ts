import { headers } from "next/headers";
import { PREVIEW_HEADER, previewThemeKey } from "./theme-preview";

/**
 * The theme this request previews, or null for an ordinary visit. Only the
 * home page can be previewed: proxy.ts sets the header for "/" alone.
 */
export async function getThemePreview(): Promise<string | null> {
  const h = await headers();
  return previewThemeKey(h.get(PREVIEW_HEADER));
}
