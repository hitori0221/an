create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null unique check (length(btrim(branch_code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  address text not null default ''::text,
  subscribers integer not null default 0 check (subscribers >= 0),
  status text not null default 'Active'::text check (status in ('Active', 'Maintenance', 'Inactive')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.branches enable row level security;

create policy "Authenticated users can view branches"
  on public.branches for select
  to authenticated
  using (true);

create policy "Authenticated users can create branches"
  on public.branches for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update branches"
  on public.branches for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete branches"
  on public.branches for delete
  to authenticated
  using ((select auth.uid()) is not null);

insert into public.branches (branch_code, name, address, subscribers, status)
values
  ('RIZ', 'Rizal', 'Rizal', 0, 'Active'),
  ('PAN', 'Pantabangan', 'Pantabangan', 0, 'Active'),
  ('FIC', 'Fica', 'San Jose City', 0, 'Active'),
  ('LLA', 'Llanera', 'Llanera', 0, 'Active'),
  ('CAR', 'Carranglan', 'Carranglan', 0, 'Active')
on conflict (branch_code) do nothing;;
