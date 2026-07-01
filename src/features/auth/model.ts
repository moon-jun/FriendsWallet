import type { WalletId } from "../../entities/wallet/model";
import { getWalletPassword } from "../../entities/wallet/api";
import { hasFirebaseConfig } from "../../shared/lib/firebase";

export async function verifyPassword(walletId: WalletId, password: string) {
  const remotePassword = await getWalletPassword(walletId);
  if (!remotePassword) return !hasFirebaseConfig && password.trim().length > 0;
  return password === remotePassword;
}
