-- =====================================================================
-- Anonix · feedback_reports rate-limit + index (Stage 18)
-- Idempotent. Bağımlılık: supabase/soft_launch.sql (feedback_reports tablo).
-- =====================================================================

-- İz için meta üzerinde gin index (filtreleme/arama hızı)
create index if not exists feedback_meta_gin on public.feedback_reports using gin (meta);

-- Saatte 5 geri bildirim — IP + user_id bazlı.
create or replace function public.s_feedback_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt integer; ip_text text;
begin
  ip_text := nullif(new.meta ->> 'ip', '');

  -- Aynı user_id için son 1 saatte 5+ ise reddet
  if new.user_id is not null then
    select count(*) into cnt from public.feedback_reports
      where user_id = new.user_id and created_at > now() - interval '1 hour';
    if cnt >= 5 then
      raise exception 'Çok fazla geri bildirim gönderdin. Lütfen biraz sonra tekrar dene.'
        using errcode = 'P0001';
    end if;
  end if;

  -- Anonim/Aynı IP için son 1 saatte 5+ ise reddet
  if ip_text is not null then
    select count(*) into cnt from public.feedback_reports
      where meta ->> 'ip' = ip_text and created_at > now() - interval '1 hour';
    if cnt >= 5 then
      raise exception 'Çok fazla geri bildirim gönderdin. Lütfen biraz sonra tekrar dene.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_feedback_rate on public.feedback_reports;
create trigger trg_feedback_rate before insert on public.feedback_reports
  for each row execute function public.s_feedback_rate_limit();
