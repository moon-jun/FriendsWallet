import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "../../features/auth/AuthButton";
import { AdjustAmount } from "../../features/adjust-amount/AdjustAmount";
import { MultiSelect } from "../../features/multi-select/MultiSelect";
import { allSelected, toggleSelected } from "../../features/multi-select/model";
import { SpecialBetModal } from "../../features/special-bet/SpecialBetModal";
import type { Friend } from "../../entities/friend/model";
import type { WalletId } from "../../entities/wallet/model";
import { subscribeFriends, updateFriendAmount } from "../../entities/wallet/api";
import { useAuth } from "../../app/providers/AuthProvider";
import { hasFirebaseConfig } from "../../shared/lib/firebase";
import { formatWon } from "../../shared/lib/format";
import { FriendCardList } from "../../widgets/friend-card-list/FriendCardList";
import { WalletTabs } from "../../widgets/wallet-tabs/WalletTabs";
import "./WalletPage.css";

export function WalletPage() {
  const [walletId, setWalletId] = useState<WalletId>("junhyun");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adjustTarget, setAdjustTarget] = useState<Friend | "multi" | null>(null);
  const [specialOpen, setSpecialOpen] = useState(false);
  const { canEdit } = useAuth();
  const editable = canEdit(walletId);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds([]);
    return subscribeFriends(walletId, setFriends);
  }, [walletId]);

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

    await Promise.all(targets.map((friend) => updateFriendAmount(walletId, friend, friend.amount + delta, walletId)));
  }

  async function setSingleAmount(friend: Friend, amount: number) {
    setFriends((current) =>
      current.map((item) =>
        item.id === friend.id
          ? { ...item, amount, lastDelta: amount - item.amount, updatedBy: walletId, updatedAt: Date.now() }
          : item,
      ),
    );
    await updateFriendAmount(walletId, friend, amount, walletId);
    setAdjustTarget(null);
  }

  function toggleAll() {
    setSelectedIds(isAllSelected ? [] : allIds);
  }

  function openSingleAdjust(friend: Friend) {
    if (!editable) return;
    setAdjustTarget(friend);
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1 className="app-title">프로젝트 비자금</h1>
          <p className="subtitle">{hasFirebaseConfig ? "실시간 동기화 중" : "Firebase 설정 전 로컬 미리보기"}</p>
        </div>
        <AuthButton walletId={walletId} />
      </header>

      <WalletTabs value={walletId} onChange={setWalletId} />

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
        />
      </div>

      <FriendCardList
        friends={friends}
        editable={editable}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleFriend={(id) => setSelectedIds((current) => toggleSelected(current, id))}
        onOpenAdjust={openSingleAdjust}
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
    </main>
  );
}
