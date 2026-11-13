"use client";
/* eslint-disable @next/next/no-img-element -- banners come straight from S3 at their stored size */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import type { StoreBanner } from "@/lib/store-api";
import { ChevronRightIcon } from "./icons/ShopIcons";

const ROTATE_MS = 5000;

/**
 * The banners at the top of the home page (set under Settings → Online store
 * in the dashboard). One banner is a still picture; several are a swipeable
 * strip that also moves on by itself every few seconds — paused while the
 * shopper touches, hovers or tabs into it, while the tab is hidden, and never
 * for someone who asked for reduced motion. The whole banner is the link.
 *
 * The face (scrim + title + line + button, sized in container units) is the
 * same as the dashboard's BannerFace, so what the owner previewed is what
 * shows here: 2:1 on a phone, cropped to 3:1 on a wide screen.
 */
export function BannerCarousel({ banners }: { banners: StoreBanner[] }) {
  const { t } = useTranslations();
  const stripRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = banners.length > 1;

  const goTo = useCallback(
    (next: number) => {
      const strip = stripRef.current;
      if (!strip) return;
      const target = ((next % banners.length) + banners.length) % banners.length;
      strip.scrollTo({ left: target * strip.clientWidth, behavior: "smooth" });
    },
    [banners.length],
  );

  // The strip is the truth: whichever slide is in view is the current one,
  // whether the shopper swiped, tapped a dot or the timer moved it.
  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    setIndex(Math.round(strip.scrollLeft / strip.clientWidth));
  };

  useEffect(() => {
    if (!many || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (!document.hidden) goTo(index + 1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [many, paused, index, goTo]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      className="group/banners relative mt-3 lg:mt-6"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={stripRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[24px] lg:rounded-[28px]"
      >
        {banners.map((banner, i) => (
          <Slide key={banner.id} banner={banner} first={i === 0} />
        ))}
      </div>

      {many && (
        <>
          {/* Arrows: pointer devices only, shown on hover. */}
          {([-1, 1] as const).map((by) => (
            <button
              key={by}
              type="button"
              aria-label={by < 0 ? t("home.bannerPrev") : t("home.bannerNext")}
              onClick={() => goTo(index + by)}
              className={`absolute top-[calc(50%-12px)] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 opacity-0 outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-500/60 group-hover/banners:opacity-100 lg:flex ${
                by < 0 ? "left-3" : "right-3"
              }`}
            >
              <ChevronRightIcon className={`h-5 w-5 ${by < 0 ? "rotate-180" : ""}`} />
            </button>
          ))}

          {/* The pill is 6px tall; the button around it is a 28px tap target. */}
          <div className="mt-1 flex justify-center">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={t("home.bannerNth").replace("{n}", String(i + 1))}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="group/dot flex h-7 items-center px-1 outline-none"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-200 group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-brand-500/60 ${
                    i === index
                      ? "w-5 bg-gray-900 dark:bg-white"
                      : "w-1.5 bg-gray-900/25 group-hover/dot:bg-gray-900/45 dark:bg-white/30 dark:group-hover/dot:bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Slide({ banner, first }: { banner: StoreBanner; first: boolean }) {
  const hasText = Boolean(banner.title || banner.subtitle || banner.buttonLabel);
  const face = (
    <div className="relative aspect-[2/1] w-full overflow-hidden bg-gray-100 [container-type:inline-size] dark:bg-gray-800 lg:aspect-[3/1]">
      <img
        src={banner.image}
        alt={banner.title ?? ""}
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : "auto"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {hasText && (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0) 76%)",
            }}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[64%] flex-col justify-center text-white"
            style={{ padding: "0 0 0 5cqw", gap: "1.6cqw" }}
          >
            {banner.title && (
              <p
                className="line-clamp-2 font-bold leading-[1.12] tracking-[-0.01em]"
                style={{ fontSize: "clamp(11px, 5.4cqw, 46px)" }}
              >
                {banner.title}
              </p>
            )}
            {banner.subtitle && (
              <p
                className="line-clamp-2 font-medium leading-snug text-white/90"
                style={{ fontSize: "clamp(8px, 3cqw, 22px)" }}
              >
                {banner.subtitle}
              </p>
            )}
            {banner.buttonLabel && (
              <span
                className="inline-flex w-fit items-center rounded-full bg-white font-semibold text-gray-900"
                style={{
                  fontSize: "clamp(8px, 2.7cqw, 16px)",
                  padding: "1.3cqw 3.2cqw",
                  marginTop: "0.6cqw",
                }}
              >
                {banner.buttonLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  const frame =
    "block w-full shrink-0 snap-start snap-always outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/70";
  const { type, value } = banner.link;
  if (type === "product" && value) {
    return (
      <Link href={`/products/${encodeURIComponent(value)}`} className={frame}>
        {face}
      </Link>
    );
  }
  if (type === "category" && value) {
    return (
      <Link href={`/catalog?category=${encodeURIComponent(value)}`} className={frame}>
        {face}
      </Link>
    );
  }
  if (type === "url" && value) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className={frame}>
        {face}
      </a>
    );
  }
  return <div className={frame}>{face}</div>;
}
