create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop policy if exists "Authenticated users can create subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can create subscription plan categories"
on public.subscription_plan_categories
for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can update subscription plan categories"
on public.subscription_plan_categories
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can delete subscription plan categories" on public.subscription_plan_categories;
create policy "Authenticated users can delete subscription plan categories"
on public.subscription_plan_categories
for delete
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can create subscription plans" on public.subscription_plans;
create policy "Authenticated users can create subscription plans"
on public.subscription_plans
for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update subscription plans" on public.subscription_plans;
create policy "Authenticated users can update subscription plans"
on public.subscription_plans
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can delete subscription plans" on public.subscription_plans;
create policy "Authenticated users can delete subscription plans"
on public.subscription_plans
for delete
to authenticated
using ((select auth.uid()) is not null);;
