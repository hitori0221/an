create or replace function private.branch_in_scope(row_branch uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles p join public.system_roles r on r.id=p.role_id where p.id=(select auth.uid()) and (not r.branch_required or p.branch_id=row_branch)) $$;
create or replace function private.subscriber_in_scope(row_subscriber uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select private.branch_in_scope((select s.branch_id from public.subscribers s where s.id=row_subscriber)) $$;
revoke all on function private.branch_in_scope(uuid) from public,anon,authenticated;
revoke all on function private.subscriber_in_scope(uuid) from public,anon,authenticated;

drop policy "RBAC view subscribers" on public.subscribers;
drop policy "RBAC create subscribers" on public.subscribers;
drop policy "RBAC edit subscribers" on public.subscribers;
drop policy "RBAC delete subscribers" on public.subscribers;
create policy "RBAC view subscribers" on public.subscribers for select to authenticated using (private.has_permission('subscribers','view') and private.branch_in_scope(branch_id));
create policy "RBAC create subscribers" on public.subscribers for insert to authenticated with check (private.has_permission('subscribers','create') and private.branch_in_scope(branch_id));
create policy "RBAC edit subscribers" on public.subscribers for update to authenticated using (private.has_permission('subscribers','edit') and private.branch_in_scope(branch_id)) with check (private.has_permission('subscribers','edit') and private.branch_in_scope(branch_id));
create policy "RBAC delete subscribers" on public.subscribers for delete to authenticated using (private.has_permission('subscribers','delete') and private.branch_in_scope(branch_id));

do $$ declare rec record; begin
for rec in select * from (values ('installations','installations'),('job_orders','job_orders'),('service_requests','service_requests'),('billing_payments','payments')) as x(table_name,resource_name)
loop
 execute format('drop policy %I on public.%I','RBAC view '||rec.table_name,rec.table_name);
 execute format('drop policy %I on public.%I','RBAC create '||rec.table_name,rec.table_name);
 execute format('drop policy %I on public.%I','RBAC edit '||rec.table_name,rec.table_name);
 execute format('drop policy %I on public.%I','RBAC delete '||rec.table_name,rec.table_name);
 execute format('create policy %I on public.%I for select to authenticated using (private.has_permission(%L,%L) and private.subscriber_in_scope(subscriber_id))','RBAC view '||rec.table_name,rec.table_name,rec.resource_name,'view');
 execute format('create policy %I on public.%I for insert to authenticated with check (private.has_permission(%L,%L) and private.subscriber_in_scope(subscriber_id))','RBAC create '||rec.table_name,rec.table_name,rec.resource_name,'create');
 execute format('create policy %I on public.%I for update to authenticated using (private.has_permission(%L,%L) and private.subscriber_in_scope(subscriber_id)) with check (private.has_permission(%L,%L) and private.subscriber_in_scope(subscriber_id))','RBAC edit '||rec.table_name,rec.table_name,rec.resource_name,'edit',rec.resource_name,'edit');
 execute format('create policy %I on public.%I for delete to authenticated using (private.has_permission(%L,%L) and private.subscriber_in_scope(subscriber_id))','RBAC delete '||rec.table_name,rec.table_name,rec.resource_name,'delete');
end loop; end $$;;
