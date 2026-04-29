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
import {
  fetchWalletPaints,
  fetchWalletState,
  updateWalletDisplayName,
  type PaintHistoryRow,
  type PublicWalletStateRow,
} from "@/services/pixels";
import { compactNumber, estimatePointsPerSecond, formatPoints, timeAgo, walletGradient } from "@/lib/format";
import { formatWalletDisplayName } from "@/lib/wallet-display";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const MAX_DISPLAY_NAME_LENGTH = 32;

export default function Profile() {
  const { wallet, isConnected, allowedPixels, supplyPercent } = useWallet();
  const [walletState, setWalletState] = useState<PublicWalletStateRow | null>(null);
  const [history, setHistory] = useState<PaintHistoryRow[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [pointsSnapshotAtMs, setPointsSnapshotAtMs] = useState(() => Date.now());
  const [pointsDisplayNowMs, setPointsDisplayNowMs] = useState(() => Date.now());
  const { pixels, revision, error: canvasError } = useCanvas();
  const [copied, setCopied] = useState(false);
  const cooldown = useCooldown(walletState?.last_paint_at);
  const ownedPixelCount = useMemo(
    () => (wallet ? pixels.filter((pixel) => pixel?.owner_wallet === wallet.address).length : 0),
    [pixels, revision, wallet]
  );
  const displayUsedPixels = Math.min(
    allowedPixels,
    Math.max(ownedPixelCount, walletState?.pixels_used ?? 0)
  );

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    setProfileError(null);
    Promise.all([
      fetchWalletState(wallet.address),
      fetchWalletPaints(wallet.address, 5),
    ])
      .then(([walletData, paintData]) => {
        if (cancelled) return;
        setWalletState(walletData);
        setHistory(paintData);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProfileError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [wallet]);

  useEffect(() => {
    setDisplayNameDraft(walletState?.display_name ?? "");
  }, [wallet?.address, walletState?.display_name]);

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

  if (!isConnected) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <PixlMascot mood="wave" size={120} className="mx-auto mb-6" />
          <h1 className="font-display font-bold text-3xl mb-2">Your mark is waiting</h1>
          <p className="text-muted-foreground mb-6">Connect your wallet to see the territory you control on the canvas.</p>
          <WalletConnectButton />
        </div>
      </Layout>
    );
  }

  const [a, b] = walletGradient(wallet!.address);
  const displayLabel = formatWalletDisplayName({
    wallet: wallet!.address,
    displayName: walletState?.display_name,
    currentWallet: wallet!.address,
  });
  const authoritativePointsTotal = walletState?.total_points ?? 0;
  const pointsPerSecond =
    walletState?.points_per_second && walletState.points_per_second > 0
      ? walletState.points_per_second
      : estimatePointsPerSecond(displayUsedPixels);
  const projectedPointsPerMinute = pointsPerSecond * 60;
  const projectedPointsPerHour = pointsPerSecond * 3600;
  const animatedPointsTotal =
    authoritativePointsTotal + Math.max(0, (pointsDisplayNowMs - pointsSnapshotAtMs) / 1000) * pointsPerSecond;
  const trimmedDisplayNameDraft = displayNameDraft.trim();
  const previewDisplayLabel = formatWalletDisplayName({
    wallet: wallet!.address,
    displayName: trimmedDisplayNameDraft || null,
    currentWallet: wallet!.address,
  });
  const hasDisplayNameChanges = trimmedDisplayNameDraft !== (walletState?.display_name ?? "");
  const canSaveDisplayName =
    !!wallet?.sessionToken &&
    !savingDisplayName &&
    trimmedDisplayNameDraft.length <= MAX_DISPLAY_NAME_LENGTH &&
    hasDisplayNameChanges;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet!.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const saveDisplayName = async (nextDisplayName: string | null = trimmedDisplayNameDraft || null) => {
    if (!wallet?.sessionToken) {
      toast.error("Reconnect your wallet to update your profile");
      return;
    }

    if (nextDisplayName && nextDisplayName.length > MAX_DISPLAY_NAME_LENGTH) {
      toast.error("Display name too long", {
        description: `Use ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
      });
      return;
    }

    setSavingDisplayName(true);
    try {
      const result = await updateWalletDisplayName({
        displayName: nextDisplayName,
        sessionToken: wallet.sessionToken,
      });

      if (!result.ok || !result.walletState) {
        toast.error("Could not save display name", {
          description: result.message ?? result.error ?? "Try again in a moment.",
        });
        return;
      }

      setWalletState(result.walletState);
      setDisplayNameDraft(result.walletState.display_name ?? "");
      toast.success(result.walletState.display_name ? "Display name updated" : "Display name cleared");
    } catch (error) {
      toast.error("Could not save display name", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSavingDisplayName(false);
    }
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
              <span className="font-mono font-bold text-lg md:text-2xl truncate">{displayLabel}</span>
              <Button size="icon" variant="ghost" onClick={copyAddress} className="h-8 w-8 shrink-0">
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1 break-all">
              {wallet!.address}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <PixelBadge count={allowedPixels} label="allowed" variant="primary" />
              <PixelBadge count={displayUsedPixels} label="painted" variant="secondary" />
              <PixelBadge count={Number(supplyPercent.toFixed(3)) as any} label="% supply" variant="accent" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/80">total points</div>
                <div className="font-display font-bold text-2xl mt-1">{formatPoints(animatedPointsTotal, 1)}</div>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">points / second</div>
                <div className="font-display font-bold text-2xl mt-1">{formatPoints(pointsPerSecond, 2)}</div>
              </div>
            </div>
          </div>
          <PixlMascot mood={cooldown.ready ? "cheer" : "sleep"} size={90} className="hidden md:block" />
        </NeonCard>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* My pixels canvas */}
          <NeonCard className="p-3">
            <div className="flex items-center justify-between mb-2 px-2 pt-1">
              <h2 className="font-display font-bold text-lg">My mark</h2>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                only your pixels are highlighted
              </span>
            </div>
            <div className="aspect-square">
              <CanvasGrid pixels={pixels} revision={revision} highlightWallet={wallet!.address} />
            </div>
          </NeonCard>

          <div className="space-y-4">
            <NeonCard className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-base">Display name</h3>
                  <div className="mt-1 font-mono text-xs text-muted-foreground truncate">
                    {previewDisplayLabel}
                  </div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
                  profile
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={displayNameDraft}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    placeholder="Enter a display name"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    disabled={!canSaveDisplayName}
                    onClick={() => void saveDisplayName()}
                    className="sm:min-w-[92px]"
                  >
                    {savingDisplayName ? "Saving..." : "Save"}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="font-mono text-muted-foreground truncate">
                    {walletState?.display_name ? wallet!.address : "Using wallet address by default"}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-muted-foreground">
                      {trimmedDisplayNameDraft.length}/{MAX_DISPLAY_NAME_LENGTH}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={savingDisplayName || (!walletState?.display_name && trimmedDisplayNameDraft.length === 0)}
                      onClick={() => {
                        setDisplayNameDraft("");
                        void saveDisplayName(null);
                      }}
                      className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </NeonCard>

            <NeonCard className="p-5 flex flex-col items-center">
              <div className="w-full rounded-xl border border-border bg-muted/20 px-4 py-4 mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Territory bonus
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  You are earning <span className="font-mono text-foreground font-semibold">{formatPoints(pointsPerSecond, 2)} pts/s</span> from{" "}
                  <span className="font-mono text-foreground font-semibold">{displayUsedPixels}</span> controlled pixels.
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">per minute</div>
                    <div className="font-display font-bold text-lg mt-1">+{formatPoints(projectedPointsPerMinute, 1)}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">per hour</div>
                    <div className="font-display font-bold text-lg mt-1">+{formatPoints(projectedPointsPerHour, 1)}</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground mt-3">
                  More territory means more passive points every second.
                </div>
              </div>

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

            <NeonCard className="p-5 max-h-[400px] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <h3 className="font-display font-semibold text-sm mb-3">Recent paints</h3>
              {history.length === 0 && (
                <div className="text-xs text-muted-foreground font-mono text-center py-6">
                  No paints yet — go leave your first mark.
                </div>
              )}
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30">
                    <div className="flex gap-0.5">
                      <span className="w-3 h-3 rounded-sm border border-border" style={{ background: h.old_color ?? "#0a0a14" }} />
                      <span className="w-3 h-3 rounded-sm border border-border" style={{ background: h.new_color, boxShadow: `0 0 6px ${h.new_color}66` }} />
                    </div>
                    <span className="font-mono text-xs flex-1 min-w-0 truncate">pixel #{h.pixel_id}</span>
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
