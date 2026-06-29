create table if not exists public.system_permissions (id uuid primary key default gen_random_uuid(), name text not null unique check (length(btrim(name)) > 0), branch_required boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.system_permissions enable row level security;
insert into public.system_permissions (name, branch_required) values ('Administrator', false), ('Billing Management', true), ('Operations', false) on conflict (name) do nothing;
alter table public.profiles add column if not exists permission_id uuid references public.system_permissions(id) on delete restrict;
update public.profiles p set permission_id = sp.id from public.system_permissions sp where p.permission_id is null and lower(replace(sp.name, ' ', '_')) = p.permission;
alter table public.profiles alter column permission_id set not null;
create index if not exists profiles_permission_id_idx on public.profiles(permission_id);;
