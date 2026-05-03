import { fetchWalletDisplayNames } from "@/services/pixels";

const walletDisplayNameCache = new Map<string, string | null>();
const walletDisplayNameRequests = new Map<string, Promise<string | null>>();

function normalizeWallets(wallets: Array<string | null | undefined>) {
  return [...new Set(wallets.filter(Boolean))] as string[];
}

export function getCachedWalletDisplayNames(wallets: Array<string | null | undefined>) {
  return normalizeWallets(wallets).reduce<Record<string, string | null>>((acc, wallet) => {
    if (walletDisplayNameCache.has(wallet)) {
      acc[wallet] = walletDisplayNameCache.get(wallet) ?? null;
    }
    return acc;
  }, {});
}

export function primeWalletDisplayNameCache(wallet: string | null | undefined, displayName: string | null | undefined) {
  if (!wallet) return;
  const normalizedDisplayName = displayName?.trim() || null;
  walletDisplayNameCache.set(wallet, normalizedDisplayName);
}

export async function resolveWalletDisplayNames(wallets: Array<string | null | undefined>) {
  const uniqueWallets = normalizeWallets(wallets);
  const resolvedNames: Record<string, string | null> = {};
  const pendingLookups: Array<Promise<void>> = [];
  const walletsToFetch: string[] = [];

  for (const wallet of uniqueWallets) {
    if (walletDisplayNameCache.has(wallet)) {
      resolvedNames[wallet] = walletDisplayNameCache.get(wallet) ?? null;
      continue;
    }

    const pendingRequest = walletDisplayNameRequests.get(wallet);
    if (pendingRequest) {
      pendingLookups.push(
        pendingRequest.then((displayName) => {
          resolvedNames[wallet] = displayName;
        })
      );
      continue;
    }

    walletsToFetch.push(wallet);
  }

  if (walletsToFetch.length > 0) {
    const batchRequest = fetchWalletDisplayNames(walletsToFetch)
      .then((fetchedNames) => {
        for (const wallet of walletsToFetch) {
          const displayName = fetchedNames[wallet] ?? null;
          walletDisplayNameCache.set(wallet, displayName);
        }
        return fetchedNames;
      })
      .finally(() => {
        for (const wallet of walletsToFetch) {
          walletDisplayNameRequests.delete(wallet);
        }
      });

    for (const wallet of walletsToFetch) {
      const walletRequest = batchRequest.then((fetchedNames) => fetchedNames[wallet] ?? null);
      walletDisplayNameRequests.set(wallet, walletRequest);
      pendingLookups.push(
        walletRequest.then((displayName) => {
          resolvedNames[wallet] = displayName;
        })
      );
    }
  }

  if (pendingLookups.length > 0) {
    await Promise.all(pendingLookups);
  }

  return resolvedNames;
}
