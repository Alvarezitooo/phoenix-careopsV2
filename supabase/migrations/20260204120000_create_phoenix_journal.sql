create extension if not exists "uuid-ossp";

create table if not exists public.phoenix_journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.phoenix_journal_entries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'phoenix_journal_entries'
      and policyname = 'Users insert own journal'
  ) then
    create policy "Users insert own journal" on public.phoenix_journal_entries
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'phoenix_journal_entries'
      and policyname = 'Users read own journal'
  ) then
    create policy "Users read own journal" on public.phoenix_journal_entries
      for select
      using (auth.uid() = user_id);
  end if;
end $$;
