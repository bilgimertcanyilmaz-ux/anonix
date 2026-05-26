-- =====================================================================
-- Anonix · Admin'lere Plus özelliklerini aç (abonelik gerekmeden)
-- Mesajlaşma RLS'inde Plus şartını "is_plus VEYA admin" yapar.
-- Normal kullanıcılar için Plus zorunluluğu aynen devam eder.
-- Idempotent. SQL Editor'de çalıştırın.
-- =====================================================================

-- Konuşma başlatma: Plus üye VEYA admin
drop policy if exists "Plus üye konuşma başlatır" on public.conversations;
create policy "Plus üye konuşma başlatır"
  on public.conversations for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_plus or p.role = 'admin')
    )
  );

-- Mesaj gönderme: Plus üye VEYA admin
drop policy if exists "Plus üye mesaj gönderir" on public.messages;
create policy "Plus üye mesaj gönderir"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and char_length(btrim(content)) > 0
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_plus or p.role = 'admin')
    )
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.sender_id = auth.uid() or c.receiver_id = auth.uid())
    )
  );
