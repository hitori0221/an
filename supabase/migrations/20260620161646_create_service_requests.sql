create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.billing_payments(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  category_id uuid not null references public.subscription_plan_categories(id) on delete restrict,
  status text not null default 'Pending',
  remark text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_payment_category_unique unique (payment_id, category_id),
  constraint service_requests_status_check check (status in ('Pending', 'Verified')),
  constraint service_requests_verification_check check (
    (status = 'Pending' and verified_at is null and verified_by is null)
    or (status = 'Verified' and verified_at is not null and verified_by is not null)
  )
);

alter table public.service_requests enable row level security;
grant select, insert, update, delete on table public.service_requests to authenticated;
grant select, insert, update, delete on table public.service_requests to service_role;

create policy "Authenticated users can view service requests"
  on public.service_requests for select to authenticated using (true);
create policy "Authenticated users can create service requests"
  on public.service_requests for insert to authenticated
  with check ((select auth.uid()) is not null and status = 'Pending');
create policy "Authenticated users can verify service requests"
  on public.service_requests for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and status in ('Pending', 'Verified'));
create policy "Authenticated users can delete service requests"
  on public.service_requests for delete to authenticated using ((select auth.uid()) is not null);

create index service_requests_category_status_created_idx
  on public.service_requests(category_id, status, created_at desc);
create index service_requests_subscriber_id_idx on public.service_requests(subscriber_id);

create or replace function public.create_service_requests_for_payment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status <> 'Posted' then return new; end if;

  insert into public.service_requests (payment_id, subscriber_id, category_id)
  select new.id, new.subscriber_id, targets.category_id
  from public.subscribers s
  join public.subscription_plans p on p.id = s.subscription_plan_id
  cross join lateral (
    select p.category_id where p.group_id is null and p.category_id is not null
    union
    select pgc.category_id
    from public.subscription_plan_group_categories pgc
    where pgc.group_id = p.group_id
  ) targets
  where s.id = new.subscriber_id
  on conflict (payment_id, category_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_service_requests_for_payment() from public;

drop trigger if exists create_service_requests_after_payment on public.billing_payments;
create trigger create_service_requests_after_payment
after insert or update of status on public.billing_payments
for each row execute function public.create_service_requests_for_payment();

insert into public.service_requests (payment_id, subscriber_id, category_id)
select pmt.id, pmt.subscriber_id, targets.category_id
from public.billing_payments pmt
join public.subscribers s on s.id = pmt.subscriber_id
join public.subscription_plans plan on plan.id = s.subscription_plan_id
cross join lateral (
  select plan.category_id where plan.group_id is null and plan.category_id is not null
  union
  select pgc.category_id
  from public.subscription_plan_group_categories pgc
  where pgc.group_id = plan.group_id
) targets
where pmt.status = 'Posted'
on conflict (payment_id, category_id) do nothing;

;
