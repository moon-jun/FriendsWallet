import { useMemo, useState } from "react";
import { formatWon, parseNumberInput } from "../../shared/lib/format";
import { Button } from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { Modal } from "../../shared/ui/Modal";
import { calculateSpecialBet } from "./model";
import "./SpecialBetModal.css";

type SpecialBetModalProps = {
  open: boolean;
  targetCount: number;
  onClose: () => void;
  onApply: (delta: number, reason: string) => void;
};

export function SpecialBetModal({ open, targetCount, onClose, onApply }: SpecialBetModalProps) {
  const [amount, setAmount] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [reason, setReason] = useState("");
  const result = useMemo(
    () => calculateSpecialBet(parseNumberInput(amount), Number(multiplier || 0)),
    [amount, multiplier],
  );

  function submit() {
    onApply(result, reason || "사유 없음");
    setReason("");
    onClose();
  }

  return (
    <Modal title="특별 배당" open={open} onClose={onClose}>
      <div className="special-form">
        <Input
          inputMode="numeric"
          placeholder="기준 금액"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          inputMode="decimal"
          placeholder="배당"
          value={multiplier}
          onChange={(event) => setMultiplier(event.target.value)}
        />
        <Input
          placeholder="사유 (선택사항)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="special-preview">
          <span>{targetCount}명에게 추가</span>
          <strong>{formatWon(result)}</strong>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button disabled={!result || targetCount === 0} onClick={submit}>
            반영
          </Button>
        </div>
      </div>
    </Modal>
  );
}
