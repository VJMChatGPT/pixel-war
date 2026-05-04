import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/format";
import { getWalletConnectionErrorMessage, type SupportedWalletId } from "@/services/wallet";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { WalletConnectedMenu } from "@/components/wallet/WalletConnectedMenu";

function normalizeWalletUiErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("selected wallet was not detected")) {
    return "Selected wallet was not detected.";
  }

  if (lower.includes("does not support message signing")) {
    return "This wallet does not support message signing.";
  }

  if (lower.includes("rejected") || lower.includes("cancelled") || lower.includes("canceled")) {
    return "Connection was cancelled.";
  }

  if (lower.includes("multiple wallet extensions may be interfering")) {
    return "Multiple wallet extensions may be interfering.";
  }

  return message;
}

export function WalletConnectButton() {
  const { wallet, connect, disconnect, refreshBalance, connecting, isConnected, availableWallets } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const connectWithWallet = async (walletId: SupportedWalletId) => {
    try {
      const connectedWallet = await connect(walletId);
      setModalOpen(false);
      toast.success("Wallet connected", { description: shortAddress(connectedWallet.address) });
    } catch (error) {
      const rawMessage = getWalletConnectionErrorMessage(error);
      toast.error("Failed to connect", {
        description: normalizeWalletUiErrorMessage(rawMessage),
      });
    }
  };

  if (isConnected && wallet) {
    return (
      <WalletConnectedMenu
        wallet={wallet}
        connecting={connecting}
        onRefreshBalance={refreshBalance}
        onDisconnect={async () => {
          await disconnect();
          toast("Wallet disconnected");
        }}
      />
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={connecting}
        className="h-11 rounded-xl px-5 font-semibold"
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
      </Button>
      <WalletConnectModal
        open={modalOpen}
        connecting={connecting}
        wallets={availableWallets}
        onOpenChange={setModalOpen}
        onSelectWallet={(walletId) => void connectWithWallet(walletId)}
      />
    </>
  );
}
