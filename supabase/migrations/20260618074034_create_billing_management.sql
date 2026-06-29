create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  subscription_plan_id uuid references public.subscription_plans(id) on delete set null,
  plan_name text not null default '',
  billing_period text not null,
  due_date date not null,
  amount numeric(12, 2) not null,
  paid_amount numeric(12, 2) not null default 0,
  balance numeric(12, 2) not null,
  status text not null default 'Unpaid',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_invoices_invoice_number_unique unique (invoice_number),
  constraint billing_invoices_invoice_number_check check (length(btrim(invoice_number)) > 0),
  constraint billing_invoices_billing_period_check check (billing_period ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint billing_invoices_amount_check check (amount >= 0),
  constraint billing_invoices_paid_amount_check check (paid_amount >= 0),
  constraint billing_invoices_balance_check check (balance >= 0),
  constraint billing_invoices_status_check check (status in ('Unpaid', 'Partial', 'Paid', 'Void'))
);

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id) on delete restrict,
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  amount numeric(12, 2) not null,
  payment_date date not null default current_date,
  method text not null default 'Cash',
  reference_number text,
  collector text not null default '',
  notes text not null default '',
  status text not null default 'Posted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payments_amount_check check (amount > 0),
  constraint billing_payments_method_check check (method in ('Cash', 'GCash', 'Bank Transfer', 'Card', 'Check', 'Other')),
  constraint billing_payments_status_check check (status in ('Posted', 'Void'))
);

alter table public.billing_invoices enable row level security;
alter table public.billing_payments enable row level security;

grant select, insert, update, delete on table public.billing_invoices to authenticated;
grant select, insert, update, delete on table public.billing_invoices to service_role;
grant select, insert, update, delete on table public.billing_payments to authenticated;
grant select, insert, update, delete on table public.billing_payments to service_role;

drop policy if exists "Authenticated users can view billing invoices" on public.billing_invoices;
drop policy if exists "Authenticated users can create billing invoices" on public.billing_invoices;
drop policy if exists "Authenticated users can update billing invoices" on public.billing_invoices;
drop policy if exists "Authenticated users can delete billing invoices" on public.billing_invoices;

create policy "Authenticated users can view billing invoices"
  on public.billing_invoices
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create billing invoices"
  on public.billing_invoices
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update billing invoices"
  on public.billing_invoices
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete billing invoices"
  on public.billing_invoices
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can view billing payments" on public.billing_payments;
drop policy if exists "Authenticated users can create billing payments" on public.billing_payments;
drop policy if exists "Authenticated users can update billing payments" on public.billing_payments;
drop policy if exists "Authenticated users can delete billing payments" on public.billing_payments;

create policy "Authenticated users can view billing payments"
  on public.billing_payments
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create billing payments"
  on public.billing_payments
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update billing payments"
  on public.billing_payments
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete billing payments"
  on public.billing_payments
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

create index if not exists billing_invoices_subscriber_id_idx on public.billing_invoices(subscriber_id);
create index if not exists billing_invoices_status_idx on public.billing_invoices(status);
create index if not exists billing_invoices_billing_period_idx on public.billing_invoices(billing_period);
create index if not exists billing_invoices_due_date_idx on public.billing_invoices(due_date);
create index if not exists billing_payments_invoice_id_idx on public.billing_payments(invoice_id);
create index if not exists billing_payments_subscriber_id_idx on public.billing_payments(subscriber_id);
create index if not exists billing_payments_payment_date_idx on public.billing_payments(payment_date desc);
create index if not exists billing_payments_collector_idx on public.billing_payments(collector);;
