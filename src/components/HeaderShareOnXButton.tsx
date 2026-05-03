import { ShareOnXButton } from "@/components/ShareOnXButton";
import { useWallet } from "@/hooks/useWallet";
import { useWalletState } from "@/hooks/useWalletState";

export function HeaderShareOnXButton() {
  const { wallet, isConnected, allowedPixels } = useWallet();
  const { walletState } = useWalletState();

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
