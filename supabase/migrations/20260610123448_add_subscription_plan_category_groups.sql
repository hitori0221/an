create table if not exists public.subscription_plan_category_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.subscription_plan_category_group_categories (
  group_id uuid not null references public.subscription_plan_category_groups(id) on delete cascade,
  category_id uuid not null references public.subscription_plan_categories(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (group_id, category_id)
);

alter table public.subscription_plan_category_groups enable row level security;
alter table public.subscription_plan_category_group_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_groups'
      and policyname = 'Authenticated users can view subscription plan category groups'
  ) then
    create policy "Authenticated users can view subscription plan category groups"
      on public.subscription_plan_category_groups
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_groups'
      and policyname = 'Authenticated users can create subscription plan category groups'
  ) then
    create policy "Authenticated users can create subscription plan category groups"
      on public.subscription_plan_category_groups
      for insert
      to authenticated
      with check ((select auth.uid()) is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_groups'
      and policyname = 'Authenticated users can update subscription plan category groups'
  ) then
    create policy "Authenticated users can update subscription plan category groups"
      on public.subscription_plan_category_groups
      for update
      to authenticated
      using ((select auth.uid()) is not null)
      with check ((select auth.uid()) is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_groups'
      and policyname = 'Authenticated users can delete subscription plan category groups'
  ) then
    create policy "Authenticated users can delete subscription plan category groups"
      on public.subscription_plan_category_groups
      for delete
      to authenticated
      using ((select auth.uid()) is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_group_categories'
      and policyname = 'Authenticated users can view subscription plan category group categories'
  ) then
    create policy "Authenticated users can view subscription plan category group categories"
      on public.subscription_plan_category_group_categories
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_group_categories'
      and policyname = 'Authenticated users can create subscription plan category group categories'
  ) then
    create policy "Authenticated users can create subscription plan category group categories"
      on public.subscription_plan_category_group_categories
      for insert
      to authenticated
      with check ((select auth.uid()) is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plan_category_group_categories'
      and policyname = 'Authenticated users can delete subscription plan category group categories'
  ) then
    create policy "Authenticated users can delete subscription plan category group categories"
      on public.subscription_plan_category_group_categories
      for delete
      to authenticated
      using ((select auth.uid()) is not null);
  end if;
end $$;;
