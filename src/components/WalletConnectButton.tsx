import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { shortAddress, walletGradient } from "@/lib/format";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export function WalletConnectButton() {
  const { wallet, connect, disconnect, connecting, isConnected } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={async () => {
          try {
            const w = await connect();
            toast.success("Wallet connected", { description: shortAddress(w.address) });
          } catch (e: any) {
            toast.error("Failed to connect", { description: e.message });
          }
        }}
        disabled={connecting}
        className="relative overflow-hidden bg-gradient-neon text-primary-foreground hover:opacity-95 font-semibold h-11 px-5 rounded-xl glow-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
        <span>{connecting ? "Connecting…" : "Connect Wallet"}</span>
      </Button>
    );
  }

  const [a, b] = walletGradient(wallet!.address);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-3 h-11 pl-1 pr-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all">
          <span
            className="w-8 h-8 rounded-lg shadow-inner"
            style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
          />
          <div className="text-left leading-tight">
            <div className="font-mono text-xs text-muted-foreground">connected</div>
            <div className="font-mono text-sm font-semibold">{shortAddress(wallet!.address)}</div>
          </div>
          <span className="ml-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile">View profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/canvas">Open canvas</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await disconnect();
            toast("Wallet disconnected");
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
