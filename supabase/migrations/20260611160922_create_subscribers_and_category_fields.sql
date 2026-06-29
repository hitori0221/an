create table if not exists public.subscription_category_fields (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.subscription_plan_categories(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  placeholder text,
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_category_fields_key_check check (length(btrim(field_key)) > 0),
  constraint subscription_category_fields_label_check check (length(btrim(label)) > 0),
  constraint subscription_category_fields_type_check check (field_type in ('text', 'password', 'number', 'date', 'select', 'textarea')),
  constraint subscription_category_fields_category_key_unique unique (category_id, field_key)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  account_number text not null,
  first_name text not null,
  last_name text not null,
  phone_number text not null,
  email text,
  city text not null,
  barangay text not null,
  street_zone text,
  branch_id uuid references public.branches(id) on delete set null,
  contract_start date,
  contract_end date,
  subscription_category_id uuid references public.subscription_plan_categories(id) on delete set null,
  subscription_plan_id uuid references public.subscription_plans(id) on delete set null,
  mac_address text,
  caid text,
  connection_type text,
  modem_id uuid references public.modems(id) on delete set null,
  subscription_details jsonb not null default '{}'::jsonb,
  contract_picture_path text,
  remarks text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscribers_account_number_unique unique (account_number),
  constraint subscribers_account_number_check check (length(btrim(account_number)) > 0),
  constraint subscribers_first_name_check check (length(btrim(first_name)) > 0),
  constraint subscribers_last_name_check check (length(btrim(last_name)) > 0),
  constraint subscribers_phone_number_check check (length(btrim(phone_number)) > 0),
  constraint subscribers_city_check check (length(btrim(city)) > 0),
  constraint subscribers_barangay_check check (length(btrim(barangay)) > 0),
  constraint subscribers_connection_type_check check (connection_type is null or connection_type in ('FTTH', 'COAX')),
  constraint subscribers_status_check check (status in ('Active', 'Suspended', 'Inactive'))
);

alter table public.subscription_category_fields enable row level security;
alter table public.subscribers enable row level security;

grant select, insert, update, delete on table public.subscription_category_fields to authenticated;
grant select, insert, update, delete on table public.subscription_category_fields to service_role;
grant select, insert, update, delete on table public.subscribers to authenticated;
grant select, insert, update, delete on table public.subscribers to service_role;

drop policy if exists "Authenticated users can view subscription category fields" on public.subscription_category_fields;
drop policy if exists "Authenticated users can create subscription category fields" on public.subscription_category_fields;
drop policy if exists "Authenticated users can update subscription category fields" on public.subscription_category_fields;
drop policy if exists "Authenticated users can delete subscription category fields" on public.subscription_category_fields;

create policy "Authenticated users can view subscription category fields"
  on public.subscription_category_fields
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create subscription category fields"
  on public.subscription_category_fields
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update subscription category fields"
  on public.subscription_category_fields
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete subscription category fields"
  on public.subscription_category_fields
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can view subscribers" on public.subscribers;
drop policy if exists "Authenticated users can create subscribers" on public.subscribers;
drop policy if exists "Authenticated users can update subscribers" on public.subscribers;
drop policy if exists "Authenticated users can delete subscribers" on public.subscribers;

create policy "Authenticated users can view subscribers"
  on public.subscribers
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create subscribers"
  on public.subscribers
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update subscribers"
  on public.subscribers
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete subscribers"
  on public.subscribers
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

create index if not exists subscription_category_fields_category_id_idx on public.subscription_category_fields(category_id);
create index if not exists subscribers_branch_id_idx on public.subscribers(branch_id);
create index if not exists subscribers_subscription_category_id_idx on public.subscribers(subscription_category_id);
create index if not exists subscribers_subscription_plan_id_idx on public.subscribers(subscription_plan_id);
create index if not exists subscribers_modem_id_idx on public.subscribers(modem_id);
create index if not exists subscribers_status_idx on public.subscribers(status);

insert into public.subscription_category_fields (
  category_id,
  field_key,
  label,
  field_type,
  placeholder,
  is_required,
  sort_order
)
select category.id, field.field_key, field.label, field.field_type, field.placeholder, field.is_required, field.sort_order
from public.subscription_plan_categories category
cross join (
  values
    ('cignal_play_account_number', 'Cignal Play Account Number', 'text', 'Example: CP-000123', true, 10),
    ('username', 'Username', 'text', 'Account username', true, 20),
    ('password', 'Password', 'password', 'Account password', true, 30),
    ('subscribe_promo', 'Subscribe Promo', 'text', 'Promo name or code', false, 40)
) as field(field_key, label, field_type, placeholder, is_required, sort_order)
where lower(category.name) = 'cignal play'
on conflict (category_id, field_key) do update set
  label = excluded.label,
  field_type = excluded.field_type,
  placeholder = excluded.placeholder,
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.subscription_category_fields (
  category_id,
  field_key,
  label,
  field_type,
  placeholder,
  is_required,
  sort_order
)
select category.id, field.field_key, field.label, field.field_type, field.placeholder, field.is_required, field.sort_order
from public.subscription_plan_categories category
cross join (
  values
    ('iptv_id', 'IPTV ID', 'text', 'Example: IPTV-000123', true, 10),
    ('username', 'Username', 'text', 'Account username', true, 20),
    ('password', 'Password', 'password', 'Account password', true, 30)
) as field(field_key, label, field_type, placeholder, is_required, sort_order)
where lower(category.name) = 'iptv'
on conflict (category_id, field_key) do update set
  label = excluded.label,
  field_type = excluded.field_type,
  placeholder = excluded.placeholder,
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subscriber-contracts',
  'subscriber-contracts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on table storage.objects to authenticated;

drop policy if exists "Authenticated users can view subscriber contracts" on storage.objects;
drop policy if exists "Authenticated users can upload subscriber contracts" on storage.objects;
drop policy if exists "Authenticated users can update subscriber contracts" on storage.objects;
drop policy if exists "Authenticated users can delete subscriber contracts" on storage.objects;

create policy "Authenticated users can view subscriber contracts"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'subscriber-contracts' and (select auth.uid()) is not null);

create policy "Authenticated users can upload subscriber contracts"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'subscriber-contracts' and (select auth.uid()) is not null);

create policy "Authenticated users can update subscriber contracts"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'subscriber-contracts' and (select auth.uid()) is not null)
  with check (bucket_id = 'subscriber-contracts' and (select auth.uid()) is not null);

create policy "Authenticated users can delete subscriber contracts"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'subscriber-contracts' and (select auth.uid()) is not null);;
