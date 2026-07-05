/**
 * İstemci tarafı içerik moderasyonu — paylaşımdan önce hızlı kontrol.
 * (Sunucu tarafında ayrıca DB trigger'ı yasaklı kelime + telefon/11 hane kontrolü yapar.)
 */

export interface ModerationResult {
  allowed: boolean;
  reasons: string[];
  severity: "low" | "medium" | "high";
}

/** Engellenen içerik için kullanıcıya gösterilecek standart mesaj. */
export const MODERATION_BLOCK_MESSAGE =
  "Paylaşımınız topluluk kurallarına aykırı ifadeler içeriyor. Lütfen kişisel bilgi, tehdit, hakaret, müstehcen/cinsel içerik veya yasa dışı içerik paylaşmayın.";

// Yerleşik yasaklı kelime listesi (admin DB'den ayrıca genişletilir).
const BANNED_WORDS = [
  "orospu",
  "piç",
  "yavşak",
  "gerizekalı",
  "salak",
  "aptal",
  "ananı",
  "amına",
  "siktir",
];

const THREAT_PATTERNS = [
  "öldürece",
  "gebertir",
  "geberteceğim",
  "seni bulurum",
  "ölürsün",
  "kanını akıt",
  "yakarım seni",
  "mahvederim",
];

// Tam kelime olarak aranır (alt-dizi DEĞİL) — "kaptı"/"dairesel" gibi yanlış eşleşmeleri önler.
const ADDRESS_KEYWORDS = [
  "mahalle",
  "mahallesi",
  "sokak",
  "sokağı",
  "cadde",
  "caddesi",
  "apartman",
  "apartmanı",
  "daire",
  "blok",
  "bulvar",
];
// Kısaltmalar — nokta/iki nokta içerdikleri için alt-dizi riski düşük.
const ADDRESS_ABBR = ["mah.", "sok.", "cad.", "apt.", "no:", "no.", "kat:"];

const SPAM_DOMAINS = ["bit.ly", "t.me", "wa.me", "tinyurl", "telegram.me"];

// Cinsel aşağılama / müstehcen hakaret
const SEXUAL_INSULT_WORDS = [
  "siki",
  "sikini",
  "yarrak",
  "yarak",
  "amcık",
  "amcik",
  "götveren",
  "ibne",
  "pezevenk",
  "gavat",
  "kaltak",
  "sürtük",
  "orospu çocuğu",
];

// Kişisel ifşa / rıza dışı görsel ima eden ifadeler
const EXPOSURE_KEYWORDS = [
  "ifşa",
  "ifsa",
  "çıplak fotoğraf",
  "çıplak foto",
  "çıplak resim",
  "gizli çekim",
  "intikam pornosu",
  "frikik",
];

// Müstehcen / pornografik cinsel içerik — grafik cinsel eylem ve anlatımlar.
// (App Store Guideline 1.2 uyumu: explicit/pornografik UGC engellenmeli.)
// NOT: "sevmek", "öpüşmek", "aşk" gibi masum/duygusal ifadeler BİLEREK listede
// değil — yalnızca açıkça pornografik niyet taşıyan eylem/argo terimler.
const EXPLICIT_SEXUAL_WORDS = [
  "sikiş",
  "sikiştik",
  "sikişmek",
  "sikiştim",
  "sikti",
  "siktim",
  "düzüştük",
  "düzüşmek",
  "boşaldım",
  "boşaldı",
  "boşal",
  "orgazm",
  "mastürbasyon",
  "otuzbir",
  "31 çekmek",
  "azdım",
  "azdırdı",
  "tahrik oldum",
  "içime boşal",
  "içine boşal",
  "amıma",
  "amını",
  "amına sok",
  "götten",
  "göt deliği",
  "anal seks",
  "oral seks",
  "sakso",
  "klitoris",
  "penisimi",
  "vajinama",
  "döl",
  "meni",
  "porno",
  "pornografik",
  "seks yaptık",
  "seks yaptım",
  "sevişirken",
  "memelerini",
  "göğüslerini emdim",
];

// Buluşma / eskort / uygunsuz teklif çağrıları (App Store Guideline 1.1 — objectionable).
// Anonim itiraf platformunu buluşma/seks-satış aracına çeviren ifadeler engellenir.
const SOLICITATION_PATTERNS = [
  "escort",
  "eskort",
  "sponsor arıyorum",
  "sponsor aranıyor",
  "sugar daddy",
  "sugar baby",
  "görüntülerimi para",
  "görüntü karşılığı",
  "video karşılığı para",
  "para karşılığı görüş",
  "ücretli görüş",
  "seks partneri",
  "cinsel partner",
  "yatak arkadaşı arıyorum",
  "kaçamak arıyorum",
  "kaçamak isteyen",
  "gizli buluşalım",
];

function normalize(text: string): string {
  return text.toLocaleLowerCase("tr-TR");
}

/** Yasaklı kelimeleri bulur. */
export function checkBannedWords(text: string): string[] {
  const t = normalize(text);
  return BANNED_WORDS.filter((w) => {
    const re = new RegExp(`(^|[^a-zçğıöşü])${w}([^a-zçğıöşü]|$)`, "i");
    return re.test(t);
  });
}

/** Telefon numarası kalıbı (TR). */
export function detectPhoneNumber(text: string): boolean {
  const compact = text.replace(/[\s().-]/g, "");
  return /(\+?90|0)?5\d{9}/.test(compact) || /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/.test(text);
}

/** 11 haneli sayı dizisi (TC kimlik benzeri). */
export function detectTCKNLikeNumber(text: string): boolean {
  const compact = text.replace(/[\s.-]/g, "");
  return /\b\d{11}\b/.test(compact) || /\d{11}/.test(compact);
}

/** Açık adres ifadeleri. Gerçek adres = en az iki ipucu VE bir sayı (kapı/kat no). */
export function detectAddressLikeText(text: string): boolean {
  const t = normalize(text);
  let hits = 0;
  for (const w of ADDRESS_KEYWORDS) {
    const re = new RegExp(`(^|[^a-zçğıöşü])${w}([^a-zçğıöşü]|$)`, "i");
    if (re.test(t)) hits++;
  }
  for (const a of ADDRESS_ABBR) {
    if (t.includes(a)) hits++;
  }
  // Sayı yoksa (kapı/kat numarası) açık adres saymayız — duygusal metinlerde FP'yi keser.
  return hits >= 2 && /\d/.test(text);
}

/** Tehdit ifadeleri. */
export function detectThreatText(text: string): boolean {
  const t = normalize(text);
  return THREAT_PATTERNS.some((p) => t.includes(p));
}

/** Spam linkler / aşırı link / tekrarlı karakter spamı. */
export function detectSpamLinks(text: string): boolean {
  const t = normalize(text);
  const urlCount = (text.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount >= 3) return true;
  if (SPAM_DOMAINS.some((d) => t.includes(d))) return true;
  if (/(.)\1{9,}/.test(text)) return true; // aynı karakter 10+ tekrar
  return false;
}

/** Cinsel aşağılama / müstehcen hakaret. */
export function detectSexualInsult(text: string): boolean {
  const t = normalize(text);
  return SEXUAL_INSULT_WORDS.some((w) => {
    const re = new RegExp(`(^|[^a-zçğıöşü])${w}([^a-zçğıöşü]|$)`, "i");
    return re.test(t);
  });
}

/** Kişisel ifşa / rıza dışı görsel ima. */
export function detectExposure(text: string): boolean {
  const t = normalize(text);
  return EXPOSURE_KEYWORDS.some((k) => t.includes(k));
}

/** Müstehcen / pornografik cinsel içerik. */
export function detectExplicitSexual(text: string): boolean {
  const t = normalize(text);
  return EXPLICIT_SEXUAL_WORDS.some((w) => {
    // Çok kelimeli kalıplar (boşluk içerenler) doğrudan alt-dizi olarak aranır.
    if (w.includes(" ")) return t.includes(w);
    // Tek kelimeler tam kelime sınırıyla aranır (yanlış eşleşmeyi azaltır).
    const re = new RegExp(`(^|[^a-zçğıöşü])${w}([^a-zçğıöşü]|$)`, "i");
    return re.test(t);
  });
}

/** Buluşma / eskort / uygunsuz teklif çağrısı. */
export function detectSolicitation(text: string): boolean {
  const t = normalize(text);
  return SOLICITATION_PATTERNS.some((p) => t.includes(p));
}

/** Tüm kontrolleri birleştirir. */
export function moderateText(text: string): ModerationResult {
  const reasons: string[] = [];
  let severity: ModerationResult["severity"] = "low";

  if (checkBannedWords(text).length > 0) {
    reasons.push("Hakaret / küfür");
    severity = "high";
  }
  if (detectSexualInsult(text)) {
    reasons.push("Cinsel aşağılama");
    severity = "high";
  }
  if (detectExposure(text)) {
    reasons.push("Kişisel ifşa / rıza dışı içerik");
    severity = "high";
  }
  if (detectExplicitSexual(text)) {
    reasons.push("Müstehcen / cinsel içerik");
    severity = "high";
  }
  if (detectSolicitation(text)) {
    reasons.push("Buluşma / uygunsuz teklif");
    severity = "high";
  }
  if (detectThreatText(text)) {
    reasons.push("Tehdit ifadesi");
    severity = "high";
  }
  if (detectTCKNLikeNumber(text)) {
    reasons.push("Kimlik numarası benzeri dizi");
    severity = "high";
  }
  if (detectPhoneNumber(text)) {
    reasons.push("Telefon numarası");
    severity = "high";
  }
  if (detectAddressLikeText(text)) {
    reasons.push("Açık adres bilgisi");
    if (severity !== "high") severity = "medium";
  }
  if (detectSpamLinks(text)) {
    reasons.push("Spam / aşırı tekrar");
    if (severity === "low") severity = "medium";
  }

  return { allowed: reasons.length === 0, reasons, severity };
}
