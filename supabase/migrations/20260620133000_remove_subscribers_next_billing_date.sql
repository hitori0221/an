drop index if exists public.subscribers_next_billing_date_idx;

alter table public.subscribers
  drop column if exists next_billing_date;
