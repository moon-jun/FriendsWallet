import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Friend } from "../friend/model";
import type { WalletId } from "../wallet/model";
import type { Bet, BetParticipant } from "./model";
import { incrementFriendAmount, updateFriendAmount } from "../wallet/api";
import { recordTransaction } from "../transaction/api";
import { db } from "../../shared/lib/firebase";

export function subscribeActiveBets(onChange: (bets: Bet[]) => void) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  const q = query(
    collection(db, "bets"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ""),
          multiplier: Number(data.multiplier ?? 0),
          walletId: data.walletId as WalletId,
          status: data.status ?? "active",
          createdAt: data.createdAt?.toMillis?.(),
          settledAt: data.settledAt?.toMillis?.(),
          participants: (data.participants ?? []) as BetParticipant[],
        };
      }),
    );
  });
}

export async function createBet(
  walletId: WalletId,
  title: string,
  multiplier: number,
  participants: BetParticipant[],
  _friends: Friend[],
) {
  if (!db) return;

  await addDoc(collection(db, "bets"), {
    title,
    multiplier,
    walletId,
    status: "active",
    participants,
    createdAt: serverTimestamp(),
  });
}

/**
 * 당첨/낙첨/적특 처리 — increment()를 사용해 동시 호출에도 안전
 */
export async function settleBet(bet: Bet, outcome: "won" | "lost" | "voided") {
  if (!db) return;

  await updateDoc(doc(db, "bets", bet.id), {
    status: outcome,
    settledAt: serverTimestamp(),
  });

  if (outcome === "won") {
    // 당첨: 원금 제외 이득분만 추가 (금액 × 배당 - 금액)
    const promises = bet.participants.map(async (participant) => {
      const profit = Math.round(participant.amount * bet.multiplier) - participant.amount;
      await incrementFriendAmount(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        profit,
        bet.walletId,
      );
      await recordTransaction(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        profit,
        0,
        "win",
        `당첨: ${bet.title} ×${bet.multiplier} (이득분)`,
      );
    });
    await Promise.all(promises);
  } else if (outcome === "lost") {
    // 낙첨: 배팅금액만큼 차감
    const promises = bet.participants.map(async (participant) => {
      await incrementFriendAmount(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        -participant.amount,
        bet.walletId,
      );
      await recordTransaction(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        -participant.amount,
        0,
        "bet",
        `낙첨: ${bet.title}`,
      );
    });
    await Promise.all(promises);
  } else if (outcome === "voided") {
    // 적특: 기록만 남김 (0원 처리)
    const promises = bet.participants.map(async (participant) => {
      await recordTransaction(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        0,
        0,
        "adjust",
        `적특: ${bet.title}`,
      );
    });
    await Promise.all(promises);
  }
}

export async function addParticipantToBet(
  bet: Bet,
  newParticipant: BetParticipant,
  _friends: Friend[],
) {
  if (!db) return;

  const updatedParticipants = [...bet.participants];
  const existing = updatedParticipants.find((p) => p.friendId === newParticipant.friendId);

  if (existing) {
    existing.amount += newParticipant.amount;
  } else {
    updatedParticipants.push(newParticipant);
  }

  await updateDoc(doc(db, "bets", bet.id), {
    participants: updatedParticipants.map((p) => ({
      friendId: p.friendId,
      friendName: p.friendName,
      amount: p.amount,
    })),
  });
}
