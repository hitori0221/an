create table if not exists public.job_orders (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  subscriber_id uuid not null references public.subscribers(id) on delete restrict,
  technician text not null default '',
  problem_category text not null,
  problem_details text not null default '',
  status text not null default 'Assigned',
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_orders_ticket_number_unique unique (ticket_number),
  constraint job_orders_ticket_number_check check (length(btrim(ticket_number)) > 0),
  constraint job_orders_problem_category_check check (
    problem_category in (
      'No Internet',
      'Slow Connection',
      'LOS / Fiber Cut',
      'Router Issue',
      'Billing Concern',
      'Relocation',
      'Other'
    )
  ),
  constraint job_orders_problem_details_check check (length(btrim(problem_details)) > 0),
  constraint job_orders_status_check check (
    status in ('Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Cancelled')
  ),
  constraint job_orders_activities_array_check check (jsonb_typeof(activities) = 'array')
);

alter table public.job_orders enable row level security;

grant select, insert, update, delete on table public.job_orders to authenticated;
grant select, insert, update, delete on table public.job_orders to service_role;

drop policy if exists "Authenticated users can view job orders" on public.job_orders;
drop policy if exists "Authenticated users can create job orders" on public.job_orders;
drop policy if exists "Authenticated users can update job orders" on public.job_orders;
drop policy if exists "Authenticated users can delete job orders" on public.job_orders;

create policy "Authenticated users can view job orders"
  on public.job_orders
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create job orders"
  on public.job_orders
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update job orders"
  on public.job_orders
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete job orders"
  on public.job_orders
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

create index if not exists job_orders_subscriber_id_idx on public.job_orders(subscriber_id);
create index if not exists job_orders_status_idx on public.job_orders(status);
create index if not exists job_orders_created_at_idx on public.job_orders(created_at desc);
create index if not exists job_orders_problem_category_idx on public.job_orders(problem_category);
