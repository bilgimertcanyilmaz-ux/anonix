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
  role: string;
  is_banned: boolean;
  banned_reason: string | null;
  plus_expires_at: string | null;
  subscription_type: string | null;
  /** Abonelik paketi: free | plus | ultra_plus (Stage 16). */
  subscription_tier: string;
  /** Günlük boost hakkı (Plus 1, Ultra Plus 3). */
  plus_boosts: number;
  iyzico_customer_id: string | null;
  streak_count: number;
  last_active_date: string | null;
  longest_streak: number;
  referral_code: string | null;
  referred_by: string | null;
  theme_preference: string;
  notification_sound_enabled: boolean;
  message_sound_enabled: boolean;
  is_beta_user: boolean;
  beta_invite_code: string | null;
  /** Yaş onayı (17+). OAuth ile gelen kullanıcılarda başlangıçta false olur. */
  age_confirmed: boolean;
  age_confirmed_at: string | null;
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
  ageConfirmed: boolean;
  referralCode?: string | null;
  inviteCode?: string | null;
}

/** İtiraf/yorum kartlarında gösterilen yazar bilgisi (profiles ilişkisinden). */
export interface ConfessionAuthor {
  username: string;
  gender: Gender;
  is_anonymous: boolean;
  avatar_url?: string | null;
}

/** Supabase `confessions` tablosundaki bir itiraf kaydı. */
export interface ConfessionRecord {
  id: string;
  user_id: string;
  content: string;
  mood_tag: string | null;
  /** Kategori (Stage 15). Yeni paylaşımlarda mood_tag ile aynı değere yazılır. */
  category?: string | null;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  moderation_status?: string;
  created_at: string;
  updated_at: string;
  /** Embedded yazar (profiles ilişkisi). */
  profiles?: ConfessionAuthor | null;
}

/** Supabase `confession_comments` tablosundaki bir yorum kaydı. */
export interface CommentRecord {
  id: string;
  confession_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  profiles?: ConfessionAuthor | null;
}

/** Supabase `conversations` tablosundaki bir konuşma. */
export interface Conversation {
  id: string;
  confession_id: string | null;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  updated_at: string;
  /** Embedded itiraf önizlemesi. */
  confessions?: { content: string; is_anonymous: boolean } | null;
}

/** Supabase `messages` tablosundaki bir mesaj. */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** Supabase `golge_posts` tablosundaki fotoğraflı paylaşım. */
export interface GolgePost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  overlay_text: string | null;
  overlay_style: string | null;
  mood_tag: string | null;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  moderation_status?: string;
  created_at: string;
  updated_at: string;
  profiles?: ConfessionAuthor | null;
}

/** Supabase `golge_comments` tablosundaki yorum. */
export interface GolgeComment {
  id: string;
  golge_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: ConfessionAuthor | null;
}

/** Supabase `notifications` tablosundaki bildirim. */
export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Supabase `daily_tasks` tablosundaki görev tanımı. */
export interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  target_count: number;
  reward_points: number;
  is_active: boolean;
  created_at: string;
}

/** Kullanıcının bir görevdeki günlük ilerlemesi. */
export interface UserDailyTask {
  id: string;
  user_id: string;
  task_id: string;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
  task_date: string;
}

/** Görev + kullanıcı ilerlemesi birleşik gösterim. */
export interface TaskWithProgress extends DailyTask {
  progress: number;
  is_completed: boolean;
}

/** Supabase `badges` tablosundaki rozet. */
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  required_points: number;
  badge_type: string;
  created_at: string;
}

/** Kullanıcının kazandığı rozet kaydı. */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges?: Badge | null;
}

/** Supabase `reports` tablosundaki şikayet. */
export interface Report {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  entity_type: string;
  entity_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/** Supabase `moderation_logs` tablosundaki kayıt. */
export interface ModerationLog {
  id: string;
  admin_id: string | null;
  target_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
}

/** Supabase `banned_words` tablosundaki yasaklı kelime. */
export interface BannedWord {
  id: string;
  word: string;
  severity: string;
  is_active: boolean;
  created_at: string;
}

/** Abonelik paketi (tier). */
export type SubscriptionTier = "free" | "plus" | "ultra_plus";

/**
 * Abonelik/plan türü.
 * Stage 16: plus_monthly / ultra_plus_monthly. Eski monthly/yearly geriye
 * dönük uyumluluk için korunur (eski subscription kayıtları).
 */
export type SubscriptionType =
  | "plus_monthly"
  | "ultra_plus_monthly"
  | "monthly"
  | "yearly";

/** Supabase `subscriptions` tablosundaki abonelik. */
export interface Subscription {
  id: string;
  user_id: string;
  provider: string;
  provider_subscription_id: string | null;
  subscription_type: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Supabase `referrals` tablosundaki davet kaydı. */
export interface Referral {
  id: string;
  referrer_id: string | null;
  referred_user_id: string | null;
  referral_code: string;
  created_at: string;
}

/** Supabase `push_subscriptions` tablosundaki abonelik. */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  created_at: string;
}

/** Supabase `launch_checklist` tablosundaki madde. */
export interface LaunchChecklistItem {
  id: string;
  item_key: string;
  title: string;
  description: string | null;
  category: string;
  is_completed: boolean;
  notes: string | null;
  updated_at: string;
}

/** Supabase `payment_logs` tablosundaki ödeme kaydı. */
export interface PaymentLog {
  id: string;
  user_id: string | null;
  provider: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  raw_response: unknown;
  created_at: string;
}

/** Bilinen özellik bayrağı anahtarları (lib/features.ts ile eşleşir). */
export type FeatureKey =
  | "beta_mode"
  | "push_notifications"
  | "ai_moderation"
  | "ghost_mode"
  | "viral_feed"
  | "onboarding_v2"
  | "satisfaction_popup"
  | "referral_program";

/** Supabase `feature_flags` tablosundaki bayrak. */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  rollout_pct: number;
  updated_at: string;
}

/** Supabase `invite_codes` tablosundaki davet kodu. */
export interface InviteCode {
  id: string;
  code: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_by: string | null;
  expires_at: string | null;
  created_at: string;
}

/** Geri bildirim / hata / memnuniyet kaydı türü. */
export type FeedbackKind = "feedback" | "bug" | "idea" | "satisfaction";

/** Supabase `feedback_reports` tablosundaki kayıt. */
export interface FeedbackReport {
  id: string;
  user_id: string | null;
  kind: FeedbackKind;
  rating: number | null;
  message: string | null;
  page: string | null;
  meta: Record<string, unknown>;
  status: string;
  created_at: string;
}

/** Supabase `flagged_users` tablosundaki işaretleme. */
export interface FlaggedUser {
  id: string;
  user_id: string;
  reason: string;
  severity: string;
  detail: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
  profiles?: { username: string; gender: Gender } | null;
}

/** admin_growth_metrics RPC dönüşü. */
export interface GrowthMetrics {
  total_users: number;
  beta_users: number;
  plus_users: number;
  new_users_24h: number;
  new_users_7d: number;
  dau: number;
  wau: number;
  mau: number;
  confessions_24h: number;
  golge_24h: number;
  open_feedback: number;
  flagged_open: number;
  invites_active: number;
  avg_satisfaction: number | null;
  install_rate: number;
  d1_retention: number;
}
