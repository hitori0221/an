alter table public.subscriptions rename to subscription_plans;

alter table public.accounts
  add column if not exists subscription_id bigint;

with latest_subscription as (
  select distinct on (sp.account_id)
    sp.account_id,
    sp.id as subscription_id
  from public.subscription_plans sp
  where sp.account_id is not null
  order by sp.account_id, sp.created_at desc, sp.id desc
)
update public.accounts a
set subscription_id = latest_subscription.subscription_id
from latest_subscription
where latest_subscription.account_id = a.id;

alter table public.subscription_plans
  drop constraint if exists subscriptions_account_id_fkey;

alter table public.subscription_plans
  drop column if exists account_id;

alter table public.accounts
  add constraint accounts_subscription_id_fkey
  foreign key (subscription_id) references public.subscription_plans(id);;
