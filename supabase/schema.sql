-- Schema para o app "Nosso Amor em Tempo Real"
-- Rode este script uma única vez no SQL Editor do painel do Supabase
-- (Project > SQL Editor > New query > colar e executar).
--
-- Modelo de dados: só existem duas contas reais (user1 e user2), então
-- qualquer usuário autenticado do projeto pode ler/escrever tudo (RLS
-- simplificada para "autenticado = casal").

-- ─── Tabelas ────────────────────────────────────────────────────────────────

-- Perfil do casal: uma única linha compartilhada pelos dois logins.
-- "streak" também mora aqui porque é um valor único do casal (não por pessoa).
create table if not exists public.profiles (
  id text primary key,
  couple_profile jsonb not null,
  streak jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists streak jsonb;

-- Check-ins de humor (histórico, um por pessoa por dia).
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mood text not null,
  user_slot text not null check (user_slot in ('user1', 'user2')),
  created_at timestamptz not null default now()
);

-- Gamificação (XP, conquistas, histórico de XP, estatísticas, desafios diários):
-- também é uma única linha compartilhada pelo casal, igual o profiles.
create table if not exists public.gamification_state (
  id text primary key,
  xp integer not null default 0,
  achievements jsonb not null default '[]',
  xp_history jsonb not null default '[]',
  stats jsonb not null default '{}',
  daily_challenges jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  event_date date not null,
  event_time text,
  location text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  target_value numeric,
  current_value numeric not null default 0,
  deadline date,
  status text not null default 'em_andamento',
  user_id text, -- 'user1' | 'user2' (quem criou a meta)
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  memory_date date,
  emotion text,
  location text,
  image_urls text[] not null default '{}',
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  text text not null default '',
  sender_id uuid references auth.users(id) not null,
  sender_slot text not null check (sender_slot in ('user1', 'user2')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_for_everyone boolean not null default false,
  deleted_for text[] not null default '{}',
  reactions jsonb not null default '{}',
  starred_by text[] not null default '{}',
  reply_to jsonb,
  attachments jsonb not null default '[]',
  shared_card jsonb,
  read_by text[] not null default '{}'
);

alter table public.messages add column if not exists shared_card jsonb;
alter table public.messages add column if not exists read_by text[] not null default '{}';

-- Marca várias mensagens como lidas de uma vez só (usado pelo chat ao abrir
-- a conversa) sem precisar de uma chamada de rede por mensagem.
create or replace function public.mark_messages_read(message_ids uuid[], slot text)
returns void
language sql
security invoker
as $$
  update public.messages
  set read_by = array_append(read_by, slot)
  where id = any(message_ids)
    and sender_slot <> slot
    and not (slot = any(read_by));
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.goals enable row level security;
alter table public.memories enable row level security;
alter table public.messages enable row level security;
alter table public.check_ins enable row level security;
alter table public.gamification_state enable row level security;

drop policy if exists "casal acessa profiles" on public.profiles;
create policy "casal acessa profiles" on public.profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa check_ins" on public.check_ins;
create policy "casal acessa check_ins" on public.check_ins
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa gamification_state" on public.gamification_state;
create policy "casal acessa gamification_state" on public.gamification_state
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa events" on public.events;
create policy "casal acessa events" on public.events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa goals" on public.goals;
create policy "casal acessa goals" on public.goals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa memories" on public.memories;
create policy "casal acessa memories" on public.memories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "casal acessa messages" on public.messages;
create policy "casal acessa messages" on public.messages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─── Realtime (para o chat aparecer na hora nos dois aparelhos) ───────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ─── Storage (fotos de memórias e avatares) ───────────────────────────────────

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

drop policy if exists "casal le memories bucket" on storage.objects;
create policy "casal le memories bucket" on storage.objects
  for select using (bucket_id = 'memories');

drop policy if exists "casal envia memories bucket" on storage.objects;
create policy "casal envia memories bucket" on storage.objects
  for insert to authenticated with check (bucket_id = 'memories');

drop policy if exists "casal apaga memories bucket" on storage.objects;
create policy "casal apaga memories bucket" on storage.objects
  for delete to authenticated using (bucket_id = 'memories');
