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
import { compactNumber, timeAgo, walletGradient } from "@/lib/format";
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
      fetchWalletPaints(wallet.address, 30),
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
  const trimmedDisplayNameDraft = displayNameDraft.trim();
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
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-base">Display name</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose how your wallet is shown on your profile. Leave it empty to fall back to your address.
                  </p>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
                  {displayLabel}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  value={displayNameDraft}
                  onChange={(event) => setDisplayNameDraft(event.target.value)}
                  maxLength={MAX_DISPLAY_NAME_LENGTH}
                  placeholder="Enter a display name"
                  className="font-mono"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {trimmedDisplayNameDraft.length}/{MAX_DISPLAY_NAME_LENGTH}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={savingDisplayName || (!walletState?.display_name && trimmedDisplayNameDraft.length === 0)}
                      onClick={() => {
                        setDisplayNameDraft("");
                        void saveDisplayName(null);
                      }}
                    >
                      Reset to address
                    </Button>
                    <Button
                      type="button"
                      disabled={!canSaveDisplayName}
                      onClick={() => void saveDisplayName()}
                    >
                      {savingDisplayName ? "Saving..." : "Save name"}
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                    Preview
                  </div>
                  <div className="font-mono text-sm font-semibold break-all">
                    {formatWalletDisplayName({
                      wallet: wallet!.address,
                      displayName: trimmedDisplayNameDraft || null,
                      currentWallet: wallet!.address,
                    })}
                  </div>
                </div>
              </div>
            </NeonCard>

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
