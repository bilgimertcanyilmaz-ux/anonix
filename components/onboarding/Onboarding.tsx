"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { trackEvent } from "@/lib/analytics";

const SCREENS = [
  {
    icon: "🎭",
    title: "Anonim paylaş",
    desc: "Kim olduğunu söylemeden içini dök. Kimliğin gizli, sözün özgür.",
  },
  {
    icon: "🌙",
    title: "Gölge",
    desc: "Bir fotoğraf, bir cümle. Anonim kareler ve gizli hikayeler.",
  },
  {
    icon: "💬",
    title: "Plus mesajlaşma",
    desc: "Plus üyelerle özel, anonim mesajlaş. Kimliğin yine gizli kalır.",
  },
  {
    icon: "🛡️",
    title: "Güvenli topluluk",
    desc: "Aktif moderasyon, şikayet, engelleme. Saygılı ve güvenli bir alan.",
  },
];

const FLAG = "anonix-onboarded";

export function Onboarding() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === SCREENS.length - 1;

  function finish() {
    try {
      localStorage.setItem(FLAG, "1");
    } catch {
      /* yok say */
    }
    void trackEvent("onboarding_completed", { steps: SCREENS.length });
    router.push("/");
  }

  const s = SCREENS[i];

  return (
    <Container>
      <div className="flex min-h-[80vh] flex-col py-6">
        <div className="flex justify-end">
          <button onClick={finish} className="text-sm font-medium text-slate-400 hover:text-white">
            Atla
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-gradient text-5xl shadow-glow">
            {s.icon}
          </div>
          <h1 className="text-2xl font-extrabold text-white">{s.title}</h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">{s.desc}</p>
        </div>

        {/* Noktalar */}
        <div className="mb-6 flex justify-center gap-2">
          {SCREENS.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === i ? "w-6 bg-brand-500" : "w-2 bg-white/15"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (last ? finish() : setI((v) => v + 1))}
          className="w-full rounded-full bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          {last ? "Başla" : "İleri"}
        </button>
      </div>
    </Container>
  );
}
