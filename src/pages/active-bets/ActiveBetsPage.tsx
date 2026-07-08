import { useEffect, useState } from "react";
import type { Bet } from "../../entities/bet/model";
import type { Friend } from "../../entities/friend/model";
import type { WalletId } from "../../entities/wallet/model";
import { subscribeActiveBets, settleBet, addParticipantToBet } from "../../entities/bet/api";
import { subscribeFriends } from "../../entities/wallet/api";
import { useAuth } from "../../app/providers/AuthProvider";
import { WALLET_LABELS } from "../../shared/config/constants";
import { formatWon, parseNumberInput } from "../../shared/lib/format";
import { Button } from "../../shared/ui/Button";
import { Checkbox } from "../../shared/ui/Checkbox";
import { Modal } from "../../shared/ui/Modal";
import "./ActiveBetsPage.css";

export function ActiveBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<WalletId, Friend[]>>({
    junhyun: [],
    byunghun: [],
  });
  const [settlingIds, setSettlingIds] = useState<Set<string>>(new Set());
  const [addTarget, setAddTarget] = useState<Bet | null>(null);
  const { canEdit } = useAuth();

  useEffect(() => {
    return subscribeActiveBets(setBets);
  }, []);

  useEffect(() => {
    const unsubs = (["junhyun", "byunghun"] as WalletId[]).map((wid) =>
      subscribeFriends(wid, (friends) =>
        setFriendsMap((prev) => ({ ...prev, [wid]: friends })),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  async function handleSettle(bet: Bet, outcome: "won" | "lost" | "voided") {
    if (settlingIds.has(bet.id)) return; // 이미 처리 중

    setSettlingIds((prev) => new Set(prev).add(bet.id));
    try {
      await settleBet(bet, outcome);
    } finally {
      setSettlingIds((prev) => {
        const next = new Set(prev);
        next.delete(bet.id);
        return next;
      });
    }
  }

  return (
    <div className="active-bets-page">
      {bets.length === 0 ? (
        <div className="active-bets-empty">진행 중인 경기가 없습니다</div>
      ) : (
        bets.map((bet) => {
          const totalBet = bet.participants.reduce((s, p) => s + p.amount, 0);
          const expectedProfit = Math.round(totalBet * bet.multiplier) - totalBet;
          const editable = canEdit(bet.walletId);
          const settling = settlingIds.has(bet.id);

          return (
            <article
              className={`bet-card ${settling ? "bet-card-settling" : ""}`}
              key={bet.id}
              onClick={() => editable && !settling && setAddTarget(bet)}
            >
              <div className="bet-header">
                <span className="bet-title">{bet.title}</span>
                <span className="bet-badge">×{bet.multiplier}</span>
              </div>
              <div className="bet-wallet-label">{WALLET_LABELS[bet.walletId]}</div>

              <div className="bet-participants">
                {bet.participants.map((p) => (
                  <div className="bet-participant" key={p.friendId}>
                    <span className="bet-participant-name">{p.friendName}</span>
                    <span className="bet-participant-amount">{formatWon(p.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="bet-summary">
                <span>총 배팅: {formatWon(totalBet)}</span>
                <strong>예상 이득: {formatWon(expectedProfit)}</strong>
              </div>

              <div className="bet-actions" onClick={(e) => e.stopPropagation()}>
                <Button
                  className="button-win"
                  disabled={!editable || settling}
                  onClick={() => void handleSettle(bet, "won")}
                >
                  {settling ? "처리 중..." : "🎉 당첨"}
                </Button>
                <Button
                  className="button-lose"
                  disabled={!editable || settling}
                  onClick={() => void handleSettle(bet, "lost")}
                >
                  {settling ? "처리 중..." : "💨 낙첨"}
                </Button>
                <Button
                  className="button-void"
                  disabled={!editable || settling}
                  onClick={() => void handleSettle(bet, "voided")}
                >
                  {settling ? "처리 중..." : "🚫 적특"}
                </Button>
              </div>
            </article>
          );
        })
      )}

      {addTarget && (
        <AddParticipantModal
          bet={addTarget}
          friends={friendsMap[addTarget.walletId] ?? []}
          onClose={() => setAddTarget(null)}
        />
      )}
    </div>
  );
}

/* ── 참가자 추가 모달 ── */

type ParticipantEntry = {
  friendId: string;
  friendName: string;
  checked: boolean;
  amount: string;
};

type AddParticipantModalProps = {
  bet: Bet;
  friends: Friend[];
  onClose: () => void;
};

function AddParticipantModal({ bet, friends, onClose }: AddParticipantModalProps) {
  const [entries, setEntries] = useState<ParticipantEntry[]>(() =>
    friends.map((f) => ({ friendId: f.id, friendName: f.name, checked: false, amount: "" })),
  );

  const existingIds = new Set(bet.participants.map((p) => p.friendId));

  function toggleEntry(index: number) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, checked: !e.checked } : e)),
    );
  }

  function setEntryAmount(index: number, value: string) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, amount: value } : e)),
    );
  }

  const checkedEntries = entries.filter((e) => e.checked && parseNumberInput(e.amount) > 0);
  const totalAdd = checkedEntries.reduce((sum, e) => sum + parseNumberInput(e.amount), 0);
  const canSubmit = checkedEntries.length > 0 && totalAdd > 0;

  async function handleSubmit() {
    for (const entry of checkedEntries) {
      const parsed = parseNumberInput(entry.amount);
      if (parsed <= 0) continue;
      await addParticipantToBet(
        bet,
        { friendId: entry.friendId, friendName: entry.friendName, amount: parsed },
      );
    }
    onClose();
  }

  return (
    <Modal title={`${bet.title} — 참가자 추가`} open onClose={onClose}>
      <div className="add-participant-form">
        <div className="participant-list">
          {entries.map((entry, index) => (
            <div
              className={`participant-item ${entry.checked ? "selected" : ""}`}
              key={entry.friendId}
              onClick={() => toggleEntry(index)}
            >
              <Checkbox
                checked={entry.checked}
                onChange={() => toggleEntry(index)}
                aria-label={`${entry.friendName} 선택`}
              />
              <label>{entry.friendName}</label>
              {existingIds.has(entry.friendId) && (
                <span className="already-in-badge">참여중</span>
              )}
              {entry.checked && (
                <input
                  className="participant-amount-input"
                  inputMode="numeric"
                  placeholder="금액"
                  value={entry.amount}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEntryAmount(index, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {totalAdd > 0 && (
          <div className="bet-preview">
            <span>{checkedEntries.length}명 추가</span>
            <strong>총 {formatWon(totalAdd)}</strong>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button disabled={!canSubmit} onClick={() => void handleSubmit()}>
            추가하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
