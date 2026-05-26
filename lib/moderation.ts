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
  "Paylaşımınız topluluk kurallarına aykırı ifadeler içeriyor. Lütfen kişisel bilgi, tehdit, hakaret veya yasa dışı içerik paylaşmayın.";

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

const ADDRESS_KEYWORDS = [
  "mahalle",
  "mah.",
  "sokak",
  "sok.",
  "cadde",
  "cad.",
  "apartman",
  "apt",
  "kat ",
  "daire",
  "no:",
  "blok",
];

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

/** Açık adres ifadeleri. */
export function detectAddressLikeText(text: string): boolean {
  const t = normalize(text);
  const hits = ADDRESS_KEYWORDS.filter((k) => t.includes(k)).length;
  return hits >= 2; // en az iki adres ipucu birlikte
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
