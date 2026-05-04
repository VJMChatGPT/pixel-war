import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

import type { SupportedWalletId } from "@/services/wallet";
import { getJupiterWalletIcon } from "@/lib/solanaWalletStandard";

const injectedWalletIcons: Record<Exclude<SupportedWalletId, "jupiter">, string> = {
  phantom: new PhantomWalletAdapter().icon,
  solflare: new SolflareWalletAdapter().icon,
  backpack: new BackpackWalletAdapter().icon,
};

export function getWalletIcon(walletId: SupportedWalletId) {
  if (walletId === "jupiter") {
    return getJupiterWalletIcon();
  }

  return injectedWalletIcons[walletId];
}
