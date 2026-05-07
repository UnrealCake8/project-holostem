-- HoloStem mobile app schema
-- Run this in the Supabase SQL editor. It is idempotent and does not insert sample data.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  bio text,
  age_group text default 'all',
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists age_group text default 'all';
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
create unique index if not exists profiles_username_unique on public.profiles (username) where username is not null;

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  title text not null,
  description text not null,
  type text not null default 'video' check (type in ('video', 'lesson', 'mini')),
  category text,
  media_url text,
  caption_url text,
  difficulty text,
  points int not null default 10,
  recommended boolean default false,
  is_trending boolean default false,
  is_pinned boolean default false,
  pinned_at timestamptz,
  status text default 'published',
  moderation_method text,
  moderation_reason text,
  moderation_requested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contents add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.contents add column if not exists username text;
alter table public.contents add column if not exists title text;
alter table public.contents add column if not exists description text;
alter table public.contents add column if not exists type text default 'video';
alter table public.contents add column if not exists category text;
alter table public.contents add column if not exists media_url text;
alter table public.contents add column if not exists caption_url text;
alter table public.contents add column if not exists difficulty text;
alter table public.contents add column if not exists points int not null default 10;
alter table public.contents add column if not exists recommended boolean default false;
alter table public.contents add column if not exists is_trending boolean default false;
alter table public.contents add column if not exists is_pinned boolean default false;
alter table public.contents add column if not exists pinned_at timestamptz;
alter table public.contents add column if not exists status text default 'published';
alter table public.contents add column if not exists moderation_method text;
alter table public.contents add column if not exists moderation_reason text;
alter table public.contents add column if not exists moderation_requested_at timestamptz;
alter table public.contents add column if not exists created_at timestamptz default now();
alter table public.contents add column if not exists updated_at timestamptz default now();
create index if not exists contents_user_id_idx on public.contents (user_id);
create index if not exists contents_username_idx on public.contents (username);
create index if not exists contents_status_created_idx on public.contents (status, created_at desc);
create index if not exists contents_pinned_idx on public.contents (username, is_pinned desc, pinned_at desc, created_at desc);

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists user_follows_follower_idx on public.user_follows (follower_id, created_at desc);
create index if not exists user_follows_following_idx on public.user_follows (following_id, created_at desc);

create table if not exists public.liked_videos (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, content_id)
);
create index if not exists liked_videos_content_idx on public.liked_videos (content_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  user_handle text not null,
  body text not null check (char_length(body) > 0),
  status text default 'published',
  moderation_method text,
  moderation_reason text,
  moderation_requested_at timestamptz,
  created_at timestamptz default now()
);
alter table public.comments add column if not exists status text default 'published';
alter table public.comments add column if not exists moderation_method text;
alter table public.comments add column if not exists moderation_reason text;
alter table public.comments add column if not exists moderation_requested_at timestamptz;
create index if not exists comments_content_created_idx on public.comments (content_id, created_at);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points int not null default 0,
  completed_count int not null default 0,
  level int not null default 1,
  updated_at timestamptz default now()
);

create table if not exists public.user_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  viewed_at timestamptz default now(),
  primary key (user_id, content_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid,
  target_user_id uuid references auth.users(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  target_user_email text,
  reason text not null,
  details text,
  status text default 'open',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.user_follows enable row level security;
alter table public.liked_videos enable row level security;
alter table public.comments enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_views enable row level security;
alter table public.reports enable row level security;

-- Policies are wrapped so rerunning this file is safe.
do $$ begin
  create policy "profiles are public readable" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users write own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "published contents are public readable" on public.contents for select using (status = 'published' or status is null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users insert own contents" on public.contents for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users update own contents" on public.contents for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users delete own contents" on public.contents for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "follows are public readable" on public.user_follows for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users follow as themselves" on public.user_follows for insert to authenticated with check (auth.uid() = follower_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users unfollow as themselves" on public.user_follows for delete to authenticated using (auth.uid() = follower_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "likes are public readable" on public.liked_videos for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users manage own likes" on public.liked_videos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comments are public readable" on public.comments for select using (status = 'published' or status is null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users create own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users read own progress" on public.user_progress for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users manage own progress" on public.user_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users read own views" on public.user_views for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users manage own views" on public.user_views for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users read own reports" on public.reports for select to authenticated using (auth.uid() = reporter_id or auth.uid() = target_user_id);
exception when duplicate_object then null; end $$;
