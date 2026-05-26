-- =====================================================================
-- Anonix · Admin moderasyon RPC'si (pending_review onay/ret/gizle)
-- Idempotent. Bağımlılık: is_admin(), confessions, golge_posts, moderation_logs.
-- =====================================================================

create or replace function public.admin_set_moderation(p_type text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için yetkin yok.' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'pending_review', 'rejected', 'hidden') then
    raise exception 'Geçersiz moderasyon durumu.' using errcode = '22023';
  end if;

  if p_type = 'confession' then
    update public.confessions set moderation_status = p_status where id = p_id;
  elsif p_type = 'golge' then
    update public.golge_posts set moderation_status = p_status where id = p_id;
  else
    raise exception 'Geçersiz içerik türü.' using errcode = '22023';
  end if;

  insert into public.moderation_logs (admin_id, entity_type, entity_id, action, reason)
    values (auth.uid(), p_type, p_id, 'set_' || p_status, 'admin moderation');
end;
$$;
grant execute on function public.admin_set_moderation(text, uuid, text) to authenticated;
