import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PixelRow, PublicWalletStateRow } from "@/services/pixels";
import type { WalletInfo } from "@/services/wallet";
import { buildXIntentUrl, buildXShareText, downloadShareCard, generateShareCardBlob } from "@/lib/share";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Share2 } from "lucide-react";

export function ShareOnXButton({
  wallet,
  walletState,
  pixels,
  ownedPixels,
  className,
}: {
  wallet: WalletInfo | null;
  walletState: PublicWalletStateRow | null;
  pixels: (PixelRow | null)[];
  ownedPixels: number;
  className?: string;
}) {
  const [sharing, setSharing] = useState(false);

  if (!wallet) return null;

  const handleShare = async () => {
    setSharing(true);
    const shareWindow = window.open("", "_blank", "noopener,noreferrer");

    try {
      const [blob, text] = await Promise.all([
        generateShareCardBlob({
          walletAddress: wallet.address,
          walletState,
          pixels,
          ownedPixels,
        }),
        Promise.resolve(
          buildXShareText({
            walletAddress: wallet.address,
            walletState,
            ownedPixels,
          })
        ),
      ]);

      downloadShareCard(blob);
      const intentUrl = buildXIntentUrl(text);

      if (shareWindow) {
        shareWindow.location.href = intentUrl;
      } else {
        window.open(intentUrl, "_blank", "noopener,noreferrer");
      }

      toast.success("Share card ready", {
        description: "We downloaded your image and opened X. Attach the card to finish the post.",
      });
    } catch (error) {
      if (shareWindow) {
        shareWindow.close();
      }
      toast.error("Could not prepare your X share", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSharing(false);
    }
  };

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
            Generate a share card with the full board, your highlighted pixels, and your current score.
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
