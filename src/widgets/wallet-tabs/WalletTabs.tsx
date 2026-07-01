import type { WalletId } from "../../entities/wallet/model";
import { WALLET_LABELS } from "../../shared/config/constants";
import "./WalletTabs.css";

type WalletTabsProps = {
  value: WalletId;
  onChange: (walletId: WalletId) => void;
};

const walletIds: WalletId[] = ["junhyun", "byunghun"];

export function WalletTabs({ value, onChange }: WalletTabsProps) {
  return (
    <nav className="wallet-tabs" aria-label="지갑 선택">
      {walletIds.map((walletId) => (
        <button
          key={walletId}
          className={`wallet-tab ${value === walletId ? "wallet-tab-active" : ""}`}
          onClick={() => onChange(walletId)}
        >
          {WALLET_LABELS[walletId]}
        </button>
      ))}
    </nav>
  );
}
