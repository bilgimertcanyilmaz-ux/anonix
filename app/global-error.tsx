"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06060b",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Kritik bir hata oluştu</h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>
            Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  );
}
