"use client";

import { useRouter } from "next/navigation";
import { addToCart } from "../../lib/cart-store";

type Props = {
  productId: string;
  qty?: number;
  children: React.ReactNode;
  className?: string;
  /** If true, navigate to /cart after adding. Default true. */
  goToCart?: boolean;
  /** Out-of-stock guard: renders the button inert. */
  disabled?: boolean;
};

export function AddToCartButton({
  productId,
  qty = 1,
  children,
  className,
  goToCart = true,
  disabled = false,
}: Props) {
  const router = useRouter();

  function handleClick() {
    addToCart(productId, qty);
    if (goToCart) router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
