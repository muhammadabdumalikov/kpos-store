"use client";

import { useEffect } from "react";
import { PREVIEW_MESSAGE } from "@/lib/theme-preview";

/**
 * Tells the dashboard that frames this page which theme it drew. The picker
 * waits for it before it shows the frame: a storefront from before previews
 * existed ignores the parameter and would show the saved theme instead.
 * The message carries a theme key and nothing else, so any parent may hear it.
 */
export function PreviewBeacon({ theme }: { theme: string }) {
  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: PREVIEW_MESSAGE, theme }, "*");
  }, [theme]);
  return null;
}
