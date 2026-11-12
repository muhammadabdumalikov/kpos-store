import { AuthDrawerProvider } from "../../components/AuthDrawerContext";
import { DesktopFooter } from "../../components/DesktopFooter";
import { DesktopHeader } from "../../components/DesktopHeader";
import { MobileNav } from "../../components/MobileNav";
import { ProductNotFound } from "../../components/ProductNotFound";
import { getStoreInfo, type StoreInfo } from "../../../lib/store-api";
import { getStoreSlugServer } from "../../../lib/store-slug-server";

/** A missing product inside the shop's own shell, not the framework's 404. */
export default async function ProductNotFoundPage() {
  const slug = await getStoreSlugServer();
  const info: StoreInfo | null = await getStoreInfo(slug).catch(() => null);

  return (
    <AuthDrawerProvider>
      <DesktopHeader store={info} />
      <main className="mx-auto max-w-7xl px-4 pb-[calc(var(--nav-total)_+_24px)] lg:min-h-[70vh] lg:pb-16">
        <ProductNotFound />
      </main>
      <MobileNav />
      <DesktopFooter store={info} />
    </AuthDrawerProvider>
  );
}
