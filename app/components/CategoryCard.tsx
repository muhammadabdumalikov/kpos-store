"use client";

import Link from "next/link";
import { useState } from "react";
import { GridIcon } from "./icons/ShopIcons";

type CategoryCardProps = {
  id: string;
  name: string;
  image?: string | null;
};

/**
 * Category photo tile with the name under it, the same tile treatment as a
 * product photo. Plain <img>, not next/image: a category image on a host the
 * Next config does not list would otherwise take the whole page down.
 */
export function CategoryCard({ id, name, image }: CategoryCardProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(image) && !broken;

  return (
    <Link
      href={`/catalog?category=${encodeURIComponent(id)}`}
      className="group flex w-full flex-col items-center rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
    >
      <span
        className={`relative block aspect-square w-full overflow-hidden rounded-[20px] ${
          showImage ? "bg-gray-900/[0.035] dark:bg-gray-200" : "bg-gray-900/[0.035] dark:bg-white/[0.04]"
        }`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover mix-blend-multiply motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gray-900/25 dark:text-white/25">
            <GridIcon className="h-7 w-7" strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="mt-2 line-clamp-2 w-full break-words text-center text-[13px] font-medium leading-4 text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
        {name}
      </span>
    </Link>
  );
}
