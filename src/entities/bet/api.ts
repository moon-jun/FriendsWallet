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
  friends: Friend[],
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

  for (const participant of participants) {
    const friend = friends.find((f) => f.id === participant.friendId);
    if (!friend) continue;

    const nextAmount = friend.amount - participant.amount;
    await updateFriendAmount(walletId, friend, nextAmount, walletId);
    await recordTransaction(
      walletId,
      friend.id,
      friend.name,
      -participant.amount,
      nextAmount,
      "bet",
      `배팅: ${title}`,
    );
  }
}

export async function settleBet(bet: Bet, outcome: "won" | "lost" | "voided", friends: Friend[]) {
  if (!db) return;

  await updateDoc(doc(db, "bets", bet.id), {
    status: outcome,
    settledAt: serverTimestamp(),
  });

  if (outcome === "won") {
    for (const participant of bet.participants) {
      const friend = friends.find((f) => f.id === participant.friendId);
      if (!friend) continue;

      const winnings = Math.round(participant.amount * bet.multiplier);
      const nextAmount = friend.amount + winnings;
      await updateFriendAmount(bet.walletId, friend, nextAmount, bet.walletId);
      await recordTransaction(
        bet.walletId,
        friend.id,
        friend.name,
        winnings,
        nextAmount,
        "win",
        `당첨: ${bet.title} ×${bet.multiplier}`,
      );
    }
  } else if (outcome === "voided") {
    for (const participant of bet.participants) {
      const friend = friends.find((f) => f.id === participant.friendId);
      if (!friend) continue;

      const refund = participant.amount;
      const nextAmount = friend.amount + refund;
      await updateFriendAmount(bet.walletId, friend, nextAmount, bet.walletId);
      await recordTransaction(
        bet.walletId,
        friend.id,
        friend.name,
        refund,
        nextAmount,
        "adjust",
        `적특 환불: ${bet.title}`,
      );
    }
  }
}

export async function addParticipantToBet(
  bet: Bet,
  newParticipant: BetParticipant,
  friends: Friend[],
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

  const friend = friends.find((f) => f.id === newParticipant.friendId);
  if (!friend) return;

  const nextAmount = friend.amount - newParticipant.amount;
  await updateFriendAmount(bet.walletId, friend, nextAmount, bet.walletId);
  await recordTransaction(
    bet.walletId,
    friend.id,
    friend.name,
    -newParticipant.amount,
    nextAmount,
    "bet",
    `배팅 추가: ${bet.title}`,
  );
}
