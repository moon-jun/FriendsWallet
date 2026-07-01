import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "../../features/auth/AuthButton";
import { AdjustAmount } from "../../features/adjust-amount/AdjustAmount";
import { MultiSelect } from "../../features/multi-select/MultiSelect";
import { allSelected, toggleSelected } from "../../features/multi-select/model";
import { SpecialBetModal } from "../../features/special-bet/SpecialBetModal";
import { CreateBetModal } from "../../features/create-bet/CreateBetModal";
import { TransactionHistoryModal } from "../../features/transaction-history/TransactionHistoryModal";
import type { Friend } from "../../entities/friend/model";
import type { WalletId } from "../../entities/wallet/model";
import type { Bet } from "../../entities/bet/model";
import { subscribeFriends, updateFriendAmount } from "../../entities/wallet/api";
import { createBet, subscribeActiveBets } from "../../entities/bet/api";
import { recordTransaction } from "../../entities/transaction/api";
import { useAuth } from "../../app/providers/AuthProvider";
import { hasFirebaseConfig } from "../../shared/lib/firebase";
import { formatWon } from "../../shared/lib/format";
import { FriendCardList } from "../../widgets/friend-card-list/FriendCardList";
import { WalletTabs, type TabValue } from "../../widgets/wallet-tabs/WalletTabs";
import { ActiveBetsPage } from "../active-bets/ActiveBetsPage";
import "./WalletPage.css";

export function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("junhyun");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adjustTarget, setAdjustTarget] = useState<Friend | "multi" | null>(null);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Friend | null>(null);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const { canEdit, authenticatedWallet } = useAuth();

  const walletId = activeTab === "active-bets" ? "junhyun" : activeTab;
  const editable = canEdit(walletId);

  useEffect(() => {
    return subscribeActiveBets(setActiveBets);
  }, []);

  useEffect(() => {
    if (activeTab === "active-bets") return;
    setSelectionMode(false);
    setSelectedIds([]);
    return subscribeFriends(activeTab, setFriends);
  }, [activeTab]);

  const total = useMemo(() => friends.reduce((sum, friend) => sum + friend.amount, 0), [friends]);
  const selectedFriends = friends.filter((friend) => selectedIds.includes(friend.id));
  const allIds = friends.map((friend) => friend.id);
  const isAllSelected = allSelected(allIds, selectedIds);

  async function applyToFriends(targets: Friend[], delta: number) {
    const targetIds = new Set(targets.map((friend) => friend.id));
    setFriends((current) =>
      current.map((friend) =>
        targetIds.has(friend.id)
          ? {
              ...friend,
              amount: friend.amount + delta,
              lastDelta: delta,
              updatedBy: walletId,
              updatedAt: Date.now(),
            }
          : friend,
      ),
    );

    for (const friend of targets) {
      const nextAmount = friend.amount + delta;
      await updateFriendAmount(walletId, friend, nextAmount, walletId);
      await recordTransaction(
        walletId,
        friend.id,
        friend.name,
        delta,
        nextAmount,
        "adjust",
        delta >= 0 ? `+${formatWon(delta)}` : formatWon(delta),
      );
    }
  }

  async function setSingleAmount(friend: Friend, amount: number) {
    const delta = amount - friend.amount;
    setFriends((current) =>
      current.map((item) =>
        item.id === friend.id
          ? { ...item, amount, lastDelta: delta, updatedBy: walletId, updatedAt: Date.now() }
          : item,
      ),
    );
    await updateFriendAmount(walletId, friend, amount, walletId);
    await recordTransaction(
      walletId,
      friend.id,
      friend.name,
      delta,
      amount,
      "adjust",
      `금액 설정: ${formatWon(amount)}`,
    );
    setAdjustTarget(null);
  }

  function toggleAll() {
    setSelectedIds(isAllSelected ? [] : allIds);
  }

  function openSingleAdjust(friend: Friend) {
    if (!editable) return;
    setAdjustTarget(friend);
  }

  async function handleCreateBet(
    title: string,
    multiplier: number,
    participants: { friendId: string; friendName: string; amount: number }[],
  ) {
    await createBet(walletId, title, multiplier, participants, friends);
  }

  const isWalletTab = activeTab !== "active-bets";

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1 className="app-title">프로젝트 비자금</h1>
          <p className="subtitle">{hasFirebaseConfig ? "실시간 동기화 중" : "Firebase 설정 전 로컬 미리보기"}</p>
        </div>
        {isWalletTab && <AuthButton walletId={walletId} />}
      </header>

      <WalletTabs
        value={activeTab}
        onChange={setActiveTab}
        activeBetCount={activeBets.length}
      />

      {isWalletTab ? (
        <>
          <div className="list-toolbar">
            <h2>친구 목록</h2>
            <MultiSelect
              editable={editable}
              active={selectionMode}
              selectedCount={selectedIds.length}
              allSelected={isAllSelected}
              onStart={() => setSelectionMode(true)}
              onCancel={() => {
                setSelectionMode(false);
                setSelectedIds([]);
              }}
              onToggleAll={toggleAll}
              onOpenAdjust={() => setAdjustTarget("multi")}
              onOpenSpecial={() => setSpecialOpen(true)}
              onOpenBet={() => setBetOpen(true)}
            />
          </div>

          <FriendCardList
            friends={friends}
            editable={editable}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleFriend={(id) => setSelectedIds((current) => toggleSelected(current, id))}
            onOpenAdjust={openSingleAdjust}
            onOpenHistory={(friend) => setHistoryTarget(friend)}
          />

          <section className="summary">
            <span>총합</span>
            <strong>{formatWon(total)}</strong>
          </section>

          <AdjustAmount
            title={adjustTarget === "multi" ? "일괄 금액 조절" : "금액 조절"}
            open={adjustTarget !== null}
            onClose={() => setAdjustTarget(null)}
            onApplyDelta={(delta) => {
              const targets = adjustTarget === "multi" ? selectedFriends : adjustTarget ? [adjustTarget] : [];
              void applyToFriends(targets, delta);
            }}
            onSetAmount={
              adjustTarget && adjustTarget !== "multi" ? (amount) => void setSingleAmount(adjustTarget, amount) : undefined
            }
          />

          <SpecialBetModal
            open={specialOpen}
            targetCount={selectedFriends.length}
            onClose={() => setSpecialOpen(false)}
            onApply={(delta) => void applyToFriends(selectedFriends, delta)}
          />

          <CreateBetModal
            open={betOpen}
            friends={friends}
            onClose={() => setBetOpen(false)}
            onSubmit={(title, multiplier, participants) => void handleCreateBet(title, multiplier, participants)}
          />

          <TransactionHistoryModal
            open={historyTarget !== null}
            walletId={walletId}
            friendId={historyTarget?.id ?? ""}
            friendName={historyTarget?.name ?? ""}
            onClose={() => setHistoryTarget(null)}
          />
        </>
      ) : (
        <ActiveBetsPage />
      )}
    </main>
  );
}
