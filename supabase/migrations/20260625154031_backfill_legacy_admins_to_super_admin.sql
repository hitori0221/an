do $$
declare
  super_admin_role_id uuid;
begin
  select id
  into super_admin_role_id
  from public.system_roles
  where is_admin
  order by created_at
  limit 1;

  if super_admin_role_id is null then
    raise exception 'Super Admin role does not exist';
  end if;

  update public.profiles
  set role = 'admin',
      permission = 'administrator',
      role_id = super_admin_role_id,
      branch_id = null,
      updated_at = now()
  where role = 'admin'
     or permission = 'administrator';

  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'role', 'admin',
          'permission', 'administrator',
          'role_id', super_admin_role_id,
          'branch_id', null
        ),
      updated_at = now()
  where id in (
    select id
    from public.profiles
    where role = 'admin'
      and role_id = super_admin_role_id
  );
end;
$$;
