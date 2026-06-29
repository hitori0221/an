update public.system_roles set name='Super Admin', is_admin=true where is_admin;
insert into public.system_roles(name, branch_required, is_admin)
select 'Super Admin', false, true where not exists(select 1 from public.system_roles where is_admin);
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.system_roles r cross join public.permissions p where r.is_admin
on conflict do nothing;
create or replace function private.grant_new_permissions_to_super_admin()
returns trigger language plpgsql security definer set search_path=''
as $$ begin insert into public.role_permissions(role_id,permission_id) select id,new.id from public.system_roles where is_admin on conflict do nothing; return new; end $$;
drop trigger if exists grant_new_permissions_to_super_admin on public.permissions;
create trigger grant_new_permissions_to_super_admin after insert on public.permissions for each row execute function private.grant_new_permissions_to_super_admin();
revoke all on function private.grant_new_permissions_to_super_admin() from public,anon,authenticated;;
