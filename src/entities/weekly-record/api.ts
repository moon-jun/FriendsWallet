import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Friend } from "../friend/model";
import type { WalletId } from "../wallet/model";
import { updateFriendAmount } from "../wallet/api";
import { recordTransaction } from "../transaction/api";
import { db } from "../../shared/lib/firebase";
import { getMondayDateString, type WeeklyRecord } from "./model";

const WEEKLY_CHARGE = 100_000;

/** 이번 주 weeklyRecord가 있는지 확인하고, 없으면 신규 주차 처리 */
export async function checkAndProcessWeeklyReset(
  walletId: WalletId,
  friends: Friend[],
): Promise<void> {
  if (!db || friends.length === 0) return;

  const thisMonday = getMondayDateString();

  // 이번 주 레코드 이미 있으면 스킵
  const existingSnap = await getDocs(
    query(
      collection(db, "weeklyRecords"),
      where("walletId", "==", walletId),
      where("weekStartDate", "==", thisMonday),
    ),
  );
  if (!existingSnap.empty) return;

  // ── 신규 주차 처리 ──

  // 1. 직전 주 레코드에 손익(results) 기록
  await closePreviousWeek(walletId, friends);

  // 2. 모든 멤버 잔액 0원 리셋 후 10만원 충전
  for (const friend of friends) {
    const nextAmount = WEEKLY_CHARGE;
    const delta = nextAmount - friend.amount;
    await updateFriendAmount(walletId, friend, nextAmount, walletId);
    await recordTransaction(
      walletId,
      friend.id,
      friend.name,
      delta,
      nextAmount,
      "adjust",
      `주간 충전 (${thisMonday})`,
    );
  }

  // 3. 이번 주 weeklyRecord 생성
  await addDoc(collection(db, "weeklyRecords"), {
    walletId,
    weekStartDate: thisMonday,
    chargedAt: serverTimestamp(),
    results: [],
  });
}

/** 직전 주 weeklyRecord에 손익 결과 기록 */
async function closePreviousWeek(walletId: WalletId, friends: Friend[]) {
  if (!db) return;

  const prevSnap = await getDocs(
    query(
      collection(db, "weeklyRecords"),
      where("walletId", "==", walletId),
      orderBy("weekStartDate", "desc"),
    ),
  );

  if (prevSnap.empty) return;

  const prevDoc = prevSnap.docs[0];
  const results = friends.map((f) => ({
    friendId: f.id,
    friendName: f.name,
    endAmount: f.amount,
    pnl: f.amount - WEEKLY_CHARGE,
  }));

  await updateDoc(doc(db, "weeklyRecords", prevDoc.id), { results });
}

/** 주간 기록 실시간 구독 */
export function subscribeWeeklyRecords(
  walletId: WalletId,
  onChange: (records: WeeklyRecord[]) => void,
) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  const q = query(
    collection(db, "weeklyRecords"),
    where("walletId", "==", walletId),
    orderBy("weekStartDate", "desc"),
  );

  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          walletId: data.walletId as WalletId,
          weekStartDate: String(data.weekStartDate ?? ""),
          chargedAt: data.chargedAt?.toMillis?.(),
          results: data.results ?? [],
        };
      }),
    );
  });
}
