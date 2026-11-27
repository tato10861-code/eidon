import { ImageResponse } from "next/og";

export const alt = "Eidon — The AI Employee Company";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#05060a",
        padding: "64px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -220,
          left: 260,
          width: 760,
          height: 560,
          borderRadius: 999,
          background: "rgba(124,140,255,0.16)",
          filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -260,
          right: -80,
          width: 560,
          height: 560,
          borderRadius: 999,
          background: "rgba(203,255,90,0.12)",
          filter: "blur(120px)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#CBFF5A",
            fontSize: 26,
          }}
        >
          ◆
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#F3F5F9", letterSpacing: -1 }}>
          eidon<span style={{ color: "#CBFF5A" }}>.</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 84,
            lineHeight: 1.02,
            letterSpacing: -3,
            color: "#F3F5F9",
            maxWidth: 900,
          }}
        >
          <span>Hire AI employees</span>
          <span>
            that actually <span style={{ color: "#CBFF5A", fontStyle: "italic" }}>ship.</span>
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#98A2B3", maxWidth: 780 }}>
          Sales · Data · Support · Finance · Legal · Engineering · Recruiting
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          paddingTop: 26,
          fontSize: 22,
          color: "#98A2B3",
        }}
      >
        <span>The AI employee company</span>
        <span style={{ color: "#CBFF5A" }}>eidon.ai</span>
      </div>
    </div>,
    size,
  );
}
