import type { WalletId } from "../wallet/model";

export type BetParticipant = {
  friendId: string;
  friendName: string;
  amount: number;
};

export type BetStatus = "active" | "won" | "lost";

export type Bet = {
  id: string;
  title: string;
  multiplier: number;
  walletId: WalletId;
  status: BetStatus;
  createdAt?: number;
  settledAt?: number;
  participants: BetParticipant[];
};
