-- Headshot uploads (#133): a public `headshots` bucket and set_my_photo.
-- Additive: a new bucket, storage policies and one function.
--
-- Members write only their own folder (<auth uid>/avatar.jpg) and save the
-- address through set_my_photo, which touches only their own photo_url.
-- Managers who edit people in the Directory upload into people/<person id>/
-- and save the address with the card's normal save.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('headshots', 'headshots', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

create policy "headshots are public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'headshots');

create policy "members manage their own headshot"
on storage.objects for all to authenticated
using (bucket_id = 'headshots' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'headshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "people managers manage headshots"
on storage.objects for all to authenticated
using (bucket_id = 'headshots' and (storage.foldername(name))[1] = 'people'
       and (is_oversight() or is_membership_manager() or is_cert_manager() or is_instructor_manager() or is_internship_manager()))
with check (bucket_id = 'headshots' and (storage.foldername(name))[1] = 'people'
       and (is_oversight() or is_membership_manager() or is_cert_manager() or is_instructor_manager() or is_internship_manager()));

create or replace function public.set_my_photo(p_url text) returns void
language sql security definer set search_path = public as $$
  update people set photo_url = nullif(trim(p_url), ''), updated_at = now()
  where auth_user_id = auth.uid();
$$;
revoke all on function public.set_my_photo(text) from public, anon;
grant execute on function public.set_my_photo(text) to authenticated;
