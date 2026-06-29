alter table public.subscription_plan_categories
add column if not exists icon_data_url text;

alter table public.subscription_plan_categories
drop constraint if exists subscription_plan_categories_icon_data_url_check;

alter table public.subscription_plan_categories
add constraint subscription_plan_categories_icon_data_url_check
check (
  icon_data_url is null
  or (
    icon_data_url ~ '^data:image/(jpeg|png|webp);base64,'
    and length(icon_data_url) <= 131072
  )
);;
