alter table public.billing_invoices
  add column if not exists invoice_date date,
  add column if not exists service_period_start date,
  add column if not exists service_period_end date;

update public.billing_invoices
set
  invoice_date = coalesce(invoice_date, created_at::date),
  service_period_start = coalesce(
    service_period_start,
    to_date(billing_period || '-01', 'YYYY-MM-DD')
  ),
  service_period_end = coalesce(
    service_period_end,
    (to_date(billing_period || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day')::date
  )
where invoice_date is null
  or service_period_start is null
  or service_period_end is null;

alter table public.billing_invoices
  alter column invoice_date set not null,
  alter column invoice_date set default current_date,
  alter column service_period_start set not null,
  alter column service_period_end set not null;

alter table public.billing_invoices
  drop constraint if exists billing_invoices_service_period_check,
  add constraint billing_invoices_service_period_check
    check (service_period_start <= service_period_end);

create index if not exists billing_invoices_invoice_date_idx
  on public.billing_invoices(invoice_date desc);
create index if not exists billing_invoices_service_period_idx
  on public.billing_invoices(service_period_start, service_period_end);
