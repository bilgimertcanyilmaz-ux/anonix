-- =====================================================================
-- Anonix · Supabase şeması (Aşama 11: Canlıya Hazırlık Kontrol Listesi)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- =====================================================================

create table if not exists public.launch_checklist (
  id           uuid primary key default gen_random_uuid(),
  item_key     text unique not null,
  title        text not null,
  description  text,
  category     text not null,
  is_completed boolean not null default false,
  notes        text,
  updated_at   timestamptz not null default now()
);

alter table public.launch_checklist enable row level security;

-- Yalnızca admin görür ve günceller
drop policy if exists "Admin checklist görür" on public.launch_checklist;
create policy "Admin checklist görür"
  on public.launch_checklist for select using (public.is_admin());

drop policy if exists "Admin checklist günceller" on public.launch_checklist;
create policy "Admin checklist günceller"
  on public.launch_checklist for update using (public.is_admin()) with check (public.is_admin());

-- Seed maddeleri (idempotent)
insert into public.launch_checklist (item_key, title, category, description) values
  ('supabase_rls', 'Supabase RLS kontrol edildi', 'Supabase', 'Tüm tablolarda RLS aktif ve politikalar doğru.'),
  ('vercel_env', 'Vercel env girildi', 'Vercel', 'Tüm production ortam değişkenleri Vercel''e eklendi.'),
  ('iyzico_webhook', 'iyzico webhook test edildi', 'Ödeme', 'Callback/webhook URL''leri production''a ayarlandı ve test edildi.'),
  ('resend_email', 'Resend email test edildi', 'Email', 'Domain doğrulandı, test maili gönderildi.'),
  ('admin_account', 'Admin hesabı oluşturuldu', 'Genel', 'En az bir admin (role=admin) hesabı mevcut.'),
  ('test_users_cleaned', 'Test kullanıcıları temizlendi', 'Genel', 'Geliştirme sırasındaki test verileri silindi.'),
  ('domain_connected', 'Domain bağlandı', 'Domain', 'Apex + www domain Vercel''e bağlandı.'),
  ('ssl_active', 'SSL aktif', 'Domain', 'HTTPS sertifikası aktif ve geçerli.'),
  ('sitemap_ok', 'Sitemap çalışıyor', 'SEO', '/sitemap.xml production''da erişilebilir.'),
  ('robots_ok', 'robots.txt çalışıyor', 'SEO', '/robots.txt production''da doğru.'),
  ('payment_live_tested', 'Ödeme canlı test edildi', 'Ödeme', 'Gerçek/sandbox ödeme uçtan uca doğrulandı.'),
  ('backup_plan', 'Backup planı oluşturuldu', 'Supabase', 'Veritabanı yedekleme stratejisi belirlendi.')
on conflict (item_key) do nothing;
