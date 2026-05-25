"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const SUBJECTS = ["Destek", "Şikayet", "Hesap", "Plus Üyelik", "Hukuki Talep", "Diğer"];

export function ContactForm() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Mesaj en az 10 karakter olmalı.");
      return;
    }
    // Şimdilik gerçek gönderim yok — yapı hazır.
    setSent(true);
  }

  if (sent) {
    return (
      <Alert tone="success">
        Talebiniz alınmıştır. En kısa sürede size dönüş yapacağız.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="space-y-1.5">
        <label htmlFor="subject" className="block text-sm font-medium text-slate-300">
          Konu
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/60"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="email"
        type="email"
        label="E-posta"
        placeholder="ornek@eposta.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium text-slate-300">
          Mesaj
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Talebini detaylı şekilde yaz..."
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
        />
      </div>

      <Button type="submit" className="w-full">
        Gönder
      </Button>
    </form>
  );
}
