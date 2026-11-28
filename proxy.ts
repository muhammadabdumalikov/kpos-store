import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_HEADER, PREVIEW_PARAM, previewThemeKey } from "./lib/theme-preview";

/**
 * Theme preview (lib/theme-preview): a root layout cannot read the query
 * string, so `?preview_theme=<key>` is handed to it, and to the page, as a
 * request header. The header is always rewritten here — a visitor cannot send
 * their own.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const key = previewThemeKey(request.nextUrl.searchParams.get(PREVIEW_PARAM));
  if (key) headers.set(PREVIEW_HEADER, key);
  else headers.delete(PREVIEW_HEADER);
  return NextResponse.next({ request: { headers } });
}

// Every page of the shop; not Next's own files, nor anything with a file
// extension (pictures, icons, robots.txt).
export const config = { matcher: "/((?!_next/|.*\\.).*)" };
