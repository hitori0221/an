create unique index if not exists billing_invoices_subscriber_period_unique_idx
  on public.billing_invoices(subscriber_id, billing_period);;
