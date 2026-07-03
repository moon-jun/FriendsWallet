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
import { updateFriendAmount } from "../wallet/api";
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

export async function settleBet(bet: Bet, outcome: "won" | "lost" | "voided", friends: Friend[]) {
  if (!db) return;

  await updateDoc(doc(db, "bets", bet.id), {
    status: outcome,
    settledAt: serverTimestamp(),
  });

  if (outcome === "won") {
    // 당첨: 원금 제외 이득분만 추가 (금액 × 배당 - 금액)
    for (const participant of bet.participants) {
      const friend = friends.find((f) => f.id === participant.friendId);
      if (!friend) continue;

      const profit = Math.round(participant.amount * bet.multiplier) - participant.amount;
      const nextAmount = friend.amount + profit;
      await updateFriendAmount(bet.walletId, friend, nextAmount, bet.walletId);
      await recordTransaction(
        bet.walletId,
        friend.id,
        friend.name,
        profit,
        nextAmount,
        "win",
        `당첨: ${bet.title} ×${bet.multiplier} (이득분)`,
      );
    }
  } else if (outcome === "lost") {
    // 낙첨: 배팅금액만큼 차감
    for (const participant of bet.participants) {
      const friend = friends.find((f) => f.id === participant.friendId);
      if (!friend) continue;

      const nextAmount = friend.amount - participant.amount;
      await updateFriendAmount(bet.walletId, friend, nextAmount, bet.walletId);
      await recordTransaction(
        bet.walletId,
        friend.id,
        friend.name,
        -participant.amount,
        nextAmount,
        "bet",
        `낙첨: ${bet.title}`,
      );
    }
  } else if (outcome === "voided") {
    // 적특: 기록만 남김 (0원 처리)
    for (const participant of bet.participants) {
      await recordTransaction(
        bet.walletId,
        participant.friendId,
        participant.friendName,
        0,
        friends.find((f) => f.id === participant.friendId)?.amount ?? 0,
        "adjust",
        `적특: ${bet.title}`,
      );
    }
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
