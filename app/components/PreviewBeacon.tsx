"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PREVIEW_MESSAGE, PREVIEW_PARAM } from "@/lib/theme-preview";

/**
 * Tells the dashboard that frames this page which theme it drew, and on every
 * page the owner opens, where they are. The picker waits for the first word
 * before it shows the frame: a storefront from before previews existed ignores
 * the parameter and would show the saved theme instead. With the address it
 * opens the next theme on the same page. The message carries a theme key and
 * the shop's own address and nothing else, so any parent may hear it.
 */
export function PreviewBeacon({ theme }: { theme: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    if (window.parent === window) return;
    const rest = new URLSearchParams(params);
    rest.delete(PREVIEW_PARAM);
    const qs = rest.toString();
    window.parent.postMessage({ type: PREVIEW_MESSAGE, theme, path: qs ? `${pathname}?${qs}` : pathname }, "*");
  }, [theme, pathname, params]);
  return null;
}
