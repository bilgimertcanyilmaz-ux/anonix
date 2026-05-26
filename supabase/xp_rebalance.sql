-- =====================================================================
-- Anonix · XP/Rütbe Yeniden Dengeleme + Tema Tercihi
-- SQL Editor'de çalıştırın. Idempotent (create or replace). Mevcut akışı bozmaz.
-- Bağımlılık: confessions/golge/engagement/viral SQL'leri kurulu olmalı.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Tema tercihi kolonu (localStorage ile çalışır; hesaba bağlı kalsın diye)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists theme_preference text not null default 'dark';
-- Güvenli kolon güncellemesine theme_preference'ı da ekle (Aşama 9 sertleştirmesi)
grant update (username, gender, avatar_url, is_anonymous, theme_preference, updated_at)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 1) Yeni rütbe eşikleri (zorlaştırılmış, 11 kademe)
-- ---------------------------------------------------------------------
create or replace function public.anonix_rank(p integer)
returns text language sql immutable as $$
  select case
    when p >= 1000000 then 'Gölge Efsanesi'
    when p >= 500000  then 'İtiraf Kralı'
    when p >= 250000  then 'Efsane İtirafçı'
    when p >= 120000  then 'Viral Ruh'
    when p >= 60000   then 'Anonim Usta'
    when p >= 30000   then 'Karanlık Kalem'
    when p >= 15000   then 'Gölge Sakini'
    when p >= 7500    then 'Gece Yolcusu'
    when p >= 3000    then 'Gizli Yazar'
    when p >= 1000    then 'Yeni İtirafçı'
    else                   'Sessiz Ruh'
  end;
$$;

-- ---------------------------------------------------------------------
-- 2) Yeniden dengelenmiş XP kazanımları
--    itiraf +80 · Gölge +120 · beğeni alma +4 · yorum alma +2 · yorum yapma +3
--    günlük giriş +5 · başarılı davet +150
-- ---------------------------------------------------------------------

-- İtiraf paylaşımı: +80
create or replace function public.on_confession_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_points(new.user_id, 80);
  return new;
end;
$$;

-- İtiraf beğenisi: yazar +4
create or replace function public.on_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions set like_count = like_count + 1, updated_at = now()
    where id = new.confession_id returning user_id into author;
  if author is not null then perform public.add_points(author, 4); end if;
  return new;
end;
$$;

create or replace function public.on_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions set like_count = greatest(0, like_count - 1), updated_at = now()
    where id = old.confession_id returning user_id into author;
  if author is not null then perform public.add_points(author, -4); end if;
  return old;
end;
$$;

-- İtiraf yorumu: yorum yapan +3, yazar +2
create or replace function public.on_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions set comment_count = comment_count + 1, updated_at = now()
    where id = new.confession_id returning user_id into author;
  perform public.add_points(new.user_id, 3);
  if author is not null and author <> new.user_id then perform public.add_points(author, 2); end if;
  return new;
end;
$$;

-- Gölge paylaşımı: +120
create or replace function public.on_golge_post_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_points(new.user_id, 120);
  return new;
end;
$$;

-- Gölge beğenisi: yazar +4 / -4
create or replace function public.on_golge_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts set like_count = like_count + 1, updated_at = now()
    where id = new.golge_post_id returning user_id into author;
  if author is not null then perform public.add_points(author, 4); end if;
  return new;
end;
$$;

create or replace function public.on_golge_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts set like_count = greatest(0, like_count - 1), updated_at = now()
    where id = old.golge_post_id returning user_id into author;
  if author is not null then perform public.add_points(author, -4); end if;
  return old;
end;
$$;

-- Gölge yorumu: yorum yapan +3, yazar +2
create or replace function public.on_golge_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts set comment_count = comment_count + 1, updated_at = now()
    where id = new.golge_post_id returning user_id into author;
  perform public.add_points(new.user_id, 3);
  if author is not null and author <> new.user_id then perform public.add_points(author, 2); end if;
  return new;
end;
$$;

-- Günlük giriş (streak): taban +5 (3. günde +25, 7. günde +100 bonus korunur)
create or replace function public.record_daily_streak()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  last_d date; cur integer; longest integer;
  new_streak integer; reward integer := 0; today date := current_date;
begin
  if uid is null then return json_build_object('ok', false); end if;
  select last_active_date, streak_count, longest_streak into last_d, cur, longest
    from public.profiles where id = uid;
  if last_d = today then
    return json_build_object('ok', true, 'changed', false, 'streak', cur);
  end if;
  if last_d = today - 1 then new_streak := cur + 1; else new_streak := 1; end if;
  longest := greatest(coalesce(longest, 0), new_streak);
  update public.profiles
    set streak_count = new_streak, last_active_date = today, longest_streak = longest
    where id = uid;
  reward := 5;
  if new_streak = 3 then reward := reward + 25; end if;
  if new_streak = 7 then reward := reward + 100; end if;
  perform public.add_points(uid, reward);
  if new_streak = 30 then perform public.award_badge(uid, '30 Gün Streak'); end if;
  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (uid, uid, 'streak', 'streak',
    'Günlük giriş! ' || new_streak || ' günlük streak · +' || reward || ' XP 🔥');
  return json_build_object('ok', true, 'changed', true, 'streak', new_streak, 'reward', reward);
end;
$$;
grant execute on function public.record_daily_streak() to authenticated;

-- Başarılı davet: davet eden +150, yeni kullanıcı +100 (hoş geldin)
create or replace function public.s12_referral_on_first_confession()
returns trigger language plpgsql security definer set search_path = public as $$
declare ref_by uuid; conf_count integer;
begin
  select referred_by into ref_by from public.profiles where id = new.user_id;
  if ref_by is null then return new; end if;
  select count(*) into conf_count from public.confessions where user_id = new.user_id;
  if conf_count <> 1 then return new; end if;
  if exists (select 1 from public.referrals where referred_user_id = new.user_id) then
    return new;
  end if;
  insert into public.referrals (referrer_id, referred_user_id, referral_code)
  values (ref_by, new.user_id, coalesce((select referral_code from public.profiles where id = ref_by), ''));
  perform public.add_points(ref_by, 150);
  perform public.add_points(new.user_id, 100);
  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (ref_by, new.user_id, 'referral', 'referral', 'Davetin kabul edildi! +150 XP 🎉');
  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (new.user_id, ref_by, 'referral', 'referral', 'Davet bonusu! +100 XP 🎁');
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Mevcut kullanıcıların rütbelerini yeni eşiklere göre yeniden hesapla
--    (Rütbe bildirimi trigger'ı AŞAĞIDA kurulur; bu toplu güncelleme sahte
--     "rütbe atladın" bildirimi üretmesin diye trigger'dan ÖNCE çalışır.)
-- ---------------------------------------------------------------------
update public.profiles set rank = public.anonix_rank(points)
  where rank is distinct from public.anonix_rank(points);

-- ---------------------------------------------------------------------
-- 4) Rütbe atlama bildirimi (bundan sonra rank değişince)
-- ---------------------------------------------------------------------
create or replace function public.s_rank_up_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (new.id, new.id, 'rank_up', 'profile',
    'Yeni rütbeye ulaştın: ' || new.rank || ' 🎉');
  return new;
end;
$$;
drop trigger if exists trg_rank_up on public.profiles;
create trigger trg_rank_up after update on public.profiles
  for each row when (old.rank is distinct from new.rank)
  execute function public.s_rank_up_notify();
