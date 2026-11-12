// Plain module (not "use client") so the server page can read the values:
// a constant exported from a client module reaches the server as a reference.
// "new" is the backend's own order (in stock first, then newest); it is the
// default. Old links with sort=popular fall back to it.
export const SORT_VALUES = ["new", "price_asc", "price_desc"] as const;
export const DEFAULT_SORT = "new";
export type SortValue = (typeof SORT_VALUES)[number];
