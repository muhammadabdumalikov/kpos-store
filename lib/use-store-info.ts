"use client";

import { useSyncExternalStore } from "react";
import { fetchStoreInfo, type StoreInfo } from "./store-api";
import { getStoreSlugClient } from "./store-slug";

// The shop's name and pickup branch for the shared header and footer. Pages
// that fetch store info on the server pass it down; the rest (the client-only
// cart and orders pages) read it here, fetched once per page load.

let cached: StoreInfo | null = null;
let inflight = false;
const listeners = new Set<() => void>();

function load(): void {
  if (cached || inflight) return;
  inflight = true;
  fetchStoreInfo(getStoreSlugClient())
    .then((info) => {
      cached = info;
      for (const l of listeners) l();
    })
    .catch(() => {
      // The header simply shows no shop name; nothing to retry here.
    })
    .finally(() => {
      inflight = false;
    });
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  load();
  return () => {
    listeners.delete(onChange);
  };
}

const noSubscribe = () => () => {};

/** `initial` (from the server) wins; without it the info is fetched client-side. */
export function useStoreInfo(initial?: StoreInfo | null): StoreInfo | null {
  const live = useSyncExternalStore(
    initial ? noSubscribe : subscribe,
    () => cached,
    () => null
  );
  return initial ?? live;
}
