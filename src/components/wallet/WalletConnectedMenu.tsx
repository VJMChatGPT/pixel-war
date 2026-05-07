import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletInfo } from "@/services/wallet";
import { Check, Copy, Loader2, LogOut, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

type Props = {
  wallet: WalletInfo;
  connecting: boolean;
  onRefreshBalance: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  buttonClassName?: string;
};

export function WalletConnectedMenu({ wallet, connecting, onRefreshBalance, onDisconnect, buttonClassName }: Props) {
  const [copying, setCopying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const copyAddress = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied");
    } finally {
      window.setTimeout(() => setCopying(false), 800);
    }
  };

  const refreshBalance = async () => {
    try {
      setRefreshing(true);
      await onRefreshBalance();
      toast.success("Balance refreshed");
    } catch (error) {
      toast.error("Could not refresh balance", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={connecting}
          className={cn(
            "h-11 rounded-xl border border-border bg-card px-4 text-foreground hover:bg-muted/40",
            buttonClassName,
          )}
          variant="outline"
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : shortAddress(wallet.address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 pb-2 pt-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Connected wallet</div>
          <div className="mt-1 break-all font-mono text-xs text-foreground">{wallet.address}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void copyAddress()} disabled={copying} className="gap-2">
          {copying ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void refreshBalance()} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh balance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void onDisconnect()}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
