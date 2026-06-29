alter table public.billing_payments
  add column if not exists receipt_photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on table storage.objects to authenticated;

drop policy if exists "Authenticated users can view payment receipts" on storage.objects;
drop policy if exists "Authenticated users can upload payment receipts" on storage.objects;
drop policy if exists "Authenticated users can update payment receipts" on storage.objects;
drop policy if exists "Authenticated users can delete payment receipts" on storage.objects;

create policy "Authenticated users can view payment receipts"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'payment-receipts' and (select auth.uid()) is not null);

create policy "Authenticated users can upload payment receipts"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'payment-receipts' and (select auth.uid()) is not null);

create policy "Authenticated users can update payment receipts"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'payment-receipts' and (select auth.uid()) is not null)
  with check (bucket_id = 'payment-receipts' and (select auth.uid()) is not null);

create policy "Authenticated users can delete payment receipts"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'payment-receipts' and (select auth.uid()) is not null);;
