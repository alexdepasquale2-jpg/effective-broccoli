-- Players. Inventory and skills are JSONB: they are document-shaped, always
-- read and written whole with the player, and never queried across rows.
create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  location_id   text not null,
  x             double precision not null,
  y             double precision not null,
  inventory     jsonb not null default '[]'::jsonb,
  skills        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create table if not exists sessions (
  id         text primary key,
  player_id  uuid not null references players(id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists sessions_player_id_idx on sessions (player_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- Mutable world state per location, e.g. which trees are on cooldown.
-- The immutable definition lives in content; only what changes is stored.
create table if not exists location_state (
  location_id text primary key,
  entities    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
