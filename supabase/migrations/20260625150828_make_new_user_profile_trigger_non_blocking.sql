create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    insert into public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      role,
      permission,
      role_id,
      branch_id
    )
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url',
      coalesce(new.raw_app_meta_data ->> 'role', 'staff'),
      coalesce(new.raw_app_meta_data ->> 'permission', 'operations'),
      nullif(new.raw_app_meta_data ->> 'role_id', '')::uuid,
      nullif(new.raw_app_meta_data ->> 'branch_id', '')::uuid
    )
    on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        role = excluded.role,
        permission = excluded.permission,
        role_id = excluded.role_id,
        branch_id = excluded.branch_id,
        updated_at = now();
  exception
    when others then
      -- Profile creation is retried by the server-side user-management route.
      -- A profile schema issue must not abort insertion into auth.users.
      raise warning 'Could not create profile for auth user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
