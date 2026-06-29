alter table public.system_permissions rename to system_roles;
alter table public.profiles rename column permission_id to role_id;
alter index if exists profiles_permission_id_idx rename to profiles_role_id_idx;
alter table public.system_roles rename constraint system_permissions_pkey to system_roles_pkey;
alter table public.system_roles rename constraint system_permissions_name_key to system_roles_name_key;

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null check (action in ('view','create','edit','delete')),
  unique(resource, action)
);
alter table public.permissions enable row level security;

create table public.role_permissions (
  role_id uuid not null references public.system_roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key(role_id, permission_id)
);
alter table public.role_permissions enable row level security;

insert into public.permissions(resource, action)
select resource, action from
  unnest(array['overview','subscribers','installations','job_orders','service_requests','payments','expirations','collections','subscription_plans','modems','branches','system_users']) resource
cross join unnest(array['view','create','edit','delete']) action
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.system_roles r cross join public.permissions p
where r.is_admin
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.system_roles r join public.permissions p on
  (r.name = 'Operations' and p.resource in ('overview','subscribers','installations','job_orders','service_requests'))
  or (r.name = 'Billing Management' and p.resource in ('payments','expirations','collections'))
on conflict do nothing;;
