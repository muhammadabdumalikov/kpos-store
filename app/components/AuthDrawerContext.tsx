"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { LoginDrawer } from "./LoginDrawer";
import { PolicyDrawer } from "./PolicyDrawer";

type AuthDrawerContextValue = {
  openLogin: () => void;
  openPolicy: () => void;
};

const AuthDrawerContext = createContext<AuthDrawerContextValue | null>(null);

export function useAuthDrawer() {
  const ctx = useContext(AuthDrawerContext);
  if (!ctx) return { openLogin: () => {}, openPolicy: () => {} };
  return ctx;
}

export function AuthDrawerProvider({ children }: { children: React.ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const openPolicy = useCallback(() => {
    setLoginOpen(false);
    setPolicyOpen(true);
  }, []);

  return (
    <AuthDrawerContext.Provider value={{ openLogin, openPolicy }}>
      {children}
      <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} onPolicyClick={openPolicy} />
      <PolicyDrawer open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </AuthDrawerContext.Provider>
  );
}
