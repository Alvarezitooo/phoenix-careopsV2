create table if not exists public.user_guided_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  situation text,
  priority text,
  next_step text,
  updated_at timestamptz not null default now()
);

alter table public.user_guided_states enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_guided_states'
      and policyname = 'Users manage own guided state'
  ) then
    create policy "Users manage own guided state" on public.user_guided_states
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.chat_analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  question text,
  question_length int,
  response text,
  response_length int,
  sources_used jsonb default '[]'::jsonb,
  num_sources int default 0,
  cached boolean default false,
  processing_time_ms int,
  has_suggestions boolean default false,
  num_suggestions int default 0,
  detected_intent text,
  next_step_proposed text,
  created_at timestamptz not null default now()
);

create index if not exists chat_analytics_user_id_idx on public.chat_analytics(user_id);
create index if not exists chat_analytics_created_at_idx on public.chat_analytics(created_at);
