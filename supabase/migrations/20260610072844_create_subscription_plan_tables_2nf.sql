create table if not exists public.subscription_plan_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plan_categories_name_key unique (name),
  constraint subscription_plan_categories_name_not_blank check (length(btrim(name)) > 0)
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.subscription_plan_categories(id) on update cascade on delete restrict,
  plan_code text not null,
  name text not null,
  billing_type text not null,
  speed text not null default '-',
  channels text not null default '-',
  price numeric(10, 2) not null default 0,
  subscribers integer not null default 0,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_plan_code_key unique (plan_code),
  constraint subscription_plans_plan_code_not_blank check (length(btrim(plan_code)) > 0),
  constraint subscription_plans_name_not_blank check (length(btrim(name)) > 0),
  constraint subscription_plans_billing_type_check check (billing_type in ('Prepaid', 'Postpaid')),
  constraint subscription_plans_status_check check (status in ('Active', 'Draft', 'Archived')),
  constraint subscription_plans_price_check check (price >= 0),
  constraint subscription_plans_subscribers_check check (subscribers >= 0)
);

create index if not exists subscription_plans_category_id_idx on public.subscription_plans(category_id);
create index if not exists subscription_plans_status_idx on public.subscription_plans(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists set_subscription_plan_categories_updated_at on public.subscription_plan_categories;
create trigger set_subscription_plan_categories_updated_at
before update on public.subscription_plan_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

alter table public.subscription_plan_categories enable row level security;
alter table public.subscription_plans enable row level security;

drop policy if exists "Authenticated users can view subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can view subscription plan categories"
on public.subscription_plan_categories
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can create subscription plan categories"
on public.subscription_plan_categories
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can update subscription plan categories"
on public.subscription_plan_categories
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can delete subscription plan categories"
on public.subscription_plan_categories
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can view subscription plans" on public.subscription_plans;
create policy "Authenticated users can view subscription plans"
on public.subscription_plans
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create subscription plans" on public.subscription_plans;
create policy "Authenticated users can create subscription plans"
on public.subscription_plans
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update subscription plans" on public.subscription_plans;
create policy "Authenticated users can update subscription plans"
on public.subscription_plans
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete subscription plans" on public.subscription_plans;
create policy "Authenticated users can delete subscription plans"
on public.subscription_plans
for delete
to authenticated
using (true);

grant select, insert, update, delete on table public.subscription_plan_categories to authenticated, service_role;
grant select, insert, update, delete on table public.subscription_plans to authenticated, service_role;

insert into public.subscription_plan_categories (name)
values ('Internet'), ('Cable'), ('Combo'), ('Extension')
on conflict (name) do nothing;

with seeded_plans(plan_code, name, category_name, billing_type, speed, channels, price, subscribers, status, updated_at) as (
  values
    ('INT-LITE-25', 'AN Lite-Net 25mbps', 'Internet', 'Prepaid', '25 Mbps', '-', 699::numeric, 24, 'Active', '2026-05-04'::timestamptz),
    ('INT-NEW-100-999', 'AN NEW 100mbps 999', 'Internet', 'Prepaid', '100 Mbps', '-', 999::numeric, 5, 'Active', '2026-05-04'::timestamptz),
    ('CAB-PRIME-60', 'Access Prime', 'Cable', 'Postpaid', '-', '60 channels', 450::numeric, 12, 'Active', '2026-05-02'::timestamptz),
    ('CAB-PREM-75', 'Access Premium', 'Cable', 'Postpaid', '-', '75 channels', 550::numeric, 10, 'Active', '2026-05-02'::timestamptz),
    ('COMBO-15M-UNLI-MAX-5', 'COMBO-15M-UNLI-MAX-5', 'Combo', 'Postpaid', '15 Mbps', 'Access Prime', 999::numeric, 2, 'Draft', '2026-04-28'::timestamptz),
    ('EXT-TV', 'TV Extension', 'Extension', 'Prepaid', '-', 'Extension', 150::numeric, 3, 'Archived', '2026-04-19'::timestamptz)
)
insert into public.subscription_plans (
  plan_code,
  name,
  category_id,
  billing_type,
  speed,
  channels,
  price,
  subscribers,
  status,
  updated_at
)
select
  seeded_plans.plan_code,
  seeded_plans.name,
  categories.id,
  seeded_plans.billing_type,
  seeded_plans.speed,
  seeded_plans.channels,
  seeded_plans.price,
  seeded_plans.subscribers,
  seeded_plans.status,
  seeded_plans.updated_at
from seeded_plans
join public.subscription_plan_categories categories on categories.name = seeded_plans.category_name
on conflict (plan_code) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  billing_type = excluded.billing_type,
  speed = excluded.speed,
  channels = excluded.channels,
  price = excluded.price,
  subscribers = excluded.subscribers,
  status = excluded.status,
  updated_at = excluded.updated_at;;
