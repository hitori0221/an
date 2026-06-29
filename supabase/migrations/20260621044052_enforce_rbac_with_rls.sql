create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.has_permission(resource_name text, action_name text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles pr join public.system_roles r on r.id=pr.role_id left join public.role_permissions rp on rp.role_id=r.id left join public.permissions pe on pe.id=rp.permission_id where pr.id=(select auth.uid()) and (r.is_admin or (pe.resource=resource_name and pe.action=action_name))) $$;
revoke all on function private.has_permission(text,text) from public, anon, authenticated;
do $$
declare rec record; pol record;
begin
 for rec in select * from (values ('subscribers','subscribers'),('installations','installations'),('job_orders','job_orders'),('service_requests','service_requests'),('billing_payments','payments'),('branches','branches'),('modems','modems'),('subscription_plans','subscription_plans'),('subscription_plan_categories','subscription_plans'),('subscription_plan_groups','subscription_plans'),('subscription_plan_group_categories','subscription_plans'),('subscription_category_fields','subscription_plans')) as x(table_name,resource_name)
 loop
  for pol in select policyname from pg_policies where schemaname='public' and tablename=rec.table_name loop execute format('drop policy if exists %I on public.%I',pol.policyname,rec.table_name); end loop;
  execute format('create policy %I on public.%I for select to authenticated using (private.has_permission(%L,%L))','RBAC view '||rec.table_name,rec.table_name,rec.resource_name,'view');
  execute format('create policy %I on public.%I for insert to authenticated with check (private.has_permission(%L,%L))','RBAC create '||rec.table_name,rec.table_name,rec.resource_name,'create');
  execute format('create policy %I on public.%I for update to authenticated using (private.has_permission(%L,%L)) with check (private.has_permission(%L,%L))','RBAC edit '||rec.table_name,rec.table_name,rec.resource_name,'edit',rec.resource_name,'edit');
  execute format('create policy %I on public.%I for delete to authenticated using (private.has_permission(%L,%L))','RBAC delete '||rec.table_name,rec.table_name,rec.resource_name,'delete');
 end loop;
end $$;;
