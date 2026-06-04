-- =====================================================================
-- Anonix · Supabase şeması (Aşama 6: Bildirim, Trend, Günlük Görev, Rozet)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- Bağımlılık: profiles, confessions, golge_posts, add_points (Aşama 2/3/5).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  type        text not null,
  entity_type text,
  entity_id   uuid,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null unique,
  description   text,
  task_type     text not null,
  target_count  integer not null default 1,
  reward_points integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.user_daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  task_id      uuid not null references public.daily_tasks (id) on delete cascade,
  progress     integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  task_date    date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (user_id, task_id, task_date)
);

create table if not exists public.badges (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  icon            text,
  required_points integer not null default 0,
  badge_type      text not null default 'achievement',
  created_at      timestamptz not null default now()
);

create table if not exists public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id  uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where is_read = false;
create index if not exists user_daily_tasks_user_idx on public.user_daily_tasks (user_id, task_date);
create index if not exists user_badges_user_idx on public.user_badges (user_id);

-- ---------------------------------------------------------------------
-- 2) Row Level Security
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.user_daily_tasks enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Kullanıcı kendi bildirimlerini görür" on public.notifications;
create policy "Kullanıcı kendi bildirimlerini görür"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi bildirimini okur" on public.notifications;
create policy "Kullanıcı kendi bildirimini okur"
  on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Aktif görevler herkese açık" on public.daily_tasks;
create policy "Aktif görevler herkese açık"
  on public.daily_tasks for select using (is_active);

drop policy if exists "Kullanıcı kendi görev ilerlemesini görür" on public.user_daily_tasks;
create policy "Kullanıcı kendi görev ilerlemesini görür"
  on public.user_daily_tasks for select using (auth.uid() = user_id);

drop policy if exists "Rozetler herkese açık" on public.badges;
create policy "Rozetler herkese açık"
  on public.badges for select using (true);

drop policy if exists "Kullanıcı rozetleri herkese açık" on public.user_badges;
create policy "Kullanıcı rozetleri herkese açık"
  on public.user_badges for select using (true);

-- ---------------------------------------------------------------------
-- 3) Yardımcı fonksiyonlar: rozet verme + görev ilerletme
-- ---------------------------------------------------------------------
create or replace function public.award_badge(uid uuid, bname text)
returns void language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  select id into bid from public.badges where name = bname;
  if bid is null then return; end if;
  insert into public.user_badges (user_id, badge_id) values (uid, bid)
  on conflict (user_id, badge_id) do nothing;
end;
$$;

create or replace function public.bump_task_progress(uid uuid, p_type text, inc integer default 1)
returns void language plpgsql security definer set search_path = public as $$
declare t record; cur integer; done boolean;
begin
  for t in select id, target_count, reward_points from public.daily_tasks
           where task_type = p_type and is_active loop
    insert into public.user_daily_tasks (user_id, task_id, progress, task_date)
    values (uid, t.id, inc, current_date)
    on conflict (user_id, task_id, task_date)
    do update set progress = user_daily_tasks.progress + inc
    returning progress, is_completed into cur, done;

    if not done and cur >= t.target_count then
      update public.user_daily_tasks
        set is_completed = true, completed_at = now()
        where user_id = uid and task_id = t.id and task_date = current_date;
      perform public.add_points(uid, t.reward_points);
      insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
      values (uid, uid, 'task_completed', 'task', t.id,
        'Günlük görevi tamamladın! +' || t.reward_points || ' puan 🎯');
    end if;
  end loop;
end;
$$;

-- İstemciden çağrılabilir görev ilerletme (örn. Plus sayfası ziyareti)
create or replace function public.bump_my_task(p_type text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform public.bump_task_progress(auth.uid(), p_type, 1);
end;
$$;
grant execute on function public.bump_my_task(text) to authenticated;

-- ---------------------------------------------------------------------
-- 4) Bildirim: yeni rozet kazanılınca
-- ---------------------------------------------------------------------
create or replace function public.s6_user_badge_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare bname text;
begin
  select name into bname from public.badges where id = new.badge_id;
  insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
  values (new.user_id, new.user_id, 'badge', 'badge', new.badge_id,
    'Yeni rozet kazandın: ' || coalesce(bname, 'Rozet') || ' 🏅');
  return new;
end;
$$;
drop trigger if exists trg_s6_user_badge on public.user_badges;
create trigger trg_s6_user_badge after insert on public.user_badges
  for each row execute function public.s6_user_badge_notify();

-- ---------------------------------------------------------------------
-- 5) Profil güncellemede puan/Plus rozetleri
-- ---------------------------------------------------------------------
create or replace function public.s6_profile_badges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_plus and (old.is_plus is distinct from true) then
    perform public.award_badge(new.id, 'Plus Üye');
  end if;
  if new.points >= 1000 then perform public.award_badge(new.id, '1000 Puan Kulübü'); end if;
  if new.points >= 5000 then
    perform public.award_badge(new.id, '5000 Puan Kulübü');
    perform public.award_badge(new.id, 'Gece İtirafçısı');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_s6_profile_badges on public.profiles;
create trigger trg_s6_profile_badges after update on public.profiles
  for each row
  when (old.points is distinct from new.points or old.is_plus is distinct from new.is_plus)
  execute function public.s6_profile_badges();

-- ---------------------------------------------------------------------
-- 6) İtiraf olayları
-- ---------------------------------------------------------------------
create or replace function public.s6_confession()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_badge(new.user_id, 'İlk İtiraf');
  perform public.bump_task_progress(new.user_id, 'confession', 1);
  return new;
end;
$$;
drop trigger if exists trg_s6_confession on public.confessions;
create trigger trg_s6_confession after insert on public.confessions
  for each row execute function public.s6_confession();

create or replace function public.s6_confession_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  perform public.award_badge(new.user_id, 'İlk Beğeni');
  perform public.bump_task_progress(new.user_id, 'like', 1);
  select user_id into author from public.confessions where id = new.confession_id;
  -- Aynı kullanıcı aynı itirafı tekrar beğenince (beğen/çek/beğen) tekrar bildirim GİTMEZ.
  if author is not null and author <> new.user_id
     and not exists (
       select 1 from public.notifications
       where user_id = author and actor_id = new.user_id
         and type = 'confession_like' and entity_id = new.confession_id
     ) then
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
    values (author, new.user_id, 'confession_like', 'confession', new.confession_id,
      'Bir itirafın beğeni aldı ❤️');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_s6_confession_like on public.confession_likes;
create trigger trg_s6_confession_like after insert on public.confession_likes
  for each row execute function public.s6_confession_like();

create or replace function public.s6_confession_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  perform public.award_badge(new.user_id, 'İlk Yorum');
  perform public.bump_task_progress(new.user_id, 'comment', 1);
  select user_id into author from public.confessions where id = new.confession_id;
  if author is not null and author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
    values (author, new.user_id, 'confession_comment', 'confession', new.confession_id,
      'İtirafına yeni bir yorum geldi 💬');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_s6_confession_comment on public.confession_comments;
create trigger trg_s6_confession_comment after insert on public.confession_comments
  for each row execute function public.s6_confession_comment();

-- ---------------------------------------------------------------------
-- 7) Gölge olayları
-- ---------------------------------------------------------------------
create or replace function public.s6_golge_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_badge(new.user_id, 'Gölge Paylaşımcısı');
  perform public.bump_task_progress(new.user_id, 'golge', 1);
  return new;
end;
$$;
drop trigger if exists trg_s6_golge_post on public.golge_posts;
create trigger trg_s6_golge_post after insert on public.golge_posts
  for each row execute function public.s6_golge_post();

create or replace function public.s6_golge_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  perform public.award_badge(new.user_id, 'İlk Beğeni');
  perform public.bump_task_progress(new.user_id, 'like', 1);
  select user_id into author from public.golge_posts where id = new.golge_post_id;
  -- Aynı kullanıcı aynı Gölge'yi tekrar beğenince (beğen/çek/beğen) tekrar bildirim GİTMEZ.
  if author is not null and author <> new.user_id
     and not exists (
       select 1 from public.notifications
       where user_id = author and actor_id = new.user_id
         and type = 'golge_like' and entity_id = new.golge_post_id
     ) then
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
    values (author, new.user_id, 'golge_like', 'golge', new.golge_post_id,
      'Bir Gölge paylaşımın beğeni aldı ❤️');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_s6_golge_like on public.golge_likes;
create trigger trg_s6_golge_like after insert on public.golge_likes
  for each row execute function public.s6_golge_like();

create or replace function public.s6_golge_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  perform public.award_badge(new.user_id, 'İlk Yorum');
  perform public.bump_task_progress(new.user_id, 'comment', 1);
  select user_id into author from public.golge_posts where id = new.golge_post_id;
  if author is not null and author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
    values (author, new.user_id, 'golge_comment', 'golge', new.golge_post_id,
      'Gölge paylaşımına yeni bir yorum geldi 💬');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_s6_golge_comment on public.golge_comments;
create trigger trg_s6_golge_comment after insert on public.golge_comments
  for each row execute function public.s6_golge_comment();

-- ---------------------------------------------------------------------
-- 8) Özel mesaj bildirimi
-- ---------------------------------------------------------------------
create or replace function public.s6_message_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
  values (new.receiver_id, new.sender_id, 'message', 'conversation', new.conversation_id,
    'Yeni bir özel mesajın var 📩');
  return new;
end;
$$;
drop trigger if exists trg_s6_message on public.messages;
create trigger trg_s6_message after insert on public.messages
  for each row execute function public.s6_message_notify();

-- ---------------------------------------------------------------------
-- 9) Seed: günlük görevler + rozetler
-- ---------------------------------------------------------------------
insert into public.daily_tasks (title, description, task_type, target_count, reward_points) values
  ('1 itiraf paylaş', 'Bugün bir itiraf paylaş.', 'confession', 1, 150),
  ('3 yorum yap', 'Bugün 3 yorum yap.', 'comment', 3, 30),
  ('5 beğeni ver', 'Bugün 5 beğeni ver.', 'like', 5, 20),
  ('1 Gölge paylaş', 'Bugün bir Gölge paylaş.', 'golge', 1, 200),
  ('Plus sayfasını ziyaret et', 'Plus avantajlarını keşfet.', 'visit_plus', 1, 10)
on conflict (title) do nothing;

insert into public.badges (name, description, icon, required_points, badge_type) values
  ('İlk İtiraf', 'İlk itirafını paylaştın.', '📝', 0, 'milestone'),
  ('İlk Yorum', 'İlk yorumunu yaptın.', '💬', 0, 'milestone'),
  ('İlk Beğeni', 'İlk beğenini verdin.', '❤️', 0, 'milestone'),
  ('1000 Puan Kulübü', '1000 puana ulaştın.', '🥉', 1000, 'points'),
  ('5000 Puan Kulübü', '5000 puana ulaştın.', '🥈', 5000, 'points'),
  ('Gölge Paylaşımcısı', 'İlk Gölge paylaşımını yaptın.', '🌙', 0, 'milestone'),
  ('Plus Üye', 'Anonix Plus üyesi oldun.', '👑', 0, 'special'),
  ('Gece İtirafçısı', '5000 puanla gece itirafçısı oldun.', '🔥', 5000, 'rank')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 10) Realtime: notifications yayına ekle (idempotent)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
