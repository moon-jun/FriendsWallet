import { AuthProvider } from "./providers/AuthProvider";
import { WalletPage } from "../pages/wallet/WalletPage";
import { Snowfall } from "../shared/ui/Snowfall";

export function App() {
  return (
    <>
      <Snowfall />
      <AuthProvider>
        <WalletPage />
      </AuthProvider>
    </>
  );
}
