-- HoloStem moderation migration (safe ALTER, no data drops)
create extension if not exists pgcrypto;

do $$ begin
  create type moderation_status as enum ('pending_review','published','needs_review','rejected','removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_method as enum ('ai','human','ai_escalated');
exception when duplicate_object then null; end $$;


-- Ensure role column exists for moderator/admin checks
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add constraint profiles_role_check check (role in ('user','moderator','admin')) not valid;
alter table public.profiles validate constraint profiles_role_check;
alter table public.contents add column if not exists status moderation_status;
alter table public.contents add column if not exists moderation_method moderation_method;
alter table public.contents add column if not exists moderation_reason text;
alter table public.contents add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.contents add column if not exists reviewed_at timestamptz;
alter table public.contents add column if not exists moderation_requested_at timestamptz;
alter table public.contents add column if not exists moderation_completed_at timestamptz;
update public.contents set status='published' where status is null;

alter table public.comments add column if not exists status moderation_status;
alter table public.comments add column if not exists moderation_method moderation_method;
alter table public.comments add column if not exists moderation_reason text;
alter table public.comments add column if not exists moderation_requested_at timestamptz;
update public.comments set status='published' where status is null;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('content','comment')),
  target_id uuid not null,
  target_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('harassment','hate','sexual content','violence','spam','misinformation','copyright','other')),
  details text,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strikes int not null default 0,
  is_banned boolean not null default false,
  banned_until timestamptz,
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_contents_status_method on public.contents(status, moderation_method, created_at desc);
create index if not exists idx_comments_status on public.comments(status, created_at desc);
create index if not exists idx_reports_open on public.reports(status, target_type, created_at desc);

create or replace function public.is_moderator() returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin'));
$$;

create or replace function public.block_banned_users() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.user_moderation um where um.user_id=auth.uid() and um.is_banned=true and (um.banned_until is null or um.banned_until > now())) then
    raise exception 'Account is temporarily banned from posting/reporting';
  end if;
  return new;
end $$;

drop trigger if exists trg_block_banned_content on public.contents;
create trigger trg_block_banned_content before insert on public.contents for each row execute function public.block_banned_users();
drop trigger if exists trg_block_banned_comments on public.comments;
create trigger trg_block_banned_comments before insert on public.comments for each row execute function public.block_banned_users();
drop trigger if exists trg_block_banned_reports on public.reports;
create trigger trg_block_banned_reports before insert on public.reports for each row execute function public.block_banned_users();

create or replace function public.escalate_on_three_reports() returns trigger language plpgsql as $$
declare report_count int;
begin
  if new.status='open' then
    select count(*) into report_count from public.reports where target_type=new.target_type and target_id=new.target_id and status='open';
    if report_count >= 3 then
      if new.target_type='content' then
        update public.contents set status='needs_review', moderation_method='ai_escalated' where id=new.target_id;
      else
        update public.comments set status='needs_review', moderation_method='ai_escalated' where id=new.target_id;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_escalate_reports on public.reports;
create trigger trg_escalate_reports after insert on public.reports for each row execute function public.escalate_on_three_reports();

alter table public.reports enable row level security;
alter table public.user_moderation enable row level security;

drop policy if exists "read contents" on public.contents;
create policy "public read published contents" on public.contents for select using (status='published' or status is null or public.is_moderator());
create policy "auth create own contents" on public.contents for insert to authenticated with check (auth.uid()=user_id);
create policy "owner delete own contents" on public.contents for delete to authenticated using (auth.uid()=user_id or public.is_moderator());
create policy "mod update contents" on public.contents for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists "public read comments" on public.comments;
create policy "public read published comments" on public.comments for select using (status='published' or status is null or public.is_moderator());
create policy "auth create own comments" on public.comments for insert to authenticated with check (auth.uid()=user_id);
create policy "owner/mod delete comments" on public.comments for delete to authenticated using (auth.uid()=user_id or public.is_moderator());
create policy "mod update comments" on public.comments for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

create policy "auth create reports" on public.reports for insert to authenticated with check (auth.uid()=reporter_id);
create policy "view own reports or mod" on public.reports for select to authenticated using (auth.uid()=reporter_id or public.is_moderator());
create policy "mod update reports" on public.reports for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

create policy "mod manage user moderation" on public.user_moderation for all to authenticated using (public.is_moderator()) with check (public.is_moderator());

create or replace function public.add_user_strike(p_user_id uuid, p_increment int default 1, p_notes text default null)
returns void language plpgsql security definer as $$
declare next_strikes int;
begin
  insert into public.user_moderation(user_id, strikes, notes) values (p_user_id, greatest(p_increment,1), p_notes)
  on conflict (user_id) do update set strikes = public.user_moderation.strikes + greatest(p_increment,1), notes = coalesce(p_notes, public.user_moderation.notes), updated_at=now();
  select strikes into next_strikes from public.user_moderation where user_id=p_user_id;
  if next_strikes >= 3 then
    update public.user_moderation set is_banned=true, banned_until=coalesce(banned_until, now() + interval '7 days') where user_id=p_user_id;
  elsif next_strikes = 2 then
    update public.user_moderation set banned_until=coalesce(banned_until, now() + interval '24 hours') where user_id=p_user_id;
  end if;
end $$;
