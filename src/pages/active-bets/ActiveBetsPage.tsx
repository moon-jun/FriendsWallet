import { useEffect, useState } from "react";
import type { Bet } from "../../entities/bet/model";
import type { Friend } from "../../entities/friend/model";
import type { WalletId } from "../../entities/wallet/model";
import { subscribeActiveBets, settleBet } from "../../entities/bet/api";
import { subscribeFriends } from "../../entities/wallet/api";
import { useAuth } from "../../app/providers/AuthProvider";
import { WALLET_LABELS } from "../../shared/config/constants";
import { formatWon } from "../../shared/lib/format";
import { Button } from "../../shared/ui/Button";
import "./ActiveBetsPage.css";

export function ActiveBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<WalletId, Friend[]>>({
    junhyun: [],
    byunghun: [],
  });
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

  async function handleSettle(bet: Bet, outcome: "won" | "lost") {
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
            <article className="bet-card" key={bet.id}>
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

              <div className="bet-actions">
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
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
