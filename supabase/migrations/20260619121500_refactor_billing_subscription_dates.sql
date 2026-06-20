alter table public.subscribers
  add column if not exists next_billing_date date,
  add column if not exists due_date date,
  add column if not exists expiration_date date;

alter table public.billing_invoices
  add column if not exists expiration_date date;

with latest_payment as (
  select distinct on (payment.subscriber_id)
    payment.subscriber_id,
    payment.paid_until
  from public.billing_payments as payment
  where payment.status = 'Posted'
  order by payment.subscriber_id, payment.paid_until desc, payment.created_at desc
),
latest_installation as (
  select distinct on (installation.subscriber_id)
    installation.subscriber_id,
    coalesce(installation.installed_at::date, installation.updated_at::date) as installed_date
  from public.installations as installation
  where installation.status = 'Installed'
  order by installation.subscriber_id, coalesce(installation.installed_at, installation.updated_at) desc
),
resolved_dates as (
  select
    subscriber.id,
    coalesce(
      payment.paid_until + 1,
      installation.installed_date,
      subscriber.contract_start,
      subscriber.created_at::date
    ) as next_billing_date,
    coalesce(
      payment.paid_until,
      (date_trunc(
        'month',
        coalesce(
          installation.installed_date,
          subscriber.contract_start,
          subscriber.created_at::date
        )::timestamp
      ) + interval '1 month - 1 day')::date
    ) as expiration_date
  from public.subscribers as subscriber
  left join latest_payment as payment
    on payment.subscriber_id = subscriber.id
  left join latest_installation as installation
    on installation.subscriber_id = subscriber.id
)
update public.subscribers as subscriber
set
  next_billing_date = coalesce(subscriber.next_billing_date, resolved.next_billing_date),
  due_date = coalesce(
    subscriber.due_date,
    greatest(
      resolved.next_billing_date,
      (date_trunc('month', resolved.next_billing_date::timestamp) + interval '9 day')::date
    )
  ),
  expiration_date = coalesce(subscriber.expiration_date, resolved.expiration_date)
from resolved_dates as resolved
where subscriber.id = resolved.id
  and (
    subscriber.next_billing_date is null
    or subscriber.due_date is null
    or subscriber.expiration_date is null
  );

update public.billing_invoices
set expiration_date = coalesce(expiration_date, service_period_end)
where expiration_date is null;

alter table public.subscribers
  alter column next_billing_date set not null,
  alter column due_date set not null,
  alter column expiration_date set not null;

alter table public.billing_invoices
  alter column expiration_date set not null,
  drop constraint if exists billing_invoices_status_check,
  add constraint billing_invoices_status_check
    check (status in ('Unpaid', 'Partial', 'Overdue', 'Paid', 'Void'));

create index if not exists subscribers_next_billing_date_idx
  on public.subscribers(next_billing_date);

create index if not exists subscribers_due_date_idx
  on public.subscribers(due_date);

create index if not exists subscribers_expiration_date_idx
  on public.subscribers(expiration_date);

create index if not exists billing_invoices_expiration_date_idx
  on public.billing_invoices(expiration_date);

comment on column public.subscribers.next_billing_date is
  'Date when the next invoice should be generated for the subscriber.';

comment on column public.subscribers.due_date is
  'Date when payment is expected for the subscriber''s next billing cycle.';

comment on column public.subscribers.expiration_date is
  'Date when service becomes expired if the subscriber is not renewed.';

comment on column public.billing_invoices.due_date is
  'Payment deadline for this invoice. Invoices can become overdue before service expires.';

comment on column public.billing_invoices.expiration_date is
  'Service expiration date covered by this invoice when the cycle is fully paid.';
