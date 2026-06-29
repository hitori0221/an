alter table public.accounts
add column if not exists status text not null default 'active';;
