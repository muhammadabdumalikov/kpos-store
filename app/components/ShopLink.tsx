"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { usePreviewHref } from "@/context/StoreThemeContext";

/**
 * next/link for the shop's own pages (eslint keeps next/link to this file).
 * In the dashboard's theme preview (lib/theme-preview) every page it opens
 * stays in the theme being tried on; on an ordinary visit it is next/link.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const keep = usePreviewHref();
  return <NextLink href={typeof href === "string" ? keep(href) : href} {...props} />;
}
