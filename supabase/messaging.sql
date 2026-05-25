-- =====================================================================
-- Anonix · Supabase şeması (Aşama 4: Plus üyelik & Özel Mesajlaşma)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- Not: profiles + confessions tabloları önceden kurulmuş olmalıdır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  confession_id uuid references public.confessions (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  receiver_id   uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (confession_id, sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  receiver_id     uuid not null references public.profiles (id) on delete cascade,
  content         text not null check (char_length(btrim(content)) between 1 and 500),
  is_read         boolean not null default false,
  created_at      timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists conversations_sender_idx on public.conversations (sender_id);
create index if not exists conversations_receiver_idx on public.conversations (receiver_id);
create index if not exists conversations_updated_idx on public.conversations (updated_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_unread_idx on public.messages (receiver_id) where is_read = false;

-- ---------------------------------------------------------------------
-- 2) Row Level Security
-- ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Konuşmalar: yalnızca tarafları görebilir
drop policy if exists "Konuşmaları taraflar görür" on public.conversations;
create policy "Konuşmaları taraflar görür"
  on public.conversations for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Konuşma başlatma: yalnızca Plus üye, kendine değil
drop policy if exists "Plus üye konuşma başlatır" on public.conversations;
create policy "Plus üye konuşma başlatır"
  on public.conversations for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_plus)
  );

-- updated_at'i konuşmaya yeni mesaj geldiğinde güncellemek için (taraflar)
drop policy if exists "Taraflar konuşmayı günceller" on public.conversations;
create policy "Taraflar konuşmayı günceller"
  on public.conversations for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Mesajlar: yalnızca taraflar görebilir
drop policy if exists "Mesajları taraflar görür" on public.messages;
create policy "Mesajları taraflar görür"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Mesaj gönderme: yalnızca Plus üye, kendine değil, boş değil,
-- ve yalnızca dahil olduğu konuşmaya
drop policy if exists "Plus üye mesaj gönderir" on public.messages;
create policy "Plus üye mesaj gönderir"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and char_length(btrim(content)) > 0
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_plus)
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.sender_id = auth.uid() or c.receiver_id = auth.uid())
    )
  );

-- Okundu işaretleme: yalnızca alıcı kendi mesajını güncelleyebilir
drop policy if exists "Alıcı mesajı okundu işaretler" on public.messages;
create policy "Alıcı mesajı okundu işaretler"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- ---------------------------------------------------------------------
-- 3) Yeni mesajda konuşmanın updated_at'ini güncelle
-- ---------------------------------------------------------------------
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_message_insert on public.messages;
create trigger trg_message_insert
  after insert on public.messages
  for each row execute function public.on_message_insert();

-- ---------------------------------------------------------------------
-- 4) Realtime: messages tablosunu yayına ekle (idempotent)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
