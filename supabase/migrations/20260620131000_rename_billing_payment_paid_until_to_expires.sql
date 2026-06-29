alter table public.billing_payments
  rename column paid_until to expires;

alter index if exists billing_payments_paid_until_idx
  rename to billing_payments_expires_idx;
