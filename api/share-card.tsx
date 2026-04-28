import React from "react";
import { ImageResponse } from "@vercel/og";
import {
  buildShareBoardSvg,
  getShareDisplayLabel,
  getShareFallbackAddress,
} from "../src/lib/share";
import { formatPoints } from "../src/lib/format";
import { fetchShareSnapshot, isValidWalletAddress } from "./_share";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim() ?? "";

  if (!wallet || !isValidWalletAddress(wallet)) {
    return new Response("Invalid wallet", { status: 400 });
  }

  try {
    const snapshot = await fetchShareSnapshot(wallet);
    const displayLabel = getShareDisplayLabel(wallet, snapshot.walletState);
    const addressLabel = getShareFallbackAddress(wallet);
    const totalPoints = formatPoints(Number(snapshot.walletState?.total_points ?? 0), 1);
    const pointsPerSecond = formatPoints(Number(snapshot.walletState?.points_per_second ?? 0), 2);
    const boardSvg = buildShareBoardSvg({
      pixels: snapshot.pixels,
      walletAddress: wallet,
      width: 470,
      height: 470,
    });
    const boardDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(boardSvg)}`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #090611 0%, #140a25 48%, #1d0f34 100%)",
            color: "#f8f2ff",
            position: "relative",
            overflow: "hidden",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              opacity: 0.22,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -120,
              left: -60,
              width: 320,
              height: 320,
              borderRadius: 999,
              background: "rgba(157,77,255,0.18)",
              boxShadow: "0 0 140px 90px rgba(157,77,255,0.16)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 650,
              padding: "68px 54px",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    fontSize: 20,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: "rgba(243,232,255,0.72)",
                    fontWeight: 700,
                  }}
                >
                  PIXL • Live territory board
                </div>
                <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.05 }}>{displayLabel}</div>
                <div style={{ fontSize: 24, color: "rgba(243,232,255,0.74)" }}>{addressLabel}</div>
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.35, color: "rgba(248,242,255,0.88)" }}>
                Earning points over time by controlling live territory on the PIXL canvas.
              </div>
            </div>

            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "TOTAL POINTS", value: totalPoints },
                { label: "POINTS / SEC", value: pointsPerSecond },
                { label: "PIXELS", value: String(snapshot.ownedPixels) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    width: 170,
                    padding: "20px 22px",
                    borderRadius: 24,
                    border: "1px solid rgba(157,77,255,0.28)",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: 2.2,
                      textTransform: "uppercase",
                      color: "rgba(243,232,255,0.68)",
                      fontWeight: 700,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800 }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              width: 550,
              padding: "50px 48px 50px 0",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 500,
                height: 500,
                padding: 22,
                borderRadius: 40,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(157,77,255,0.24)",
                boxShadow: "0 28px 80px rgba(0,0,0,0.36)",
              }}
            >
              <img
                src={boardDataUri}
                width={456}
                height={456}
                style={{ borderRadius: 28, objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "rgba(243,232,255,0.8)",
                textAlign: "center",
                maxWidth: 480,
                lineHeight: 1.35,
              }}
            >
              Own pixels. Earn points. Compete for territory on the live PIXL board.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "rgba(243,232,255,0.55)",
              }}
            >
              {origin.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Could not generate share card", {
      status: 500,
    });
  }
}
