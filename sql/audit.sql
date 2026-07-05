-- ========================================================
-- NIGAZHTHISAI DB AUDIT TRIGGERS AND FUNCTIONS
-- ========================================================

-- Trigger function to log table mutations to audit_logs
create or replace function public.process_audit_log()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user uuid;
begin
  -- Try to extract user ID from auth session
  begin
    v_user := auth.uid();
  exception when others then
    v_user := null;
  end;

  if (TG_OP = 'INSERT') then
    insert into public.audit_logs (user_uuid, action, table_name, record_id, new_value)
    values (v_user, 'INSERT', TG_TABLE_NAME, row_to_json(NEW)::text, row_to_json(NEW)::jsonb);
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_logs (user_uuid, action, table_name, record_id, old_value, new_value)
    values (v_user, 'UPDATE', TG_TABLE_NAME, row_to_json(NEW)::text, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    return NEW;
  elsif (TG_OP = 'DELETE') then
    insert into public.audit_logs (user_uuid, action, table_name, record_id, old_value)
    values (v_user, 'DELETE', TG_TABLE_NAME, row_to_json(OLD)::text, row_to_json(OLD)::jsonb);
    return OLD;
  end if;
  return null;
end;
$$;

-- Create audits on tickets and wallet transactions
drop trigger if exists audit_tickets_trigger on public.tickets;
create trigger audit_tickets_trigger
after insert or update or delete on public.tickets
for each row execute function public.process_audit_log();

