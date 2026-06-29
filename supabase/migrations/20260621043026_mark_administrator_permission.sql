alter table public.system_permissions add column if not exists is_admin boolean not null default false;
update public.system_permissions set is_admin = true where name = 'Administrator';
create unique index if not exists system_permissions_single_admin_idx on public.system_permissions(is_admin) where is_admin;;
