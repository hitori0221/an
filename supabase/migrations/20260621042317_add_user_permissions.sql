alter table public.profiles add column if not exists permission text, add column if not exists branch_id uuid references public.branches(id) on delete restrict;
update public.profiles set permission = case when role = 'admin' then 'administrator' else 'operations' end where permission is null;
alter table public.profiles alter column permission set default 'operations', alter column permission set not null;
alter table public.profiles drop constraint if exists profiles_permission_check;
alter table public.profiles drop constraint if exists profiles_billing_branch_check;
alter table public.profiles add constraint profiles_permission_check check (permission in ('administrator', 'billing_management', 'operations')), add constraint profiles_billing_branch_check check (permission <> 'billing_management' or branch_id is not null);
create index if not exists profiles_branch_id_idx on public.profiles(branch_id);;
