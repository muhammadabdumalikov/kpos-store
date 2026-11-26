/**
 * Copy text to the clipboard from a tap. The async Clipboard API first; where
 * it is missing or refused (older Android WebViews, some in-app browsers, a
 * page not on https) the selection-based `execCommand` still works inside a
 * user gesture. Resolves to whether the text was copied.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refused: fall through to the selection-based copy.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  // Off-screen but focusable; 16px so iOS does not zoom the page on focus.
  area.style.cssText =
    "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;pointer-events:none";
  document.body.appendChild(area);
  const active = document.activeElement as HTMLElement | null;
  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    active?.focus?.({ preventScroll: true });
  }
}
