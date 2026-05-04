import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicWalletStateRow } from "@/services/pixels";
import type { WalletInfo } from "@/services/wallet";
import { buildShareUrl, buildXIntentUrl, buildXShareText } from "@/lib/share";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Share2 } from "lucide-react";

export function ShareOnXButton({
  wallet,
  walletState,
  ownedPixels,
  className,
  variant = "card",
}: {
  wallet: WalletInfo | null;
  walletState: PublicWalletStateRow | null;
  ownedPixels: number;
  className?: string;
  variant?: "card" | "compact";
}) {
  const [sharing, setSharing] = useState(false);

  if (!wallet) return null;

  const handleShare = async () => {
    setSharing(true);

    try {
      const text = buildXShareText({
        walletAddress: wallet.address,
        walletState,
        ownedPixels,
      });
      const shareUrl = buildShareUrl(wallet.address);
      const intentUrl = buildXIntentUrl({ text, shareUrl });
      window.open(intentUrl, "_blank", "noopener,noreferrer");

      toast.success("Opening X share", {
        description: "Your post includes a dedicated Pixel War share page with a live social preview.",
      });
    } catch (error) {
      toast.error("Could not prepare your X share", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSharing(false);
    }
  };

  if (variant === "compact") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => void handleShare()}
        disabled={sharing}
        className={cn(
          "h-11 rounded-xl border-primary/30 bg-primary/10 px-4 font-semibold text-primary hover:bg-primary/15 hover:text-primary shadow-[0_10px_30px_rgba(168,85,247,0.18)]",
          className
        )}
      >
        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        {sharing ? "Preparing..." : "Share on X"}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/12 via-background/95 to-accent/12 px-4 py-4 shadow-[0_0_30px_rgba(168,85,247,0.12)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/80">
            Share your progress
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">
            Show off your territory on X
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Open a dedicated Pixel War share page with your highlighted territory, live points, and a social preview card.
          </div>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary shrink-0">
          <Share2 className="h-4 w-4" />
        </div>
      </div>

      <Button
        type="button"
        onClick={() => void handleShare()}
        disabled={sharing}
        className="mt-4 w-full rounded-xl bg-primary text-primary-foreground shadow-[0_12px_35px_rgba(168,85,247,0.32)] transition hover:bg-primary/90"
      >
        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        {sharing ? "Preparing share..." : "Share on X"}
      </Button>
    </div>
  );
}
