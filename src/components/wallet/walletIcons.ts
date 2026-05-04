import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

import type { SupportedWalletId } from "@/services/wallet";

const walletIcons: Record<SupportedWalletId, string> = {
  phantom: new PhantomWalletAdapter().icon,
  solflare: new SolflareWalletAdapter().icon,
  backpack: new BackpackWalletAdapter().icon,
};

export function getWalletIcon(walletId: SupportedWalletId) {
  return walletIcons[walletId];
}
