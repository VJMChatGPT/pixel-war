import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { NeonCard } from "@/components/NeonCard";
import { PixlMascot } from "@/components/PixlMascot";
import { CooldownRing } from "@/components/CooldownRing";
import { PixelBadge } from "@/components/PixelBadge";
import { CanvasGrid } from "@/components/CanvasGrid";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useCanvas } from "@/hooks/useCanvas";
import { useCooldown } from "@/hooks/useCooldown";
import { APP_CONFIG } from "@/config/app";
import { fetchWalletPaints, fetchWalletState, type PaintHistoryRow, type PublicWalletStateRow } from "@/services/pixels";
import { compactNumber, shortAddress, timeAgo, walletGradient } from "@/lib/format";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Profile() {
  const { wallet, isConnected, allowedPixels, supplyPercent } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);
  const [history, setHistory] = useState<PaintHistoryRow[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { pixels, error: canvasError } = useCanvas();
  const [copied, setCopied] = useState(false);
  const cooldown = useCooldown(walletState?.last_paint_at);
  const ownedPixelCount = useMemo(
    () => (wallet ? pixels.filter((pixel) => pixel?.owner_wallet === wallet.address).length : 0),
    [pixels, wallet]
  );

  useEffect(() => {
    if (!wallet) return;
    setProfileError(null);
    Promise.all([
      fetchWalletState(wallet.address),
      fetchWalletPaints(wallet.address, 30),
    ])
      .then(([walletData, paintData]) => {
        setWalletState(walletData);
        setHistory(paintData);
      })
      .catch((err: Error) => {
        setProfileError(err.message);
      });
  }, [wallet]);

  if (!isConnected) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <PixlMascot mood="wave" size={120} className="mx-auto mb-6" />
          <h1 className="font-display font-bold text-3xl mb-2">Your profile awaits</h1>
          <p className="text-muted-foreground mb-6">Connect your wallet to view your pixel empire.</p>
          <WalletConnectButton />
        </div>
      </Layout>
    );
  }

  const [a, b] = walletGradient(wallet!.address);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet!.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Layout>
      <div className="container py-10 space-y-6">
        {(profileError || canvasError) && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            <AlertTitle>Profile data failed to load</AlertTitle>
            <AlertDescription>{profileError ?? canvasError}</AlertDescription>
          </Alert>
        )}

        {/* Hero card */}
        <NeonCard shimmer className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl shrink-0 shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">connected wallet</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono font-bold text-lg md:text-2xl truncate">{wallet!.address}</span>
              <Button size="icon" variant="ghost" onClick={copyAddress} className="h-8 w-8 shrink-0">
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <PixelBadge count={allowedPixels} label="allowed" variant="primary" />
              <PixelBadge count={ownedPixelCount || walletState?.pixels_used || 0} label="painted" variant="secondary" />
              <PixelBadge count={Number(supplyPercent.toFixed(3)) as any} label="% supply" variant="accent" />
            </div>
          </div>
          <PixlMascot mood={cooldown.ready ? "cheer" : "sleep"} size={90} className="hidden md:block" />
        </NeonCard>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* My pixels canvas */}
          <NeonCard className="p-3">
            <div className="flex items-center justify-between mb-2 px-2 pt-1">
              <h2 className="font-display font-bold text-lg">My territory</h2>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                only your pixels are highlighted
              </span>
            </div>
            <div className="aspect-square">
              <CanvasGrid pixels={pixels} highlightWallet={wallet!.address} />
            </div>
          </NeonCard>

          <div className="space-y-4">
            <NeonCard className="p-5 flex flex-col items-center">
              <CooldownRing
                remainingMs={cooldown.remainingMs}
                totalMs={APP_CONFIG.rules.cooldownMs}
                size={170}
              />
              <div className="mt-4 text-center">
                <div className="font-mono text-xs text-muted-foreground">balance</div>
                <div className="font-display font-bold text-2xl mt-1">{compactNumber(wallet!.balance)} <span className="text-base text-muted-foreground">$PIXL</span></div>
              </div>
            </NeonCard>

            <NeonCard className="p-5 max-h-[400px] overflow-y-auto">
              <h3 className="font-display font-semibold text-sm mb-3">Recent paints</h3>
              {history.length === 0 && (
                <div className="text-xs text-muted-foreground font-mono text-center py-6">
                  No paints yet — go claim your first pixel.
                </div>
              )}
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30">
                    <div className="flex gap-0.5">
                      <span className="w-3 h-3 rounded-sm border border-border" style={{ background: h.old_color ?? "#0a0a14" }} />
                      <span className="w-3 h-3 rounded-sm border border-border" style={{ background: h.new_color, boxShadow: `0 0 6px ${h.new_color}66` }} />
                    </div>
                    <span className="font-mono text-xs flex-1">pixel #{h.pixel_id}</span>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{timeAgo(h.painted_at)}</span>
                  </div>
                ))}
              </div>
            </NeonCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
