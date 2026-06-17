drop policy if exists "Authenticated users can manage modems" on public.modems;

drop policy if exists "Authenticated users can view modems" on public.modems;
drop policy if exists "Authenticated users can create modems" on public.modems;
drop policy if exists "Authenticated users can update modems" on public.modems;
drop policy if exists "Authenticated users can delete modems" on public.modems;

create policy "Authenticated users can view modems"
  on public.modems
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create modems"
  on public.modems
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can update modems"
  on public.modems
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users can delete modems"
  on public.modems
  for delete
  to authenticated
  using ((select auth.uid()) is not null);
