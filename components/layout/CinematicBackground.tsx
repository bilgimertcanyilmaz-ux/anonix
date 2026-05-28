/**
 * Sabit konumda yüzen blob'lar — cinematic derinlik.
 * Layout'a bir kere mount edilir, body'nin önünde negatif z-index ile durur.
 * GPU-friendly (sadece transform/opacity).
 */
export function CinematicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Sol üst — neon purple blob */}
      <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl animate-blob-drift" />
      {/* Sağ üst — electric blue */}
      <div
        className="absolute -right-24 top-10 h-[24rem] w-[24rem] rounded-full bg-accent-500/15 blur-3xl animate-blob-drift"
        style={{ animationDelay: "3s" }}
      />
      {/* Sağ alt — magenta */}
      <div
        className="absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-neon-magenta/15 blur-3xl animate-blob-drift"
        style={{ animationDelay: "6s" }}
      />
      {/* Sol alt — deep violet */}
      <div
        className="absolute -left-20 -bottom-20 h-[26rem] w-[26rem] rounded-full bg-brand-700/25 blur-3xl animate-blob-drift"
        style={{ animationDelay: "9s" }}
      />
      {/* Hafif vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_60%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}
