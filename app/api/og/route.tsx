import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "confession";
  const text = (searchParams.get("text") || "Anonim kal, içini dök.").slice(0, 180);
  const mood = searchParams.get("mood") || "";

  const label =
    type === "golge" ? "Bugün Gölge'de bunu gördüm…" : type === "profile" ? "Anonix profili" : "Bugün Anonix'te bu itirafı okudum…";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #0a0a14 55%, #06060b 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🎭
          </div>
          <div style={{ fontSize: "40px", fontWeight: 800 }}>Anonix</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "26px", color: "#a78bfa" }}>{label}</div>
          <div style={{ fontSize: "60px", fontWeight: 800, lineHeight: 1.15 }}>
            “{text}”
          </div>
          {mood ? (
            <div
              style={{
                fontSize: "26px",
                color: "#e2e8f0",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 20px",
                borderRadius: "9999px",
                alignSelf: "flex-start",
              }}
            >
              {mood}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div style={{ fontSize: "28px", color: "#94a3b8" }}>
          anonix · anonim itiraf platformu
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
