import { useState } from "react";
import type { WeeklyRecord } from "../../entities/weekly-record/model";
import { formatWon } from "../../shared/lib/format";
import "./WeeklyHistory.css";

type WeeklyHistoryProps = {
  records: WeeklyRecord[];
};

export function WeeklyHistory({ records }: WeeklyHistoryProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const closed = records.filter((r) => r.results.length > 0);

  if (closed.length === 0) return null;

  return (
    <section className="weekly-history">
      <h2 className="weekly-history-title">❄️ 주간 정산 내역</h2>
      <div className="weekly-history-list">
        {closed.map((record) => {
          const isOpen = openId === record.id;
          const totalPnl = record.results.reduce((sum, r) => sum + r.pnl, 0);

          return (
            <div className="weekly-record-card" key={record.id}>
              <button
                className="weekly-record-header"
                onClick={() => setOpenId(isOpen ? null : record.id)}
              >
                <span className="weekly-record-date">{formatWeekLabel(record.weekStartDate)}</span>
                <span className={`weekly-record-total ${totalPnl >= 0 ? "positive" : "negative"}`}>
                  {totalPnl >= 0 ? "+" : ""}
                  {formatWon(totalPnl)}
                </span>
                <span className="weekly-record-chevron">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="weekly-record-results">
                  {record.results.map((r) => (
                    <div className="weekly-result-row" key={r.friendId}>
                      <span className="weekly-result-name">{r.friendName}</span>
                      <span className="weekly-result-end">{formatWon(r.endAmount)}</span>
                      <span
                        className={`weekly-result-pnl ${r.pnl >= 0 ? "positive" : "negative"}`}
                      >
                        {r.pnl >= 0 ? "+" : ""}
                        {formatWon(r.pnl)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatWeekLabel(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(date)} ~ ${fmt(end)}`;
}
