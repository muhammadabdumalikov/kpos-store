import { AuthDrawerProvider } from "../../components/AuthDrawerContext";
import { DesktopHeader } from "../../components/DesktopHeader";
import { MobileNav } from "../../components/MobileNav";
import { ProductSkeleton } from "../../components/ProductSkeleton";

/** Shown at once on a tap from a list while the product is fetched. */
export default function ProductLoading() {
  return (
    <AuthDrawerProvider>
      <DesktopHeader />
      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:pb-16">
        <ProductSkeleton />
      </main>
      <MobileNav />
    </AuthDrawerProvider>
  );
}
