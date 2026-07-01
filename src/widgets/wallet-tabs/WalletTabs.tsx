import type { WalletId } from "../../entities/wallet/model";
import { WALLET_LABELS } from "../../shared/config/constants";
import "./WalletTabs.css";

export type TabValue = WalletId | "active-bets";

type WalletTabsProps = {
  value: TabValue;
  onChange: (tab: TabValue) => void;
  activeBetCount?: number;
};

const walletIds: WalletId[] = ["junhyun", "byunghun"];

export function WalletTabs({ value, onChange, activeBetCount = 0 }: WalletTabsProps) {
  return (
    <nav className="wallet-tabs-container" aria-label="탭 선택">
      <button
        className={`active-bets-tab ${value === "active-bets" ? "active-bets-tab-active" : ""}`}
        onClick={() => onChange("active-bets")}
      >
        🏆 현재 진행경기
        {activeBetCount > 0 && <span className="bet-count-badge">{activeBetCount}</span>}
      </button>
      <div className="wallet-tabs">
        {walletIds.map((walletId) => (
          <button
            key={walletId}
            className={`wallet-tab ${value === walletId ? "wallet-tab-active" : ""}`}
            onClick={() => onChange(walletId)}
          >
            {WALLET_LABELS[walletId]}
          </button>
        ))}
      </div>
    </nav>
  );
}
