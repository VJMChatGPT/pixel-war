import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, clamp, easeOut} from "../constants";
import {
  BrowserFrame,
  GlassPanel,
  MascotActor,
  SceneShell,
  WalletButtonMock,
  WalletModalMock,
} from "../components/visuals";
import {fade, monoStyle, textStyle} from "../primitives";

export const ConnectWalletScene = () => {
  const frame = useCurrentFrame();
  const enter = fade(frame, 0, 34);
  const modal = fade(frame, 40, 74);
  const connected = fade(frame, 110, 148);

  return (
    <SceneShell label="03 / wallet" progressLabel="visual mock · no real connection">
      <div
        style={{
          position: "absolute",
          left: 132,
          top: 168,
          width: 560,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px)`,
        }}
      >
        <div style={{...monoStyle, color: COLORS.lavender, fontSize: 14, textTransform: "uppercase", marginBottom: 18}}>
          wallet-gated painting
        </div>
        <div style={{...textStyle, fontSize: 72, fontWeight: 950, lineHeight: 0.94}}>
          Connect once.
          <br />
          Your paint capacity appears.
        </div>
        <div style={{...textStyle, color: COLORS.muted, fontSize: 24, lineHeight: 1.42, marginTop: 26}}>
          The video flow is fully mocked, but the product idea stays clear: a wallet gives each player an identity and a place on the board.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 164,
          top: 162,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
        }}
      >
        <BrowserFrame title="pixelwarcoin.com/canvas" style={{width: 800, height: 650}}>
          <div style={{padding: 34}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div>
                <div style={{...textStyle, fontSize: 30, fontWeight: 900}}>The Canvas</div>
                <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, marginTop: 6}}>ready to leave your mark?</div>
              </div>
              <div style={{opacity: 1 - connected, transform: `scale(${1 + modal * 0.04})`}}>
                <WalletButtonMock large />
              </div>
              <div style={{position: "absolute", right: 34, top: 34, opacity: connected}}>
                <WalletButtonMock connected large />
              </div>
            </div>
            <GlassPanel style={{borderRadius: 24, padding: 28, marginTop: 46}}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div>
                  <div style={{...monoStyle, color: COLORS.muted, fontSize: 12, textTransform: "uppercase"}}>paint capacity</div>
                  <div style={{...textStyle, fontSize: 58, fontWeight: 950, marginTop: 8}}>
                    {Math.round(interpolate(connected, [0, 1], [0, 64]))}
                    <span style={{fontSize: 25, color: COLORS.muted}}> pixels</span>
                  </div>
                </div>
                <MascotActor mood={connected > 0.5 ? "happy" : "normal"} size={112} reactAt={128} />
              </div>
              <div style={{height: 12, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden", marginTop: 26}}>
                <div
                  style={{
                    width: `${interpolate(connected, [0, 1], [4, 70])}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.lavender})`,
                    boxShadow: "0 0 28px rgba(138,77,255,0.45)",
                  }}
                />
              </div>
            </GlassPanel>
          </div>
        </BrowserFrame>
      </div>

      <div
        style={{
          position: "absolute",
          right: 314,
          top: 278,
          opacity: modal * (1 - fade(frame, 152, 176)),
          transform: `translateY(${interpolate(modal, [0, 1], [42, 0])}px) scale(${interpolate(modal, [0, 1], [0.94, 1])})`,
        }}
      >
        <WalletModalMock progress={interpolate(frame, [48, 158], [0, 1], clamp)} />
      </div>
    </SceneShell>
  );
};
