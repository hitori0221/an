alter table public.subscription_plans
  add column if not exists group_id uuid references public.subscription_plan_groups(id);

alter table public.subscription_plans
  alter column category_id drop not null;

create index if not exists subscription_plans_group_id_idx
  on public.subscription_plans(group_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscription_plans_category_or_group_check'
      and conrelid = 'public.subscription_plans'::regclass
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_category_or_group_check
      check (
        (case when category_id is null then 0 else 1 end) +
        (case when group_id is null then 0 else 1 end) = 1
      );
  end if;
end $$;;
