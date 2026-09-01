-- NTG Project Hub v0.7.3
-- Makes approved change-order corrections robust for older records where approved_at exists.
create or replace function public.correct_approved_change_order(
  p_change_order_id uuid,
  p_new_amount numeric,
  p_revision_date date,
  p_title text,
  p_reason text,
  p_scope_revision text,
  p_schedule_impact text,
  p_payment_terms text,
  p_correction_note text
)
returns table (
  contract_id uuid,
  project_id uuid,
  old_amount numeric,
  new_amount numeric,
  current_contract_price numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co public.change_orders%rowtype;
  v_current numeric(12,2);
  v_delta numeric(12,2);
  v_new_current numeric(12,2);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_co from public.change_orders where id = p_change_order_id for update;
  if not found then raise exception 'Change order not found'; end if;
  if v_co.status = 'void' then raise exception 'A void change order cannot be corrected'; end if;
  if v_co.status <> 'approved' and v_co.approved_at is null then
    raise exception 'Only an approved change order can use the correction workflow';
  end if;
  if p_correction_note is null or btrim(p_correction_note) = '' then raise exception 'A correction note is required'; end if;

  select c.contract_price into v_current from public.contracts c where c.id = v_co.contract_id for update;
  if v_current is null then raise exception 'Linked contract not found'; end if;

  v_delta := coalesce(p_new_amount, 0) - coalesce(v_co.amount, 0);
  v_new_current := v_current + v_delta;

  update public.contracts set contract_price = v_new_current where id = v_co.contract_id;
  update public.projects set contract_amount = v_new_current where id = v_co.project_id;

  update public.change_orders
  set status = 'approved',
      approved_at = coalesce(approved_at, now()),
      revision_date = coalesce(p_revision_date, revision_date),
      title = coalesce(nullif(btrim(p_title), ''), title),
      reason = p_reason,
      scope_revision = p_scope_revision,
      schedule_impact = p_schedule_impact,
      payment_terms = p_payment_terms,
      amount = coalesce(p_new_amount, 0),
      revised_contract_price = original_contract_price + coalesce(p_new_amount, 0),
      correction_note = p_correction_note,
      corrected_at = now()
  where id = p_change_order_id;

  return query select v_co.contract_id, v_co.project_id, v_co.amount, coalesce(p_new_amount, 0), v_new_current;
end;
$$;

grant execute on function public.correct_approved_change_order(uuid,numeric,date,text,text,text,text,text,text) to authenticated;
