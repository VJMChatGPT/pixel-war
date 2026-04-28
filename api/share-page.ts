import {
  buildShareBoardSvg,
  buildShareCardUrl,
  buildSharePath,
  getShareDisplayLabel,
  getShareFallbackAddress,
} from "../src/lib/share";
import { formatPoints } from "../src/lib/format";
import { fetchShareSnapshot, htmlEscape, isValidWalletAddress } from "./_share";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  const requestUrl = new URL(request.url);
  const wallet = requestUrl.searchParams.get("wallet")?.trim() ?? "";
  const origin = requestUrl.origin;

  if (!wallet || !isValidWalletAddress(wallet)) {
    return new Response("Invalid wallet", { status: 400 });
  }

  try {
    const snapshot = await fetchShareSnapshot(wallet);
    const displayLabel = getShareDisplayLabel(wallet, snapshot.walletState);
    const fallbackAddress = getShareFallbackAddress(wallet);
    const totalPoints = formatPoints(Number(snapshot.walletState?.total_points ?? 0), 1);
    const pointsPerSecond = formatPoints(Number(snapshot.walletState?.points_per_second ?? 0), 2);
    const boardSvg = buildShareBoardSvg({
      pixels: snapshot.pixels,
      walletAddress: wallet,
      width: 620,
      height: 620,
    });
    const boardDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(boardSvg)}`;
    const sharePath = buildSharePath(wallet);
    const shareCardUrl = buildShareCardUrl(wallet, origin);
    const description = `${displayLabel} controls ${snapshot.ownedPixels} pixels and is earning ${pointsPerSecond} pts/s on the live PIXL canvas.`;
    const pageTitle = `${displayLabel} on PIXL`;

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(pageTitle)}</title>
    <meta name="description" content="${htmlEscape(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${htmlEscape(pageTitle)}" />
    <meta property="og:description" content="${htmlEscape(description)}" />
    <meta property="og:url" content="${htmlEscape(origin + sharePath)}" />
    <meta property="og:image" content="${htmlEscape(shareCardUrl)}" />
    <meta property="og:site_name" content="PIXL" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${htmlEscape(pageTitle)}" />
    <meta name="twitter:description" content="${htmlEscape(description)}" />
    <meta name="twitter:image" content="${htmlEscape(shareCardUrl)}" />
    <meta name="theme-color" content="#120a22" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(157,77,255,0.18), transparent 28%),
          linear-gradient(145deg, #090611 0%, #120a22 46%, #1d1035 100%);
        color: #f7f0ff;
      }
      .wrap {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 40px 0 56px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
        gap: 28px;
        align-items: stretch;
      }
      .panel {
        border: 1px solid rgba(157,77,255,0.22);
        border-radius: 32px;
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(16px);
        box-shadow: 0 30px 90px rgba(0,0,0,0.34);
      }
      .copy {
        padding: 34px 34px 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 28px;
      }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(243,232,255,0.72);
        font-weight: 700;
      }
      h1 {
        margin: 10px 0 0;
        font-size: clamp(44px, 6vw, 74px);
        line-height: 0.96;
      }
      .sub {
        margin-top: 16px;
        color: rgba(243,232,255,0.78);
        font-size: 20px;
        line-height: 1.45;
        max-width: 30ch;
      }
      .address {
        margin-top: 14px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 13px;
        color: rgba(243,232,255,0.58);
        word-break: break-all;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .stat {
        border-radius: 22px;
        border: 1px solid rgba(157,77,255,0.22);
        background: rgba(255,255,255,0.05);
        padding: 16px 18px;
      }
      .stat-label {
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(243,232,255,0.62);
        font-weight: 700;
      }
      .stat-value {
        margin-top: 8px;
        font-size: clamp(24px, 3vw, 34px);
        font-weight: 800;
      }
      .cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        border-radius: 16px;
        padding: 0 18px;
        text-decoration: none;
        font-weight: 700;
        transition: transform 0.18s ease, background 0.18s ease;
      }
      .cta-primary {
        background: #9d4dff;
        color: #0b0613;
        box-shadow: 0 16px 36px rgba(157,77,255,0.34);
      }
      .cta-secondary {
        border: 1px solid rgba(255,255,255,0.14);
        color: #f7f0ff;
        background: rgba(255,255,255,0.04);
      }
      .cta:hover { transform: translateY(-1px); }
      .board {
        padding: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .board img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 26px;
      }
      .footer-note {
        margin-top: 18px;
        text-align: center;
        color: rgba(243,232,255,0.58);
        font-size: 13px;
      }
      @media (max-width: 980px) {
        .wrap { padding-top: 20px; }
        .hero { grid-template-columns: 1fr; }
        .stats { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <div class="panel copy">
          <div>
            <div class="eyebrow">PIXL • Live territory board</div>
            <h1>${htmlEscape(displayLabel)}</h1>
            <div class="sub">Controlling territory on the live pixel canvas and earning points over time.</div>
            <div class="address">${htmlEscape(fallbackAddress)}</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-label">Total points</div>
              <div class="stat-value">${htmlEscape(totalPoints)}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Points / sec</div>
              <div class="stat-value">${htmlEscape(pointsPerSecond)}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Pixels controlled</div>
              <div class="stat-value">${htmlEscape(String(snapshot.ownedPixels))}</div>
            </div>
          </div>

          <div class="cta-row">
            <a class="cta cta-primary" href="${htmlEscape(origin + "/canvas")}">Enter the live canvas</a>
            <a class="cta cta-secondary" href="${htmlEscape(origin)}">Open PIXL</a>
          </div>
        </div>

        <div class="panel board">
          <img src="${boardDataUri}" alt="PIXL territory board with highlighted owned pixels" />
        </div>
      </section>

      <div class="footer-note">
        Territory becomes passive points. Hold more area, climb faster, and defend your share of the live board.
      </div>
    </main>
  </body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Could not render share page", {
      status: 500,
    });
  }
}
