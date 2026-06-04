-- =====================================================================
-- Anonix · Yorum beğenileri (comment_likes)
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: confession_comments,
-- notifications, profiles, is_banned(), award_badge(), bump_task_progress().
-- Gönderi(yorum) başına TEK bildirim + TEK görev sayımı (beğen/çek/beğen spam'i yok).
-- =====================================================================

-- 1) Tablo + yorumda sayaç kolonu
create table if not exists public.comment_likes (
  id         uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.confession_comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
create index if not exists comment_likes_comment_idx on public.comment_likes (comment_id);

alter table public.confession_comments add column if not exists like_count integer not null default 0;

-- 2) RLS
alter table public.comment_likes enable row level security;
drop policy if exists "Yorum begenileri herkese acik" on public.comment_likes;
create policy "Yorum begenileri herkese acik"
  on public.comment_likes for select using (true);
drop policy if exists "Giris yapan yorum begenir" on public.comment_likes;
create policy "Giris yapan yorum begenir"
  on public.comment_likes for insert with check (auth.uid() = user_id and not public.is_banned());
drop policy if exists "Kullanici yorum begenisini kaldirir" on public.comment_likes;
create policy "Kullanici yorum begenisini kaldirir"
  on public.comment_likes for delete using (auth.uid() = user_id);

grant select, insert, delete on public.comment_likes to authenticated;

-- 3) Beğeni eklenince: sayaç +1, (dedup'lı) bildirim + görev
create or replace function public.on_comment_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare cauthor uuid; v_conf uuid;
begin
  update public.confession_comments
    set like_count = like_count + 1
    where id = new.comment_id
    returning user_id, confession_id into cauthor, v_conf;

  perform public.award_badge(new.user_id, 'İlk Beğeni');

  -- Yorum başına TEK işlem: aynı kullanıcı aynı yorumu tekrar beğenince
  -- (beğen/çek/beğen) ne tekrar bildirim gider ne de görev ilerlemesi sayılır.
  if cauthor is not null and cauthor <> new.user_id
     and not exists (
       select 1 from public.notifications
       where user_id = cauthor and actor_id = new.user_id
         and type = 'comment_like' and entity_id = v_conf
     ) then
    perform public.bump_task_progress(new.user_id, 'like', 1);
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
    values (cauthor, new.user_id, 'comment_like', 'confession', v_conf,
      'Yorumun beğeni aldı ❤️');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_comment_like_insert on public.comment_likes;
create trigger trg_comment_like_insert after insert on public.comment_likes
  for each row execute function public.on_comment_like_insert();

-- 4) Beğeni kaldırılınca: sayaç -1
create or replace function public.on_comment_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.confession_comments
    set like_count = greatest(0, like_count - 1)
    where id = old.comment_id;
  return old;
end;
$$;
drop trigger if exists trg_comment_like_delete on public.comment_likes;
create trigger trg_comment_like_delete after delete on public.comment_likes
  for each row execute function public.on_comment_like_delete();
