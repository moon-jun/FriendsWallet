import { useState } from "react";
import { QUICK_AMOUNT } from "../../shared/config/constants";
import { parseNumberInput } from "../../shared/lib/format";
import { Button } from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { Modal } from "../../shared/ui/Modal";
import "./AdjustAmount.css";

type AdjustAmountProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onApplyDelta: (delta: number, reason: string) => void;
  onSetAmount?: (amount: number, reason: string) => void;
};

export function AdjustAmount({ title, open, onClose, onApplyDelta, onSetAmount }: AdjustAmountProps) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("카카오페이");
  const customAmount = parseNumberInput(value);

  function apply(delta: number) {
    onApplyDelta(delta, reason || "카카오페이");
    setValue("");
    setReason("카카오페이");
    onClose();
  }

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="adjust-grid">
        <Button variant="danger" onClick={() => apply(-QUICK_AMOUNT)}>
          -50,000
        </Button>
        <Button variant="secondary" onClick={() => apply(QUICK_AMOUNT)}>
          +50,000
        </Button>
      </div>
      <div className="adjust-custom">
        <Input
          inputMode="numeric"
          placeholder="직접 금액"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Input
          placeholder="사유 (선택사항)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="adjust-grid">
          <Button variant="danger" disabled={!customAmount} onClick={() => apply(-Math.abs(customAmount))}>
            빼기
          </Button>
          {onSetAmount ? (
            <Button variant="secondary" disabled={!value} onClick={() => {
              onSetAmount(customAmount, reason || "카카오페이");
              setValue("");
              setReason("카카오페이");
            }}>
              금액 설정
            </Button>
          ) : (
            <Button variant="secondary" disabled={!customAmount} onClick={() => apply(Math.abs(customAmount))}>
              더하기
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
