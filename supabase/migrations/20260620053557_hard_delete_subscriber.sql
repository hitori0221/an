create or replace function public.hard_delete_subscriber(target_subscriber_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.billing_payments
  where subscriber_id = target_subscriber_id;

  delete from public.billing_invoices
  where subscriber_id = target_subscriber_id;

  delete from public.job_orders
  where subscriber_id = target_subscriber_id;

  delete from public.installations
  where subscriber_id = target_subscriber_id;

  delete from public.subscribers
  where id = target_subscriber_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Subscriber was not found or could not be deleted';
  end if;

  return true;
end;
$$;

revoke all on function public.hard_delete_subscriber(uuid) from public;
revoke all on function public.hard_delete_subscriber(uuid) from anon;
grant execute on function public.hard_delete_subscriber(uuid) to authenticated;
grant execute on function public.hard_delete_subscriber(uuid) to service_role;

comment on function public.hard_delete_subscriber(uuid) is
  'Permanently deletes a subscriber and all dependent operational and billing records in one transaction.';
