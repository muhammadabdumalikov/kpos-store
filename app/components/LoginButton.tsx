"use client";

import { useAuthDrawer } from "./AuthDrawerContext";

type LoginButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

export function LoginButton({ className, children = "Kirish", ...rest }: LoginButtonProps) {
  const { openLogin } = useAuthDrawer();
  return (
    <button type="button" onClick={openLogin} className={className} {...rest}>
      {children}
    </button>
  );
}
