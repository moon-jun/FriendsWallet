import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Friend } from "../friend/model";
import type { WalletId } from "./model";
import { FRIEND_SEEDS } from "../../shared/config/constants";
import { db } from "../../shared/lib/firebase";

function fallbackFriends(walletId: WalletId): Friend[] {
  return FRIEND_SEEDS[walletId].map((friend) => ({
    ...friend,
    amount: 0,
    lastDelta: 0,
    updatedBy: walletId,
  }));
}

export function subscribeFriends(walletId: WalletId, onChange: (friends: Friend[]) => void) {
  if (!db) {
    onChange(fallbackFriends(walletId));
    return () => undefined;
  }

  return onSnapshot(collection(db, "wallets", walletId, "friends"), (snapshot) => {
    if (snapshot.empty) {
      onChange(fallbackFriends(walletId));
      return;
    }

    onChange(
      snapshot.docs
        .map((document) => {
          const data = document.data();
          return {
            id: document.id,
            name: String(data.name ?? document.id),
            amount: Number(data.amount ?? 0),
            updatedAt: data.updatedAt?.toMillis?.(),
            lastDelta: Number(data.lastDelta ?? 0),
            updatedBy: String(data.updatedBy ?? ""),
          };
        })
        .sort((a, b) => {
          const aHasAmount = a.amount !== 0;
          const bHasAmount = b.amount !== 0;
          if (aHasAmount !== bHasAmount) return aHasAmount ? -1 : 1;
          return a.name.localeCompare(b.name, "ko-KR");
        }),
    );
  });
}

export async function updateFriendAmount(
  walletId: WalletId,
  friend: Friend,
  nextAmount: number,
  updatedBy: WalletId,
) {
  if (!db) return;

  const delta = nextAmount - friend.amount;
  await setDoc(
    doc(db, "wallets", walletId, "friends", friend.id),
    {
      name: friend.name,
      amount: nextAmount,
      lastDelta: delta,
      updatedBy,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return delta;
}

export async function getWalletPassword(walletId: WalletId) {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, "auth", walletId));
  return snapshot.exists() ? String(snapshot.data().password ?? "") : null;
}

