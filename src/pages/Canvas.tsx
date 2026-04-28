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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCanvas } from "@/hooks/useCanvas";
import { useWallet } from "@/hooks/useWallet";
import { useCooldown } from "@/hooks/useCooldown";
import { fetchWalletState, paintPixel, type PixelRow, type PublicWalletStateRow } from "@/services/pixels";
import { APP_CONFIG } from "@/config/app";
import { compactNumber, formatPoints, shortAddress } from "@/lib/format";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Brush, LocateFixed, Sparkles } from "lucide-react";

type PatchPixel = (x: number, y: number, pixel: PixelRow | null) => PixelRow | null;

function isStillOptimisticPixel(pixel: PixelRow | null | undefined, optimisticUpdatedAt: string) {
  return !!pixel && pixel.updated_at === optimisticUpdatedAt;
}

function rollbackOptimisticPixel({
  pixels,
  x,
  y,
  optimisticUpdatedAt,
  previousPixel,
  patchPixel,
}: {
  pixels: (PixelRow | null)[];
  x: number;
  y: number;
  optimisticUpdatedAt: string;
  previousPixel: PixelRow | null;
  patchPixel: PatchPixel;
}) {
  const currentPixel = pixels[y * APP_CONFIG.canvas.width + x];
  if (isStillOptimisticPixel(currentPixel, optimisticUpdatedAt)) {
    patchPixel(x, y, previousPixel);
  }
}

function isNoopPixelForWallet(
  pixel: PixelRow | null | undefined,
  walletAddress: string,
  nextColor: string
) {
  return (
    !!pixel &&
    pixel.owner_wallet === walletAddress &&
    pixel.color.toLowerCase() === nextColor.toLowerCase()
  );
}

function getBrushCells(x: number, y: number, brushSize: number) {
  const cells: Array<{ x: number; y: number }> = [];
  const startX = x - Math.floor((brushSize - 1) / 2);
  const startY = y - Math.floor((brushSize - 1) / 2);

  for (let offsetY = 0; offsetY < brushSize; offsetY++) {
    for (let offsetX = 0; offsetX < brushSize; offsetX++) {
      const nextX = startX + offsetX;
      const nextY = startY + offsetY;
      if (
        nextX < 0 ||
        nextX >= APP_CONFIG.canvas.width ||
        nextY < 0 ||
        nextY >= APP_CONFIG.canvas.height
      ) {
        continue;
      }
      cells.push({ x: nextX, y: nextY });
    }
  }

  return cells;
}

export default function CanvasPage() {
  const { pixels, revision, loading: canvasLoading, error: canvasError, patchPixel } = useCanvas();
  const { wallet, isConnected, allowedPixels, supplyPercent } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);
  const [color, setColor] = useState<string>(APP_CONFIG.palette[0]);
  const [brushSize, setBrushSize] = useState(1);
  const [pendingPaints, setPendingPaints] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const [focusMine, setFocusMine] = useState(false);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);
  const [pointsSnapshotAtMs, setPointsSnapshotAtMs] = useState(() => Date.now());
  const [pointsDisplayNowMs, setPointsDisplayNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!wallet) {
      setWalletState(null);
      return;
    }

    let cancelled = false;
    fetchWalletState(wallet.address).then((state) => {
      if (!cancelled) setWalletState(state);
    });

    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const cooldown = useCooldown(walletState?.last_paint_at);
  const usedPixels = walletState?.pixels_used ?? 0;
  const authoritativePointsTotal = walletState?.total_points ?? 0;
  const pointsPerSecond = walletState?.points_per_second ?? 0;
  const animatedPointsTotal =
    authoritativePointsTotal + Math.max(0, (pointsDisplayNowMs - pointsSnapshotAtMs) / 1000) * pointsPerSecond;
  const ownedPixelCount = useMemo(
    () => (wallet ? pixels.filter((pixel) => pixel?.owner_wallet === wallet.address).length : 0),
    [pixels, revision, wallet]
  );
  const displayUsedPixels = Math.min(allowedPixels, Math.max(ownedPixelCount, usedPixels));
  const displayLoadedOwnedPixels = Math.min(allowedPixels, ownedPixelCount);
  const hasPaintAuth = !!wallet && (wallet.isMock || !!wallet.sessionToken);
  const canPaint = isConnected && hasPaintAuth && cooldown.ready && allowedPixels > 0;
  const canvasSyncIssue = !canvasLoading && !canvasError && usedPixels > 0 && ownedPixelCount === 0;

  useEffect(() => {
    setPointsSnapshotAtMs(Date.now());
  }, [walletState?.total_points, walletState?.points_per_second, wallet?.address]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPointsDisplayNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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

  const paintOnePixel = async (
    x: number,
    y: number,
    options?: { silentSuccess?: boolean; silentError?: boolean }
  ) => {
    if (!wallet) {
      if (!options?.silentError) {
        toast.error("Connect your wallet to paint");
      }
      return false;
    }

    if (!cooldown.ready) {
      if (!options?.silentError) {
        toast.error("Paint slots full", {
          description: "You have already used every paint slot available in the current 15-minute window.",
        });
      }
      return false;
    }

    const currentPixel = pixels[y * APP_CONFIG.canvas.width + x];
    if (isNoopPixelForWallet(currentPixel, wallet.address, color)) {
      if (!options?.silentSuccess) {
        toast.message("No changes applied", {
          description: "That pixel already matches your current color and ownership.",
        });
      }
      return null;
    }

    setPendingPaints((value) => value + 1);
    const optimisticUpdatedAt = new Date().toISOString();
    const previousPixel = patchPixel(x, y, null);
    const optimisticPixel: PixelRow = {
      id: previousPixel?.id ?? -(Date.now() + x + y),
      x,
      y,
      color: color.toLowerCase(),
      owner_wallet: wallet.address,
      active: true,
      updated_at: optimisticUpdatedAt,
    };

    patchPixel(x, y, optimisticPixel);

    try {
      const res = await paintPixel({
        x,
        y,
        color,
        sessionToken: wallet.sessionToken ?? "",
      });

      if (!res.ok) {
        rollbackOptimisticPixel({
          pixels,
          x,
          y,
          optimisticUpdatedAt,
          previousPixel,
          patchPixel,
        });
        if (!options?.silentError) {
          toast.error("Paint blocked by server", {
            description: res.message ?? res.error ?? "Backend rules are enforced server-side.",
          });
        }
        return false;
      }

      if (res.changed === false || res.code === "NO_OP") {
        rollbackOptimisticPixel({
          pixels,
          x,
          y,
          optimisticUpdatedAt,
          previousPixel,
          patchPixel,
        });
        if (res.walletState) setWalletState(res.walletState);
        if (!options?.silentSuccess) {
          toast.message("No changes applied", {
            description: res.message ?? "That pixel already matched the requested state.",
          });
        }
        return null;
      }

      if (res.pixel && isStillOptimisticPixel(pixels[y * APP_CONFIG.canvas.width + x], optimisticUpdatedAt)) {
        patchPixel(x, y, { ...optimisticPixel, ...res.pixel, active: true });
      }

      if (res.evictedPixel) {
        patchPixel(res.evictedPixel.x, res.evictedPixel.y, { ...res.evictedPixel, active: true });
      }

      if (res.walletState) setWalletState(res.walletState);

      if (!options?.silentSuccess) {
        toast.success("Pixel painted!", {
          description: (
            <span className="font-mono text-xs">
              ({x},{y}) · <span style={{ color }}>{color}</span>
            </span>
          ),
        });
      }

      return true;
    } catch (error) {
      rollbackOptimisticPixel({
        pixels,
        x,
        y,
        optimisticUpdatedAt,
        previousPixel,
        patchPixel,
      });

      if (!options?.silentError) {
        toast.error("Paint failed", {
          description: error instanceof Error ? error.message : "The backend paint request could not be completed.",
        });
      }

      return false;
    } finally {
      setPendingPaints((value) => Math.max(0, value - 1));
    }
  };

  const onPaint = async (x: number, y: number) => {
    const attemptedCells = getBrushCells(x, y, brushSize);
    if (attemptedCells.length === 0 || !wallet) return;

    const cells = attemptedCells.filter((cell) => {
      const currentPixel = pixels[cell.y * APP_CONFIG.canvas.width + cell.x];
      return !isNoopPixelForWallet(currentPixel, wallet.address, color);
    });

    if (cells.length === 0) {
      toast.message("No changes applied", {
        description:
          attemptedCells.length === 1
            ? "That pixel already matches your current color and ownership."
            : `All ${attemptedCells.length} pixels in this ${brushSize}x${brushSize} brush already match your current color and ownership.`,
      });
      return;
    }

    if (cells.length === 1) {
      await paintOnePixel(cells[0].x, cells[0].y);
      return;
    }

    const results = await Promise.all(
      cells.map((cell) =>
        paintOnePixel(cell.x, cell.y, {
          silentSuccess: true,
          silentError: true,
        })
      )
    );

    const successCount = results.filter((result) => result === true).length;
    const noopCount = attemptedCells.length - cells.length + results.filter((result) => result === null).length;
    if (successCount > 0) {
      toast.success("Brush applied!", {
        description:
          noopCount > 0
            ? `${successCount} pixels changed, ${noopCount} already matched, in the ${brushSize}x${brushSize} brush.`
            : `${successCount}/${cells.length} pixels changed with the ${brushSize}x${brushSize} brush.`,
      });
      return;
    }

    if (noopCount > 0) {
      toast.message("No changes applied", {
        description: `The remaining ${noopCount} brush pixels already matched the requested state.`,
      });
      return;
    }

    toast.error("Brush paint failed", {
      description: "None of the selected pixels could be painted.",
    });
  };

  return (
    <Layout footer={false}>
      <div className="container py-6 md:py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl">The Canvas</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1">ready to leave your mark? drag to pan · scroll to zoom · click to paint</p>
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
                revision={revision}
                onPaint={onPaint}
                canPaint={canPaint}
                hoverColor={color}
                brushSize={brushSize}
                highlightWallet={focusMine ? wallet?.address ?? null : null}
                focusWallet={wallet?.address ?? null}
                focusKey={focusKey}
              />
            </NeonCard>
          </div>

          <div className="space-y-4">
            <NeonCard className="p-5">
              {!isConnected ? (
                <div className="text-center py-2">
                  <PixlMascot mood="wave" size={80} className="mx-auto mb-2" />
                  <h3 className="font-display font-bold text-lg mb-1">Ready to leave your mark?</h3>
                  <p className="text-xs text-muted-foreground mb-4">Connect your wallet, claim your slots, and start painting the canvas.</p>
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
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/80">total points</div>
                      <div className="font-display font-bold text-2xl mt-1">{formatPoints(animatedPointsTotal, 1)}</div>
                    </div>
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">points / sec</div>
                      <div className="font-display font-bold text-2xl mt-1">{formatPoints(pointsPerSecond, 2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <PixelBadge count={allowedPixels} label="allowed" variant="primary" />
                    <PixelBadge count={displayUsedPixels} total={allowedPixels} label="used" variant="secondary" />
                  </div>
                  <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    canvas loaded: {displayLoadedOwnedPixels} owned pixels
                  </div>
                  <div className="mb-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                      territory bonus
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      You are earning <span className="font-mono text-foreground font-semibold">{formatPoints(pointsPerSecond, 2)} pts/s</span> from{" "}
                      <span className="font-mono text-foreground font-semibold">{displayUsedPixels}</span> controlled pixels.
                    </div>
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

            {isConnected && (
              <NeonCard className="p-5 flex flex-col items-center">
                <CooldownRing
                  remainingMs={cooldown.remainingMs}
                  totalMs={APP_CONFIG.rules.cooldownMs}
                  size={150}
                />
              </NeonCard>
            )}

            <NeonCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-sm">Brush</h3>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Brush className="w-4 h-4" />
                  <span>{brushSize}x{brushSize}</span>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={`${brushSize}`}
                onValueChange={(value) => {
                  if (!value) return;
                  setBrushSize(Number(value));
                }}
                variant="outline"
                size="sm"
                className="justify-start mb-5"
              >
                <ToggleGroupItem value="1" aria-label="Brush 1x1">1x1</ToggleGroupItem>
                <ToggleGroupItem value="2" aria-label="Brush 2x2">2x2</ToggleGroupItem>
                <ToggleGroupItem value="3" aria-label="Brush 3x3">3x3</ToggleGroupItem>
              </ToggleGroup>

              <ColorPicker value={color} onChange={setColor} disabled={!canPaint} />
              {canPaint && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs">
                    {pendingPaints > 0
                      ? `Sending ${pendingPaints} paint${pendingPaints === 1 ? "" : "s"}... keep clicking.`
                      : `Click any pixel on the canvas to paint with the ${brushSize}x${brushSize} brush.`}
                  </span>
                </motion.div>
              )}
            </NeonCard>

            <NeonCard className="p-5 max-h-[420px] overflow-hidden">
              <ActivityFeed />
            </NeonCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
