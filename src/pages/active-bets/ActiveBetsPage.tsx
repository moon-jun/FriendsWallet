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
import { Input } from "../../shared/ui/Input";
import { Modal } from "../../shared/ui/Modal";
import "./ActiveBetsPage.css";

export function ActiveBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<WalletId, Friend[]>>({
    junhyun: [],
    byunghun: [],
  });
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
    const friends = friendsMap[bet.walletId] ?? [];
    await settleBet(bet, outcome, friends);
  }

  return (
    <div className="active-bets-page">
      {bets.length === 0 ? (
        <div className="active-bets-empty">진행 중인 경기가 없습니다</div>
      ) : (
        bets.map((bet) => {
          const totalBet = bet.participants.reduce((s, p) => s + p.amount, 0);
          const expectedWin = Math.round(totalBet * bet.multiplier);
          const editable = canEdit(bet.walletId);

          return (
            <article
              className="bet-card"
              key={bet.id}
              onClick={() => editable && setAddTarget(bet)}
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
                <strong>예상 당첨: {formatWon(expectedWin)}</strong>
              </div>

              <div className="bet-actions" onClick={(e) => e.stopPropagation()}>
                <Button
                  className="button-win"
                  disabled={!editable}
                  onClick={() => void handleSettle(bet, "won")}
                >
                  🎉 당첨
                </Button>
                <Button
                  className="button-lose"
                  disabled={!editable}
                  onClick={() => void handleSettle(bet, "lost")}
                >
                  💨 낙첨
                </Button>
                <Button
                  className="button-void"
                  disabled={!editable}
                  onClick={() => void handleSettle(bet, "voided")}
                >
                  🚫 적특
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

type AddParticipantModalProps = {
  bet: Bet;
  friends: Friend[];
  onClose: () => void;
};

function AddParticipantModal({ bet, friends, onClose }: AddParticipantModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const existingIds = new Set(bet.participants.map((p) => p.friendId));
  const availableFriends = friends;
  const parsedAmount = parseNumberInput(amount);
  const selectedFriend = friends.find((f) => f.id === selectedId);
  const canSubmit = selectedId && parsedAmount > 0;

  async function handleSubmit() {
    if (!selectedFriend || !parsedAmount) return;

    await addParticipantToBet(
      bet,
      { friendId: selectedFriend.id, friendName: selectedFriend.name, amount: parsedAmount },
      friends,
    );
    setSelectedId(null);
    setAmount("");
    onClose();
  }

  return (
    <Modal title={`${bet.title} — 참가자 추가`} open onClose={onClose}>
      <div className="add-participant-form">
        <div className="participant-list">
          {availableFriends.map((f) => (
            <div
              className={`participant-item ${selectedId === f.id ? "selected" : ""}`}
              key={f.id}
              onClick={() => setSelectedId(f.id)}
            >
              <Checkbox
                checked={selectedId === f.id}
                onChange={() => setSelectedId(f.id)}
                aria-label={`${f.name} 선택`}
              />
              <label>{f.name}</label>
              {existingIds.has(f.id) && (
                <span className="already-in-badge">참여중</span>
              )}
            </div>
          ))}
        </div>

        {selectedId && (
          <Input
            inputMode="numeric"
            placeholder="배팅 금액"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
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
