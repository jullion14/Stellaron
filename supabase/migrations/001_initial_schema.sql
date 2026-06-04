-- Saved Relics
create table saved_relics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  character_id text not null,
  slot text not null check (slot in ('Head', 'Hands', 'Body', 'Feet', 'PlanarSphere', 'LinkRope')),
  set_id text not null,
  set_name text not null,
  main_stat_key text not null,
  main_stat_value float not null,
  substats jsonb not null default '[]',
  level int not null default 0 check (level >= 0 and level <= 15),
  rarity int not null default 5 check (rarity in (2, 3, 4, 5)),
  label text,
  created_at timestamptz default now()
);

-- Saved Builds
create table saved_builds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  character_id text not null,
  light_cone_id text,
  light_cone_level int default 80,
  light_cone_superimposition int default 1 check (light_cone_superimposition between 1 and 5),
  relic_ids jsonb not null default '{}',
  label text not null,
  created_at timestamptz default now()
);

-- RLS Policies for saved_relics
alter table saved_relics enable row level security;

create policy "Users can view their own relics"
  on saved_relics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own relics"
  on saved_relics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own relics"
  on saved_relics for update
  using (auth.uid() = user_id);

create policy "Users can delete their own relics"
  on saved_relics for delete
  using (auth.uid() = user_id);

-- RLS Policies for saved_builds
alter table saved_builds enable row level security;

create policy "Users can view their own builds"
  on saved_builds for select
  using (auth.uid() = user_id);

create policy "Users can insert their own builds"
  on saved_builds for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own builds"
  on saved_builds for update
  using (auth.uid() = user_id);

create policy "Users can delete their own builds"
  on saved_builds for delete
  using (auth.uid() = user_id);