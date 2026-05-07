-- HoloStem Supabase Storage policies
-- Optional: run after 001_holostem_schema.sql if you want the public `videos`
-- bucket for authenticated user uploads.

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "videos are public readable" on storage.objects;
create policy "videos are public readable"
on storage.objects
for select
using (bucket_id = 'videos');

drop policy if exists "users upload videos to own folder" on storage.objects;
create policy "users upload videos to own folder"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users update videos in own folder" on storage.objects;
create policy "users update videos in own folder"
on storage.objects
for update
to authenticated
using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users delete videos in own folder" on storage.objects;
create policy "users delete videos in own folder"
on storage.objects
for delete
to authenticated
using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
