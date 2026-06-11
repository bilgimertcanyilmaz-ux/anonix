/**
 * Anonim kullanıcı avatarı — kapüşonlu silüet (SVG).
 * MaskIcon'un yerine geçen, her boyutta net, tema-bağımsız premium görsel.
 * Aynı gradyan id'leri tüm örneklerde özdeş olduğundan çoğul kullanım güvenlidir.
 */
export function AnonymousAvatar({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="anon-bg" cx="50%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#2e1065" />
          <stop offset="55%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0b0817" />
        </radialGradient>
        <linearGradient id="anon-hood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="35%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#231a4d" />
        </linearGradient>
        <linearGradient id="anon-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="anon-face" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#120e26" />
          <stop offset="100%" stopColor="#05030c" />
        </radialGradient>
        <clipPath id="anon-clip">
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>

      <g clipPath="url(#anon-clip)">
        {/* Zemin */}
        <circle cx="32" cy="32" r="32" fill="url(#anon-bg)" />

        {/* Arka ışıltı */}
        <ellipse cx="32" cy="22" rx="20" ry="16" fill="#a855f7" opacity="0.12" />

        {/* Omuzlar */}
        <path
          d="M10 64 C10 48 18 42 32 42 C46 42 54 48 54 64 Z"
          fill="url(#anon-hood)"
        />
        {/* Kapüşon */}
        <path
          d="M32 7 C20.5 7 13.5 16 13.5 27.5 C13.5 36 17 41.5 19 46.5 L45 46.5 C47 41.5 50.5 36 50.5 27.5 C50.5 16 43.5 7 32 7 Z"
          fill="url(#anon-hood)"
        />
        {/* Kapüşon kenar ışığı */}
        <path
          d="M32 7 C20.5 7 13.5 16 13.5 27.5 C13.5 29 13.7 30.4 14 31.8 C14.8 19.5 22 10.5 32 10.5 C42 10.5 49.2 19.5 50 31.8 C50.3 30.4 50.5 29 50.5 27.5 C50.5 16 43.5 7 32 7 Z"
          fill="url(#anon-rim)"
          opacity="0.85"
        />
        {/* Yüz boşluğu */}
        <ellipse cx="32" cy="29.5" rx="11.5" ry="13" fill="url(#anon-face)" />
        {/* Gözler — gizemli ışıltı */}
        <g>
          <circle cx="27" cy="30" r="2.1" fill="#c4b5fd" />
          <circle cx="37" cy="30" r="2.1" fill="#c4b5fd" />
          <circle cx="27" cy="30" r="0.8" fill="#ffffff" />
          <circle cx="37" cy="30" r="0.8" fill="#ffffff" />
        </g>
        {/* Kapüşon ipi vurgusu */}
        <path
          d="M26 45 q6 3 12 0"
          stroke="#a78bfa"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
