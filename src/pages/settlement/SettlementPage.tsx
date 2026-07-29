import { useEffect, useState } from "react";
import type { WalletId } from "../../entities/wallet/model";
import type { WeeklyRecord } from "../../entities/weekly-record/model";
import { getWeekLabel } from "../../entities/weekly-record/model";
import { subscribeWeeklyRecords } from "../../entities/weekly-record/api";
import { WALLET_LABELS } from "../../shared/config/constants";
import { formatWon } from "../../shared/lib/format";
import "./SettlementPage.css";

const WALLET_IDS: WalletId[] = ["junhyun"];

type MergedWeek = {
  weekStartDate: string;
  label: string;
  records: Partial<Record<WalletId, WeeklyRecord>>;
};

export function SettlementPage() {
  const [recordsMap, setRecordsMap] = useState<Record<WalletId, WeeklyRecord[]>>({
    junhyun: [],
  });
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = WALLET_IDS.map((wid) =>
      subscribeWeeklyRecords(wid, (records) =>
        setRecordsMap((prev) => ({ ...prev, [wid]: records })),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  // 두 지갑의 주차 데이터를 날짜 기준으로 병합
  const mergedMap = new Map<string, MergedWeek>();
  for (const wid of WALLET_IDS) {
    for (const record of recordsMap[wid]) {
      if (!mergedMap.has(record.weekStartDate)) {
        mergedMap.set(record.weekStartDate, {
          weekStartDate: record.weekStartDate,
          label: getWeekLabel(record.weekStartDate),
          records: {},
        });
      }
      mergedMap.get(record.weekStartDate)!.records[wid] = record;
    }
  }

  const weeks = Array.from(mergedMap.values()).sort((a, b) =>
    b.weekStartDate.localeCompare(a.weekStartDate),
  );

  // 이번 주 (results 없는 것) / 지난 주 (results 있는 것) 분리
  const currentWeek = weeks.find((w) =>
    WALLET_IDS.some((wid) => (w.records[wid]?.results.length ?? 0) === 0),
  );
  const pastWeeks = weeks.filter((w) => w !== currentWeek);

  return (
    <div className="settlement-page">
      {/* 이번 주 현황 */}
      {currentWeek && (
        <section className="current-week-section">
          <h2 className="section-title">📅 이번 주 — {currentWeek.label}</h2>
          <div className="week-cards">
            {WALLET_IDS.map((wid) => {
              const record = currentWeek.records[wid];
              if (!record) return null;
              return (
                <div className="wallet-week-card current" key={wid}>
                  <div className="wallet-week-header">
                    <span className="wallet-name">{WALLET_LABELS[wid]}</span>
                    <span className="charge-badge">💰 10만원 충전완료</span>
                  </div>
                  <div className="participant-rows">
                    {record.results.length === 0 ? (
                      <p className="no-result">진행 중 — 일요일에 손익 확정</p>
                    ) : (
                      record.results.map((r) => (
                        <div className="participant-row" key={r.friendId}>
                          <span className="p-name">{r.friendName}</span>
                          <span className="p-balance">{formatWon(r.endAmount)}</span>
                          <span className={`p-pnl ${r.pnl >= 0 ? "positive" : "negative"}`}>
                            {r.pnl >= 0 ? "+" : ""}{formatWon(r.pnl)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 지난 주차 정산 내역 */}
      {pastWeeks.length > 0 && (
        <section className="past-weeks-section">
          <h2 className="section-title">🗂️ 지난 정산 내역</h2>
          <div className="past-week-list">
            {pastWeeks.map((week) => {
              const isOpen = openKey === week.weekStartDate;
              return (
                <div className="past-week-card" key={week.weekStartDate}>
                  <button
                    className="past-week-toggle"
                    onClick={() => setOpenKey(isOpen ? null : week.weekStartDate)}
                  >
                    <span className="past-week-label">{week.label}</span>
                    <span className="past-week-date">{formatDateRange(week.weekStartDate)}</span>
                    <span className="toggle-chevron">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="past-week-detail">
                      {WALLET_IDS.map((wid) => {
                        const record = week.records[wid];
                        if (!record || record.results.length === 0) return null;
                        return (
                          <div className="wallet-section" key={wid}>
                            <p className="wallet-section-title">{WALLET_LABELS[wid]}</p>
                            {record.results.map((r) => (
                              <div className="participant-row" key={r.friendId}>
                                <span className="p-name">{r.friendName}</span>
                                <span className="p-balance">{formatWon(r.endAmount)}</span>
                                <span className={`p-pnl ${r.pnl >= 0 ? "positive" : "negative"}`}>
                                  {r.pnl >= 0 ? "+" : ""}{formatWon(r.pnl)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {weeks.length === 0 && (
        <div className="settlement-empty">
          <p>아직 정산 기록이 없습니다</p>
          <p className="settlement-empty-sub">지갑 탭에서 충전이 시작되면 자동으로 기록됩니다</p>
        </div>
      )}
    </div>
  );
}

function formatDateRange(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(monday)} ~ ${fmt(sunday)}`;
}
