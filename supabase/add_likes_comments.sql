-- ─── Likes ────────────────────────────────────────────────────────────────────
create table if not exists public.content_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, content_id)
);

alter table public.content_likes enable row level security;

create policy "anyone can read likes"
  on public.content_likes for select using (true);

create policy "auth users can like"
  on public.content_likes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "auth users can unlike"
  on public.content_likes for delete to authenticated
  using (auth.uid() = user_id);

-- ─── Comments ─────────────────────────────────────────────────────────────────
create table if not exists public.content_comments (
  id         uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  username   text,
  body       text not null,
  created_at timestamptz default now()
);

alter table public.content_comments enable row level security;

create policy "anyone can read comments"
  on public.content_comments for select using (true);

create policy "auth users can comment"
  on public.content_comments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users can delete own comments"
  on public.content_comments for delete to authenticated
  using (auth.uid() = user_id);

-- ─── Cached counts on contents (updated via triggers) ─────────────────────────
alter table public.contents
  add column if not exists like_count    int not null default 0,
  add column if not exists comment_count int not null default 0;

-- Trigger: keep like_count in sync
create or replace function public.update_like_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update public.contents set like_count = like_count + 1 where id = NEW.content_id;
  elsif (TG_OP = 'DELETE') then
    update public.contents set like_count = greatest(like_count - 1, 0) where id = OLD.content_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_like_count on public.content_likes;
create trigger trg_like_count
  after insert or delete on public.content_likes
  for each row execute procedure public.update_like_count();

-- Trigger: keep comment_count in sync
create or replace function public.update_comment_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update public.contents set comment_count = comment_count + 1 where id = NEW.content_id;
  elsif (TG_OP = 'DELETE') then
    update public.contents set comment_count = greatest(comment_count - 1, 0) where id = OLD.content_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comment_count on public.content_comments;
create trigger trg_comment_count
  after insert or delete on public.content_comments
  for each row execute procedure public.update_comment_count();

-- Backfill counts for existing data (safe to run multiple times)
update public.contents c
set like_count = (select count(*) from public.content_likes l where l.content_id = c.id);

update public.contents c
set comment_count = (select count(*) from public.content_comments cc where cc.content_id = c.id);

-- Allow public to read profiles (needed for suggested accounts sidebar)
create policy if not exists "public read profiles"
  on public.profiles for select using (true);
