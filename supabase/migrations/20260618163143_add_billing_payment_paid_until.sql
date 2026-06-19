alter table public.billing_payments
  add column if not exists paid_until date;

update public.billing_payments as payment
set paid_until = coalesce(payment.paid_until, invoice.service_period_end)
from public.billing_invoices as invoice
where payment.invoice_id = invoice.id
  and payment.paid_until is null;

alter table public.billing_payments
  alter column paid_until set not null;

create index if not exists billing_payments_paid_until_idx
  on public.billing_payments(paid_until desc);
