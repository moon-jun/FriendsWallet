import type { Friend } from "../../entities/friend/model";
import { FriendCard } from "../../entities/friend/FriendCard";
import "./FriendCardList.css";

type FriendCardListProps = {
  friends: Friend[];
  editable: boolean;
  selectionMode: boolean;
  selectedIds: string[];
  onToggleFriend: (id: string) => void;
  onOpenAdjust: (friend: Friend) => void;
};

export function FriendCardList({
  friends,
  editable,
  selectionMode,
  selectedIds,
  onToggleFriend,
  onOpenAdjust,
}: FriendCardListProps) {
  return (
    <div className="friend-list">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          editable={editable}
          selected={selectedIds.includes(friend.id)}
          selectionMode={selectionMode}
          onToggle={() => onToggleFriend(friend.id)}
          onOpenAdjust={() => onOpenAdjust(friend)}
        />
      ))}
    </div>
  );
}
