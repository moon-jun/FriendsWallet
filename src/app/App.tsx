import { AuthProvider } from "./providers/AuthProvider";
import { WalletPage } from "../pages/wallet/WalletPage";

export function App() {
  return (
    <AuthProvider>
      <WalletPage />
    </AuthProvider>
  );
}
