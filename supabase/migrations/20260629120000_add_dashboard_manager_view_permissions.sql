insert into public.permissions(resource, action)
values
  ('dashboard', 'view'),
  ('manager_view', 'view')
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select distinct rp.role_id, new_permissions.id
from public.role_permissions rp
join public.permissions existing_permissions
  on existing_permissions.id = rp.permission_id
 and existing_permissions.resource = 'overview'
 and existing_permissions.action = 'view'
join public.permissions new_permissions
  on new_permissions.resource in ('dashboard', 'manager_view')
 and new_permissions.action = 'view'
on conflict do nothing;
