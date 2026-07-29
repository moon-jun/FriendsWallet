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

/** "YYYY-MM-DD" 형식의 월요일 날짜를 "N월 M주차" 형식으로 변환 */
export function getWeekLabel(mondayDateStr: string): string {
  if (!mondayDateStr) return "";
  const monday = new Date(mondayDateStr + "T00:00:00");
  const month = monday.getMonth() + 1;

  // 해당 월의 첫 번째 월요일을 찾아 몇 주차인지 계산
  const firstDay = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstMonday = new Date(firstDay);
  const firstDow = firstDay.getDay();
  const daysToFirstMonday = firstDow === 0 ? 1 : firstDow === 1 ? 0 : 8 - firstDow;
  firstMonday.setDate(firstDay.getDate() + daysToFirstMonday);

  let weekNum = 1;
  const cur = new Date(firstMonday);
  while (cur < monday) {
    cur.setDate(cur.getDate() + 7);
    weekNum++;
  }

  return `${month}월 ${weekNum}주차`;
}

