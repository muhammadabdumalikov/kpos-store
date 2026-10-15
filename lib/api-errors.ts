import { formatPrice } from "./format";
import { StoreApiError } from "./store-api";

/** Params the backend sends as money (so'm) and the UI prints as prices. */
const MONEY_PARAMS = new Set(["min", "expected", "total"]);

/**
 * Localize a failed store call the way the rest of the app does: the backend's
 * stable `code` maps to `apiErrors.<CODE>` in the message bundles, `{param}`
 * placeholders are filled from `params`. Codes without a translation fall back
 * to the backend's message, then to the caller's generic text.
 */
export function storeErrorMessage(
  err: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  if (err instanceof StoreApiError && err.code) {
    const key = `apiErrors.${err.code}`;
    const template = t(key);
    if (template !== key) {
      return template.replace(/\{(\w+)\}/g, (_, name: string) => {
        const value = err.params?.[name];
        if (value === undefined || value === null) return "";
        if (MONEY_PARAMS.has(name) && Number.isFinite(Number(value))) {
          return formatPrice(Math.round(Number(value)));
        }
        return String(value);
      });
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
