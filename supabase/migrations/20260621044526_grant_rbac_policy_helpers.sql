grant usage on schema private to authenticated;
grant execute on function private.has_permission(text,text) to authenticated;
grant execute on function private.branch_in_scope(uuid) to authenticated;
grant execute on function private.subscriber_in_scope(uuid) to authenticated;;
