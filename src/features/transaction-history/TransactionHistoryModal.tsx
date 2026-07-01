import { useEffect, useState } from "react";
import type { WalletId } from "../../entities/wallet/model";
import type { Transaction } from "../../entities/transaction/model";
import { subscribeTransactions } from "../../entities/transaction/api";
import { formatWon } from "../../shared/lib/format";
import { Modal } from "../../shared/ui/Modal";
import "./TransactionHistoryModal.css";

type TransactionHistoryModalProps = {
  open: boolean;
  walletId: WalletId;
  friendId: string;
  friendName: string;
  onClose: () => void;
};

function formatDate(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function TransactionHistoryModal({
  open,
  walletId,
  friendId,
  friendName,
  onClose,
}: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!open || !friendId) return;
    return subscribeTransactions(walletId, friendId, 20, setTransactions);
  }, [open, walletId, friendId]);

  return (
    <Modal title={`${friendName} 내역`} open={open} onClose={onClose}>
      <div className="tx-history-list">
        {transactions.length === 0 ? (
          <div className="tx-empty">거래 내역이 없습니다</div>
        ) : (
          transactions.map((tx) => (
            <div className="tx-item" key={tx.id}>
              <div className="tx-info">
                <span className="tx-desc">{tx.description}</span>
                <span className="tx-time">{formatDate(tx.createdAt)}</span>
              </div>
              <div>
                <div className={`tx-delta ${tx.delta >= 0 ? "tx-positive" : "tx-negative"}`}>
                  {tx.delta >= 0 ? "+" : ""}
                  {formatWon(tx.delta)}
                </div>
                <div className="tx-balance">잔액 {formatWon(tx.balanceAfter)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
