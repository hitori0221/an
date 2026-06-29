alter table public.installations
  add column if not exists installed_at date;

update public.installations
set installed_at = coalesce(schedule_date, updated_at::date, created_at::date)
where status = 'Installed'
  and installed_at is null;

create index if not exists installations_installed_at_idx on public.installations(installed_at);;
