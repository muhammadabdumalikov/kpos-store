"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import {
  activeTrackingIds,
  isTrackingReady,
  setupTracking,
  subscribeTracking,
  trackPageView,
  trackerScriptSrcs,
  type TrackingIds,
} from "@/lib/tracking";

/**
 * The shop's ad trackers (REKLAMA-KUZATUV.md), mounted once in the root
 * layout. Renders nothing visible. With no id configured nothing third-party
 * loads at all (R11).
 *
 * Setup runs in a layout effect, so the trackers are switched on before any
 * page's own effects send an event; the libraries load only after that, and
 * only for ids that passed their strict check (lib/tracking).
 */
export function Tracking({ ids }: { ids: TrackingIds }) {
  const { ga, gtm, metaPixel, yandexMetrika } = ids;
  useLayoutEffect(() => {
    setupTracking({ ga, gtm, metaPixel, yandexMetrika });
  }, [ga, gtm, metaPixel, yandexMetrika]);
  const ready = useSyncExternalStore(subscribeTracking, isTrackingReady, () => false);
  if (!ready) return null;

  return (
    <>
      {trackerScriptSrcs(activeTrackingIds()).map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
      {/* useSearchParams needs a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}

/** One page view for the first load and for each client-side navigation. */
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    trackPageView(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);
  return null;
}
