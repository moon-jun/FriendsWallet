import type { WalletId } from "../wallet/model";

export type WeeklyResult = {
  friendId: string;
  friendName: string;
  endAmount: number;
  pnl: number; // endAmount - 100000
};

export type WeeklyRecord = {
  id: string;
  walletId: WalletId;
  weekStartDate: string; // "YYYY-MM-DD" (해당 주 월요일)
  chargedAt?: number;
  results: WeeklyResult[]; // 다음 주 리셋 시 채워짐
};

/** 주어진 날짜 기준 해당 주 월요일을 "YYYY-MM-DD" 형식으로 반환 */
export function getMondayDateString(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ... 6=토
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 이동
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
