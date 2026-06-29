alter table public.subscribers
  drop constraint if exists subscribers_status_check;

alter table public.subscribers
  add constraint subscribers_status_check
  check (status in ('Active', 'Inactive', 'Pending', 'Suspended'));
