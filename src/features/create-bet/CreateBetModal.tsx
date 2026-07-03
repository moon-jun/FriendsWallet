import { useMemo, useState } from "react";
import type { Friend } from "../../entities/friend/model";
import { formatWon, parseNumberInput } from "../../shared/lib/format";
import { Button } from "../../shared/ui/Button";
import { Checkbox } from "../../shared/ui/Checkbox";
import { Input } from "../../shared/ui/Input";
import { Modal } from "../../shared/ui/Modal";
import "./CreateBetModal.css";

type ParticipantEntry = {
  friendId: string;
  friendName: string;
  checked: boolean;
  amount: string;
};

type CreateBetModalProps = {
  open: boolean;
  friends: Friend[];
  onClose: () => void;
  onSubmit: (title: string, multiplier: number, participants: { friendId: string; friendName: string; amount: number }[]) => void;
};

export function CreateBetModal({ open, friends, onClose, onSubmit }: CreateBetModalProps) {
  const [title, setTitle] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [entries, setEntries] = useState<ParticipantEntry[]>([]);

  const isInitialized = entries.length > 0;

  if (open && !isInitialized) {
    setEntries(
      friends.map((f) => ({
        friendId: f.id,
        friendName: f.name,
        checked: false,
        amount: "",
      })),
    );
  }

  function toggleParticipant(index: number) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, checked: !entry.checked } : entry)),
    );
  }

  function setParticipantAmount(index: number, value: string) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, amount: value } : entry)),
    );
  }

  const checkedEntries = entries.filter((e) => e.checked);
  const totalBet = useMemo(
    () => checkedEntries.reduce((sum, e) => sum + parseNumberInput(e.amount), 0),
    [checkedEntries],
  );
  const mult = Number(multiplier || 0);
  const expectedProfit = Math.round(totalBet * mult) - totalBet;
  const canSubmit = title.trim() && mult > 0 && checkedEntries.length > 0 && totalBet > 0;

  function handleSubmit() {
    const participants = checkedEntries
      .map((e) => ({
        friendId: e.friendId,
        friendName: e.friendName,
        amount: parseNumberInput(e.amount),
      }))
      .filter((p) => p.amount > 0);

    onSubmit(title.trim(), mult, participants);
    handleClose();
  }

  function handleClose() {
    setTitle("");
    setMultiplier("");
    setEntries([]);
    onClose();
  }

  return (
    <Modal title="배팅 생성" open={open} onClose={handleClose}>
      <div className="create-bet-form">
        <Input
          placeholder="경기 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          inputMode="decimal"
          placeholder="배당 (예: 2.5)"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
        />

        <div className="participant-list">
          {entries.map((entry, index) => (
            <div className="participant-item" key={entry.friendId}>
              <Checkbox
                checked={entry.checked}
                onChange={() => toggleParticipant(index)}
                aria-label={`${entry.friendName} 참여`}
              />
              <label>{entry.friendName}</label>
              {entry.checked && (
                <input
                  className="participant-amount-input"
                  inputMode="numeric"
                  placeholder="금액"
                  value={entry.amount}
                  onChange={(e) => setParticipantAmount(index, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bet-preview">
          <span>총 배팅: {formatWon(totalBet)}</span>
          <strong>예상 이득: {formatWon(expectedProfit)}</strong>
        </div>

        <div className="modal-actions">
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            배팅하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
