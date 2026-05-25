/**
 * Anonix uygulamasının temel veri tipleri.
 * Bu tipler ilerleyen aşamalarda Supabase tablolarıyla eşleşecek şekilde genişletilecek.
 */

export type Gender = "male" | "female" | "other";

/** Kullanıcı rütbeleri (puan sistemiyle yükselir). */
export type Rank =
  | "Çaylak"
  | "Sırdaş"
  | "Gizemli"
  | "Efsane"
  | "Anonix Pro";

export interface Confession {
  id: string;
  content: string;
  /** Anonim rumuz (gerçek kimlik asla gösterilmez). */
  alias: string;
  gender: Gender;
  rank: Rank;
  likes: number;
  comments: number;
  /** ISO tarih ya da "2 saat önce" gibi gösterim metni. */
  createdAt: string;
  tags?: string[];
  isPlus?: boolean;
}

export interface RankInfo {
  rank: Rank;
  minPoints: number;
  icon: string;
  description: string;
}

export interface UserProfileSummary {
  alias: string;
  gender: Gender;
  rank: Rank;
  points: number;
  isPlus: boolean;
}

/**
 * Supabase `profiles` tablosundaki kullanıcı profili.
 * Alan adları veritabanıyla bire bir eşleşir (snake_case).
 */
export interface Profile {
  id: string;
  username: string;
  gender: Gender;
  avatar_url: string | null;
  is_anonymous: boolean;
  is_plus: boolean;
  points: number;
  rank: string;
  created_at: string;
  updated_at: string;
}

/** Kayıt formundan toplanan veriler. */
export interface SignUpData {
  username: string;
  email: string;
  password: string;
  gender: Gender;
  isAnonymous: boolean;
}
