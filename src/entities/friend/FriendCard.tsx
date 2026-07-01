import { Checkbox } from "../../shared/ui/Checkbox";
import { formatWon } from "../../shared/lib/format";
import type { Friend } from "./model";
import "./FriendCard.css";

type FriendCardProps = {
  friend: Friend;
  editable: boolean;
  selected: boolean;
  selectionMode: boolean;
  onToggle: () => void;
  onOpenAdjust: () => void;
  onOpenHistory: () => void;
};

export function FriendCard({
  friend,
  editable,
  selected,
  selectionMode,
  onToggle,
  onOpenAdjust,
  onOpenHistory,
}: FriendCardProps) {
  const tone = friend.amount > 0 ? "positive" : friend.amount < 0 ? "negative" : "neutral";

  return (
    <article
      className={`friend-card ${selected ? "friend-card-selected" : ""}`}
      onClick={selectionMode ? onToggle : editable ? onOpenAdjust : undefined}
    >
      {selectionMode && <Checkbox checked={selected} readOnly aria-label={`${friend.name} 선택`} />}
      <div className="friend-info">
        <strong>{friend.name}</strong>
        <span>{friend.lastDelta ? `최근 ${formatWon(friend.lastDelta)}` : "변경 내역 없음"}</span>
      </div>
      <div className="friend-right">
        <div className={`friend-amount amount-${tone}`}>{formatWon(friend.amount)}</div>
        <button
          className="history-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistory();
          }}
          aria-label={`${friend.name} 내역`}
        >
          내역
        </button>
      </div>
    </article>
  );
}
