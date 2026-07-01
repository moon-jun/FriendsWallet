import type { Friend } from "../friend/model";

export type WalletId = "junhyun" | "byunghun";

export type Wallet = {
  id: WalletId;
  owner: string;
  friends: Friend[];
};

export type FriendSeed = Pick<Friend, "id" | "name">;
