import type { WalletId } from "../../entities/wallet/model";
import { WALLET_LABELS } from "../../shared/config/constants";
import "./WalletTabs.css";

export type TabValue = WalletId | "active-bets" | "settlement";

type WalletTabsProps = {
  value: TabValue;
  onChange: (tab: TabValue) => void;
  activeBetCount?: number;
};

const walletIds: WalletId[] = ["junhyun", "byunghun"];

export function WalletTabs({ value, onChange, activeBetCount = 0 }: WalletTabsProps) {
  return (
    <nav className="wallet-tabs-container" aria-label="탭 선택">
      <div className="top-tabs">
        <button
          className={`top-tab ${value === "active-bets" ? "top-tab-active" : ""}`}
          onClick={() => onChange("active-bets")}
        >
          🏆 진행경기
          {activeBetCount > 0 && <span className="bet-count-badge">{activeBetCount}</span>}
        </button>
        <button
          className={`top-tab ${value === "settlement" ? "top-tab-active settlement-active" : ""}`}
          onClick={() => onChange("settlement")}
        >
          📋 정산
        </button>
      </div>
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
