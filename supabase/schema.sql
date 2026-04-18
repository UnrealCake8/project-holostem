-- Run in Supabase SQL editor
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  bio text,
  age_group text default 'all',
  created_at timestamptz default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  title text not null,
  description text not null,
  type text not null check (type in ('video', 'lesson', 'mini')),
  category text,
  media_url text,
  difficulty text,
  points int not null default 10,
  recommended boolean default false,
  is_trending boolean default false,
  created_at timestamptz default now()
);

alter table public.contents add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.contents add column if not exists username text;
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles (username);

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

create table if not exists public.liked_videos (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, content_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  user_handle text not null,
  body text not null check (char_length(body) > 0),
  created_at timestamptz default now()
);

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_views enable row level security;
alter table public.liked_videos enable row level security;
alter table public.comments enable row level security;
alter table public.user_follows enable row level security;

-- basic policies
create policy "read contents" on public.contents for select using (true);
create policy "insert contents auth" on public.contents for insert to authenticated with check (auth.uid() = user_id);

-- allow uploader to edit/delete own content
create policy "update own contents" on public.contents for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own contents" on public.contents for delete to authenticated using (auth.uid() = user_id);

create policy "user read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "user write own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "user read own progress" on public.user_progress for select to authenticated using (auth.uid() = user_id);
create policy "user write own progress" on public.user_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user read own views" on public.user_views for select to authenticated using (auth.uid() = user_id);
create policy "user write own views" on public.user_views for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public read likes" on public.liked_videos for select using (true);
create policy "user manage own likes" on public.liked_videos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public read comments" on public.comments for select using (true);
create policy "authenticated create comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "user delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

create policy "read follows" on public.user_follows for select using (true);
create policy "user follow others" on public.user_follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "user unfollow others" on public.user_follows for delete to authenticated using (auth.uid() = follower_id);

-- starter content
insert into public.contents (title, description, type, category, media_url, points, recommended, is_trending)
values
('Solar Systems in 60 Seconds', 'A fast visual introduction to planets and orbits.', 'video', 'Science', 'https://www.youtube.com/embed/libKVRa01L8', 20, true, true),
('Build Better Study Habits', 'Interactive tips for daily progress and focus.', 'lesson', 'Learning', 'https://www.youtube.com/embed/IlU-zDU6aQ0', 15, true, false),
('Reaction Mini Experience', 'Tap quickly to train your reaction timing.', 'mini', 'Experience', '', 30, false, true)
on conflict do nothing;

-- Storage bucket for user video uploads (run once).
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

create policy "public read videos"
on storage.objects
for select
using (bucket_id = 'videos');

create policy "authenticated upload videos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "authenticated update own videos"
on storage.objects
for update
to authenticated
using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "authenticated delete own videos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
