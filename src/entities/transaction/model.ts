import type { WalletId } from "../wallet/model";

export type TransactionType = "adjust" | "bet" | "win";

export type Transaction = {
  id: string;
  walletId: WalletId;
  friendId: string;
  friendName: string;
  delta: number;
  balanceAfter: number;
  type: TransactionType;
  description: string;
  createdAt?: number;
};
