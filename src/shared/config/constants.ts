import type { FriendSeed, WalletId } from "../../entities/wallet/model";

export const WALLET_LABELS: Record<WalletId, string> = {
  junhyun: "지갑",
};

export const FRIEND_SEEDS: Record<WalletId, FriendSeed[]> = {
  junhyun: [
    { id: "jaehyung", name: "재형" },
    { id: "jaeyoung", name: "재영" },
    { id: "haewook", name: "해욱" },
    { id: "hyunsik", name: "현식" },
    { id: "byunghun", name: "병훈" },
    { id: "taesu", name: "태수" },
  ],
};

export const QUICK_AMOUNT = 50000;
