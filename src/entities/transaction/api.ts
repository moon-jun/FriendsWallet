import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { WalletId } from "../wallet/model";
import type { Transaction } from "./model";
import { db } from "../../shared/lib/firebase";

export async function recordTransaction(
  walletId: WalletId,
  friendId: string,
  friendName: string,
  delta: number,
  balanceAfter: number,
  type: Transaction["type"],
  description: string,
) {
  if (!db) return;

  await addDoc(collection(db, "transactions"), {
    walletId,
    friendId,
    friendName,
    delta,
    balanceAfter,
    type,
    description,
    createdAt: serverTimestamp(),
  });
}

export function subscribeTransactions(
  walletId: WalletId,
  friendId: string,
  count: number,
  onChange: (transactions: Transaction[]) => void,
) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  const q = query(
    collection(db, "transactions"),
    where("walletId", "==", walletId),
    where("friendId", "==", friendId),
    orderBy("createdAt", "desc"),
    limit(count),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(
      snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          walletId: data.walletId,
          friendId: data.friendId,
          friendName: data.friendName ?? "",
          delta: Number(data.delta ?? 0),
          balanceAfter: Number(data.balanceAfter ?? 0),
          type: data.type ?? "adjust",
          description: data.description ?? "",
          createdAt: data.createdAt?.toMillis?.(),
        };
      }),
    );
  });
}
