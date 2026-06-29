create table if not exists public.modems (
  id uuid primary key default gen_random_uuid(),
  modem_code text not null,
  name text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modems_modem_code_unique unique (modem_code),
  constraint modems_modem_code_check check (length(btrim(modem_code)) > 0),
  constraint modems_name_check check (length(btrim(name)) > 0),
  constraint modems_status_check check (status in ('Active', 'Maintenance', 'Inactive'))
);

alter table public.modems enable row level security;

grant select, insert, update, delete on table public.modems to authenticated;
grant select, insert, update, delete on table public.modems to service_role;

drop policy if exists "Authenticated users can manage modems" on public.modems;

create policy "Authenticated users can manage modems"
  on public.modems
  for all
  to authenticated
  using (true)
  with check (true);

create index if not exists modems_status_idx on public.modems (status);;
