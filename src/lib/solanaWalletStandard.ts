import { isWalletAdapterCompatibleStandardWallet } from "@solana/wallet-adapter-base";
import { StandardWalletAdapter } from "@solana/wallet-standard-wallet-adapter";
import { getWallets } from "@wallet-standard/app";

import jupiterOfficialIcon from "@/assets/wallets/jupiter.png";

const JUPITER_WALLET_NAME_PATTERN = /jupiter/i;

export function createJupiterStandardWalletAdapter() {
  if (typeof window === "undefined") return null;

  const wallet = getWallets()
    .get()
    .find(
      (candidate) =>
        JUPITER_WALLET_NAME_PATTERN.test(candidate.name) && isWalletAdapterCompatibleStandardWallet(candidate),
    );

  return wallet ? new StandardWalletAdapter({ wallet }) : null;
}

export function isJupiterWalletAvailable() {
  return !!createJupiterStandardWalletAdapter();
}

export function getJupiterWalletIcon() {
  return createJupiterStandardWalletAdapter()?.icon ?? jupiterOfficialIcon;
}
