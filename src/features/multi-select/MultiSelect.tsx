import { Button } from "../../shared/ui/Button";
import "./MultiSelect.css";

type MultiSelectProps = {
  editable: boolean;
  active: boolean;
  selectedCount: number;
  allSelected: boolean;
  onStart: () => void;
  onCancel: () => void;
  onToggleAll: () => void;
  onOpenAdjust: () => void;
  onOpenSpecial: () => void;
  onOpenBet: () => void;
};

export function MultiSelect({
  editable,
  active,
  selectedCount,
  allSelected,
  onStart,
  onCancel,
  onToggleAll,
  onOpenAdjust,
  onOpenSpecial,
  onOpenBet,
}: MultiSelectProps) {
  if (!active) {
    return (
      <div className="multi-buttons">
        <Button variant="secondary" disabled={!editable} onClick={onStart}>
          충전
        </Button>
        <Button variant="secondary" disabled={!editable} onClick={onOpenBet}>
          배팅
        </Button>
      </div>
    );
  }

  return (
    <div className="multi-panel">
      <div className="multi-row">
        <strong>{selectedCount}명 선택</strong>
        <button className="multi-link" onClick={onToggleAll}>
          {allSelected ? "전체 해제" : "전체 선택"}
        </button>
      </div>
      <div className="multi-actions">
        <Button variant="secondary" disabled={selectedCount === 0} onClick={onOpenAdjust}>
          일괄 조절
        </Button>
        <Button variant="secondary" disabled={selectedCount === 0} onClick={onOpenSpecial}>
          특별 배당
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
