import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { WalletId } from "../../entities/wallet/model";

type AuthContextValue = {
  authenticatedWallet: WalletId | null;
  authenticate: (walletId: WalletId) => void;
  signOut: () => void;
  canEdit: (walletId: WalletId) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticatedWallet, setAuthenticatedWallet] = useState<WalletId | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticatedWallet,
      authenticate: setAuthenticatedWallet,
      signOut: () => setAuthenticatedWallet(null),
      canEdit: (walletId) => authenticatedWallet === walletId,
    }),
    [authenticatedWallet],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
