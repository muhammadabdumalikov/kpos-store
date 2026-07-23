import Link from "next/link";
import Image from "next/image";

type CategoryCardProps = {
  id: string;
  name: string;
  image?: string | null;
};

export function CategoryCard({ id, name, image }: CategoryCardProps) {
  return (
    <Link
      href={`/catalog?category=${id}`}
      className="group flex w-full flex-col items-center"
    >
      <div className="relative mb-2 h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100 transition group-hover:ring-2 group-hover:ring-brand-300 dark:bg-gray-800">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-300 dark:text-gray-600">
            {name.slice(0, 1)}
          </span>
        )}
      </div>
      <span className="line-clamp-2 w-full max-w-[88px] text-center text-xs font-medium leading-snug text-gray-700 group-hover:text-brand-600 dark:text-gray-300 dark:group-hover:text-brand-400">
        {name}
      </span>
    </Link>
  );
}
