import { shortAddress } from "@/lib/format";

export function formatWalletDisplayName({
  wallet,
  displayName,
  currentWallet,
  shortenFallback = false,
}: {
  wallet: string | null | undefined;
  displayName?: string | null;
  currentWallet?: string | null;
  shortenFallback?: boolean;
}) {
  const fallback = shortenFallback ? shortAddress(wallet) : wallet ?? "—";
  const base = displayName?.trim() || fallback;
  return isCurrentWallet(wallet, currentWallet) ? `${base} (YOU)` : base;
}

export function isCurrentWallet(wallet: string | null | undefined, currentWallet: string | null | undefined) {
  return !!wallet && !!currentWallet && wallet === currentWallet;
}
