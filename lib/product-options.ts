// Plain module (not "use client"): the server page normalises a product's
// option groups with it, the cart and the checkout share the choice shape.

/** One choice group on a product card: "Oʼlcham" → 39, 40, 41. */
export type OptionGroup = { name: string; values: string[] };

/** What the shopper picked from one group; travels in `items[].options`. */
export type OptionChoice = { name: string; value: string };

/** The checkout contract: at most three choices, each side at most 40 chars. */
const MAX_CHOICES = 3;
const MAX_LENGTH = 40;
/** A card holds at most 30 values per group. */
const MAX_VALUES = 30;

const clip = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, MAX_LENGTH) : "";

/**
 * A product's option groups as the page can use them: unnamed or empty groups
 * dropped, values trimmed and de-duplicated, everything inside the limits the
 * checkout accepts. Anything that is not a list of groups is "no options".
 */
export function optionGroups(raw: unknown): OptionGroup[] {
  if (!Array.isArray(raw)) return [];
  const groups: OptionGroup[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { name, values } = item as { name?: unknown; values?: unknown };
    const groupName = clip(name);
    if (!groupName || !Array.isArray(values)) continue;
    if (groups.some((g) => g.name === groupName)) continue;
    const clean = [...new Set(values.map(clip).filter(Boolean))].slice(0, MAX_VALUES);
    if (clean.length > 0) groups.push({ name: groupName, values: clean });
    if (groups.length === MAX_CHOICES) break;
  }
  return groups;
}

/**
 * Choices read back from storage or about to be sent: only complete pairs,
 * inside the checkout limits. Undefined when nothing valid is left, so a line
 * without choices stays a plain `{ id, qty }` line.
 */
export function cleanChoices(raw: unknown): OptionChoice[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const choices: OptionChoice[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { name, value } = item as { name?: unknown; value?: unknown };
    const choice = { name: clip(name), value: clip(value) };
    if (choice.name && choice.value) choices.push(choice);
    if (choices.length === MAX_CHOICES) break;
  }
  return choices.length > 0 ? choices : undefined;
}

/** "Oʼlcham: 41 · Rang: qora" — the choices under a line's name. */
export function choicesText(choices: OptionChoice[] | undefined): string {
  return (choices ?? []).map((c) => `${c.name}: ${c.value}`).join(" · ");
}
