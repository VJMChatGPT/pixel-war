import { useEffect, useState } from "react";
import { ShareOnXButton } from "@/components/ShareOnXButton";
import { useWallet } from "@/hooks/useWallet";
import { fetchWalletState, type PublicWalletStateRow } from "@/services/pixels";

export function HeaderShareOnXButton() {
  const { wallet, isConnected, allowedPixels } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);

  useEffect(() => {
    if (!wallet) {
      setWalletState(null);
      return;
    }

    let cancelled = false;
    fetchWalletState(wallet.address)
      .then((state) => {
        if (!cancelled) setWalletState(state);
      })
      .catch(() => {
        if (!cancelled) setWalletState(null);
      });

    return () => {
      cancelled = true;
    };
  }, [wallet?.address]);

  if (!isConnected || !wallet) return null;

  return (
    <ShareOnXButton
      wallet={wallet}
      walletState={walletState}
      ownedPixels={walletState?.pixels_used ?? allowedPixels}
      variant="compact"
      className="w-full sm:w-auto"
    />
  );
}
