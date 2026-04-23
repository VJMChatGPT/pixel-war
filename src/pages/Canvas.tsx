import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { CanvasGrid } from "@/components/CanvasGrid";
import { NeonCard } from "@/components/NeonCard";
import { ColorPicker } from "@/components/ColorPicker";
import { CooldownRing } from "@/components/CooldownRing";
import { PixelBadge } from "@/components/PixelBadge";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PixlMascot } from "@/components/PixlMascot";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCanvas } from "@/hooks/useCanvas";
import { useWallet } from "@/hooks/useWallet";
import { useCooldown } from "@/hooks/useCooldown";
import { fetchWalletState, paintPixel, type PublicWalletStateRow } from "@/services/pixels";
import { APP_CONFIG } from "@/config/app";
import { compactNumber, shortAddress } from "@/lib/format";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LocateFixed, Sparkles } from "lucide-react";

export default function CanvasPage() {
  const { pixels, loading: canvasLoading, error: canvasError } = useCanvas();
  const { wallet, isConnected, allowedPixels, supplyPercent } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);
  const [color, setColor] = useState<string>(APP_CONFIG.palette[0]);
  const [painting, setPainting] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [focusMine, setFocusMine] = useState(false);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);

  useEffect(() => {
    if (!wallet) { setWalletState(null); return; }
    fetchWalletState(wallet.address).then(setWalletState);
  }, [wallet]);

  const cooldown = useCooldown(walletState?.last_paint_at);
  const usedPixels = walletState?.pixels_used ?? 0;
  const ownedPixelCount = useMemo(
    () => (wallet ? pixels.filter((pixel) => pixel?.owner_wallet === wallet.address).length : 0),
    [pixels, wallet]
  );
  const hasPaintAuth = !!wallet && (wallet.isMock || !!wallet.sessionToken);
  const canPaint = isConnected && hasPaintAuth && cooldown.ready && allowedPixels > 0 && !painting;
  const canvasSyncIssue = !canvasLoading && !canvasError && usedPixels > 0 && ownedPixelCount === 0;

  useEffect(() => {
    if (!wallet) {
      setFocusMine(false);
      setHasAutoFocused(false);
      return;
    }
    if (ownedPixelCount <= 0 || hasAutoFocused) return;
    setFocusMine(true);
    setFocusKey((key) => key + 1);
    setHasAutoFocused(true);
  }, [wallet, ownedPixelCount, hasAutoFocused]);

  const onPaint = async (x: number, y: number) => {
    if (painting) return;
    if (!wallet) {
      toast.error("Connect your wallet to paint");
      return;
    }
    if (!cooldown.ready) {
      toast.error("Paint slots full", {
        description: "You have already used every paint slot available in the current 15-minute window.",
      });
      return;
    }
    setPainting(true);
    try {
      const res = await paintPixel({
        x,
        y,
        color,
        sessionToken: wallet.sessionToken ?? "",
      });
      if (!res.ok) {
        toast.error("Paint blocked by server", {
          description: res.message ?? res.error ?? "Backend rules are enforced server-side.",
        });
        return;
      }
      if (res.walletState) setWalletState(res.walletState);
      toast.success("Pixel painted!", {
        description: (
          <span className="font-mono text-xs">
            ({x},{y}) · <span style={{ color }}>{color}</span>
          </span>
        ),
      });
    } finally {
      setPainting(false);
    }
  };

  return (
    <Layout footer={false}>
      <div className="container py-6 md:py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl">The Canvas</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1">drag to pan · scroll to zoom · click to paint</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                {wallet && usedPixels > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg"
                    onClick={() => {
                      if (canvasSyncIssue) {
                        toast.error("Canvas out of sync", {
                          description: "Your wallet state says you own pixels, but the canvas data loaded 0 for your address.",
                        });
                        return;
                      }
                      if (ownedPixelCount <= 0) {
                        toast.error("No owned pixels in canvas data yet", {
                          description: canvasLoading ? "Canvas is still loading." : "The canvas has not loaded your painted pixels yet.",
                        });
                        return;
                      }
                      setFocusMine(true);
                      setFocusKey((key) => key + 1);
                    }}
                  >
                    <LocateFixed className="w-4 h-4" />
                    Focus my pixels
                  </Button>
                )}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-muted-foreground uppercase tracking-wider">realtime</span>
                </div>
              </div>
            </div>
            {canvasError && (
              <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                <AlertTitle>Canvas failed to load</AlertTitle>
                <AlertDescription>{canvasError}</AlertDescription>
              </Alert>
            )}
            {canvasSyncIssue && (
              <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                <AlertTitle>Canvas data is out of sync</AlertTitle>
                <AlertDescription>
                  Wallet state reports {usedPixels} painted pixels, but the canvas query loaded 0 cells for wallet {shortAddress(wallet?.address ?? "")}.
                </AlertDescription>
              </Alert>
            )}
            <NeonCard shimmer={canPaint} className="p-2 md:p-3 aspect-square md:aspect-auto md:h-[calc(100vh-180px)] glow-primary">
              <CanvasGrid
                pixels={pixels}
                onPaint={onPaint}
                canPaint={canPaint}
                hoverColor={color}
                highlightWallet={focusMine ? wallet?.address ?? null : null}
                focusWallet={wallet?.address ?? null}
                focusKey={focusKey}
              />
            </NeonCard>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Wallet status */}
            <NeonCard className="p-5">
              {!isConnected ? (
                <div className="text-center py-2">
                  <PixlMascot mood="wave" size={80} className="mx-auto mb-2" />
                  <h3 className="font-display font-bold text-lg mb-1">Connect to paint</h3>
                  <p className="text-xs text-muted-foreground mb-4">PIXL needs your wallet to know your brush size.</p>
                  <WalletConnectButton />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">connected</div>
                      <div className="font-mono font-semibold mt-1">{shortAddress(wallet!.address)}</div>
                    </div>
                    <PixlMascot mood={cooldown.ready ? "cheer" : "sleep"} size={56} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <PixelBadge count={allowedPixels} label="allowed" variant="primary" />
                    <PixelBadge count={ownedPixelCount || usedPixels} total={allowedPixels} label="used" variant="secondary" />
                  </div>
                  <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    canvas loaded: {ownedPixelCount} owned pixels
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground uppercase tracking-wider">supply</span>
                      <span className="tabular-nums">{supplyPercent.toFixed(3)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-neon"
                        style={{ width: `${Math.min(100, supplyPercent * 10)}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                      <span>balance</span>
                      <span className="tabular-nums">{compactNumber(wallet!.balance)} $PIXL</span>
                    </div>
                  </div>
                </div>
              )}
            </NeonCard>

            {/* Cooldown */}
            {isConnected && (
              <NeonCard className="p-5 flex flex-col items-center">
                <CooldownRing
                  remainingMs={cooldown.remainingMs}
                  totalMs={APP_CONFIG.rules.cooldownMs}
                  size={150}
                />
              </NeonCard>
            )}

            {/* Color picker */}
            <NeonCard className="p-5">
              <ColorPicker value={color} onChange={setColor} disabled={!canPaint} />
              {canPaint && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs">Click any pixel on the canvas to paint.</span>
                </motion.div>
              )}
            </NeonCard>

            {/* Activity feed */}
            <NeonCard className="p-5 max-h-[420px] overflow-hidden">
              <ActivityFeed />
            </NeonCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
