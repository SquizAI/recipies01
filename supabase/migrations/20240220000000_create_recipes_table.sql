-- Create recipes table
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  cuisine_type text not null,
  difficulty text not null,
  servings integer not null,
  prep_time integer not null,
  cook_time integer not null,
  total_time integer not null,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  macros jsonb not null default '{}'::jsonb,
  equipment_needed text[] not null default array[]::text[],
  tags text[] not null default array[]::text[],
  tips_and_tricks text[] not null default array[]::text[],
  storage_instructions text not null default '',
  reheating_instructions text not null default '',
  variations text[] not null default array[]::text[],
  calories_per_serving integer not null default 0,
  cost_estimate numeric(10,2) not null default 0,
  shopping_list jsonb not null default '[]'::jsonb,
  source_url text unique,
  video_transcription text,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint recipes_source_url_unique unique (source_url)
);

-- Create indexes
create index recipes_source_url_idx on public.recipes(source_url);
create index recipes_created_at_idx on public.recipes(created_at);

-- Enable RLS
alter table public.recipes enable row level security;

-- Create policies
create policy "Enable read access for all users" 
  on public.recipes for select 
  using (true);

create policy "Enable insert for all users" 
  on public.recipes for insert 
  with check (true);