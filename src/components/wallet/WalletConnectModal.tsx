import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SupportedWalletId, WalletOption } from "@/services/wallet";
import { CheckCircle2, Wallet } from "lucide-react";
import { getWalletIcon } from "@/components/wallet/walletIcons";

type WalletPresentation = {
  id: SupportedWalletId;
  description: string;
  tag: string;
};

const walletPresentation: WalletPresentation[] = [
  { id: "phantom", description: "Most popular Solana wallet", tag: "Recommended" },
  { id: "solflare", description: "Solana wallet", tag: "Solana wallet" },
  { id: "backpack", description: "Best for multi-extension setups", tag: "Advanced users" },
];

type Props = {
  open: boolean;
  connecting: boolean;
  wallets: WalletOption[];
  onOpenChange: (open: boolean) => void;
  onSelectWallet: (walletId: SupportedWalletId) => void;
};

export function WalletConnectModal({ open, connecting, wallets, onOpenChange, onSelectWallet }: Props) {
  const walletMap = useMemo(
    () => new Map(wallets.map((walletOption) => [walletOption.id, walletOption])),
    [wallets],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-2xl border-border/70 bg-card/95 p-0 shadow-[0_24px_80px_hsl(var(--background)/0.7)] backdrop-blur">
        <DialogHeader className="space-y-3 border-b border-border/60 px-5 pb-4 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Connect wallet</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a Solana wallet to verify your PIXL access.
          </DialogDescription>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            You will only sign a message to authenticate. No transaction will be sent.
          </div>
        </DialogHeader>

        <div className="space-y-2 px-4 pb-4 pt-4">
          {walletPresentation.map((entry) => {
            const walletOption = walletMap.get(entry.id);
            const installed = !!walletOption?.available;
            const label = walletOption?.label ?? entry.id;
            const icon = getWalletIcon(entry.id);

            return (
              <button
                key={entry.id}
                type="button"
                disabled={connecting}
                onClick={() => onSelectWallet(entry.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                  installed
                    ? "border-border/70 bg-background/40 hover:bg-muted/30"
                    : "border-border/50 bg-background/20 opacity-70 hover:bg-background/20",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/40 p-1.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]">
                  <img src={icon} alt={`${label} logo`} className="h-full w-full rounded-lg object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold">{label}</span>
                    <Badge
                      variant={entry.id === "phantom" ? "default" : "outline"}
                      className={cn(
                        "h-5 rounded-md px-2 text-[10px] uppercase tracking-[0.12em]",
                        entry.id === "phantom" ? "bg-primary/20 text-primary" : "border-border/70 text-muted-foreground",
                      )}
                    >
                      {entry.tag}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{entry.description}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {installed && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                      installed ? "border-primary/30 text-primary" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {installed ? "Installed" : "Not installed"}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5" />
            <span>Only Phantom, Solflare, and Backpack are supported.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
