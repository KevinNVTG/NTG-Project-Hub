'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { ntgToday } from '@/lib/ntg-date'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function number(formData: FormData, key: string) {
  const value = Number(text(formData, key) || 0)
  return Number.isFinite(value) ? value : 0
}

export async function createChangeOrder(contractId: string) {
  const { supabase, user } = await requireUser()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id,project_id,customer_id,contract_price,contract_number,projects(project_name)')
    .eq('id', contractId)
    .maybeSingle()
  if (error || !contract) throw new Error(error?.message || 'Contract not found')

  const currentPrice = Number(contract.contract_price || 0)
  const { data: changeOrder, error: insertError } = await supabase.from('change_orders').insert({
    contract_id: contract.id,
    project_id: contract.project_id,
    customer_id: contract.customer_id,
    title: 'Contract Revision / Change Order',
    revision_date: ntgToday(),
    reason: '',
    scope_revision: '',
    schedule_impact: 'No schedule change unless noted above.',
    payment_terms: 'The change order amount will be billed according to the payment terms stated in this revision.',
    amount: 0,
    original_contract_price: currentPrice,
    revised_contract_price: currentPrice,
    created_by: user.id,
  }).select('id,change_order_number').single()
  if (insertError || !changeOrder) throw new Error(insertError?.message || 'Could not create change order')

  await supabase.from('activity_logs').insert({
    project_id: contract.project_id,
    user_id: user.id,
    action: 'Change order created',
    details: `${changeOrder.change_order_number} created for ${contract.contract_number}`,
  })
  revalidatePath('/change-orders')
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/projects/${contract.project_id}`)
  redirect(`/change-orders/${changeOrder.id}`)
}

export async function createChangeOrderFromForm(formData: FormData) {
  const contractId = text(formData, 'contract_id')
  if (!contractId) throw new Error('Select a contract')
  return createChangeOrder(contractId)
}

export async function updateChangeOrder(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { data: existing, error: lookupError } = await supabase.from('change_orders').select('id,status,original_contract_price,contract_id,project_id').eq('id', id).maybeSingle()
  if (lookupError || !existing) throw new Error(lookupError?.message || 'Change order not found')
  if (existing.status === 'approved') throw new Error('Approved change orders are locked. Create a new change order for further revisions.')

  const amount = number(formData, 'amount')
  const original = Number(existing.original_contract_price || 0)
  const status = text(formData, 'status') || 'draft'
  if (status === 'approved') throw new Error('Use the Approve Change Order button so contract totals update correctly.')

  const { error } = await supabase.from('change_orders').update({
    status,
    revision_date: text(formData, 'revision_date') || ntgToday(),
    title: text(formData, 'title') || 'Contract Revision / Change Order',
    reason: text(formData, 'reason'),
    scope_revision: text(formData, 'scope_revision'),
    schedule_impact: text(formData, 'schedule_impact'),
    payment_terms: text(formData, 'payment_terms'),
    amount,
    revised_contract_price: original + amount,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/change-orders/${id}`)
  revalidatePath(`/change-orders/${id}/print`)
  revalidatePath('/change-orders')
  revalidatePath(`/contracts/${existing.contract_id}`)
  revalidatePath(`/projects/${existing.project_id}`)
}

export async function approveChangeOrder(id: string) {
  const { supabase, user } = await requireUser()
  const { data: co, error } = await supabase.from('change_orders').select('*,contracts(id,contract_number,contract_price),projects(id)').eq('id', id).maybeSingle()
  if (error || !co) throw new Error(error?.message || 'Change order not found')
  if (co.status === 'approved') return
  if (co.status === 'void' || co.status === 'rejected') throw new Error('A rejected or void change order cannot be approved.')

  const contract = Array.isArray(co.contracts) ? co.contracts[0] : co.contracts
  if (!contract) throw new Error('Linked contract not found')
  const currentContractPrice = Number(contract.contract_price || 0)
  const amount = Number(co.amount || 0)
  const revised = currentContractPrice + amount

  const { error: coError } = await supabase.from('change_orders').update({
    status: 'approved',
    original_contract_price: currentContractPrice,
    revised_contract_price: revised,
    approved_at: new Date().toISOString(),
  }).eq('id', id)
  if (coError) throw new Error(coError.message)

  const { error: contractError } = await supabase.from('contracts').update({ contract_price: revised }).eq('id', co.contract_id)
  if (contractError) throw new Error(contractError.message)

  const { error: projectError } = await supabase.from('projects').update({ contract_amount: revised }).eq('id', co.project_id)
  if (projectError) throw new Error(projectError.message)

  await supabase.from('activity_logs').insert({
    project_id: co.project_id,
    user_id: user.id,
    action: 'Change order approved',
    details: `${co.change_order_number} approved for ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}; revised contract value ${revised.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
  })
  revalidatePath(`/change-orders/${id}`)
  revalidatePath(`/change-orders/${id}/print`)
  revalidatePath('/change-orders')
  revalidatePath(`/contracts/${co.contract_id}`)
  revalidatePath(`/projects/${co.project_id}`)
  revalidatePath('/dashboard')
}

export async function correctApprovedChangeOrder(id: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const correctionNote = text(formData, 'correction_note')
  if (!correctionNote) throw new Error('Enter a correction note explaining what was changed.')

  const { data, error } = await supabase.rpc('correct_approved_change_order', {
    p_change_order_id: id,
    p_new_amount: number(formData, 'amount'),
    p_revision_date: text(formData, 'revision_date') || null,
    p_title: text(formData, 'title') || 'Contract Revision / Change Order',
    p_reason: text(formData, 'reason'),
    p_scope_revision: text(formData, 'scope_revision'),
    p_schedule_impact: text(formData, 'schedule_impact'),
    p_payment_terms: text(formData, 'payment_terms'),
    p_correction_note: correctionNote,
  })
  if (error) throw new Error(error.message)

  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('Correction did not return an updated contract value.')

  const delta = Number(result.new_amount || 0) - Number(result.old_amount || 0)
  await supabase.from('activity_logs').insert({
    project_id: result.project_id,
    user_id: user.id,
    action: 'Approved change order corrected',
    details: `${id}: amount corrected from ${Number(result.old_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to ${Number(result.new_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (${delta >= 0 ? '+' : ''}${delta.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}). Note: ${correctionNote}`,
  })

  revalidatePath(`/change-orders/${id}`)
  revalidatePath(`/change-orders/${id}/print`)
  revalidatePath('/change-orders')
  revalidatePath(`/contracts/${result.contract_id}`)
  revalidatePath(`/projects/${result.project_id}`)
  revalidatePath('/dashboard')
}

export async function voidChangeOrder(id: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const voidReason = text(formData, 'void_reason')
  if (!voidReason) throw new Error('Enter a reason before voiding this change order.')

  const { data, error } = await supabase.rpc('void_change_order', {
    p_change_order_id: id,
    p_void_reason: voidReason,
  })
  if (error) throw new Error(error.message)

  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('Void action did not return an updated contract value.')

  await supabase.from('activity_logs').insert({
    project_id: result.project_id,
    user_id: user.id,
    action: 'Change order voided',
    details: `${id} voided. Financial effect removed: ${Number(result.removed_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. Reason: ${voidReason}`,
  })

  revalidatePath(`/change-orders/${id}`)
  revalidatePath(`/change-orders/${id}/print`)
  revalidatePath('/change-orders')
  revalidatePath(`/contracts/${result.contract_id}`)
  revalidatePath(`/projects/${result.project_id}`)
  revalidatePath('/dashboard')
}

async function requireEditableChangeOrder(id: string) {
  const { supabase, user } = await requireUser()
  const { data: co, error } = await supabase
    .from('change_orders')
    .select('id,status,approved_at,voided_at,contract_id,project_id,original_contract_price')
    .eq('id', id)
    .maybeSingle()
  if (error || !co) throw new Error(error?.message || 'Change order not found')
  if (co.status === 'approved' || co.approved_at) throw new Error('Approved change-order line items are locked. Use the approved correction workflow for the total or create a new change order for new work.')
  if (co.status === 'void' || co.voided_at) throw new Error('Voided change orders cannot be edited.')
  return { supabase, user, co }
}

export async function addChangeOrderItem(changeOrderId: string, formData: FormData) {
  const { supabase, user, co } = await requireEditableChangeOrder(changeOrderId)
  const description = text(formData, 'description')
  if (!description) throw new Error('Enter a line-item description.')
  const quantity = Math.max(number(formData, 'quantity'), 0)
  const unitPrice = number(formData, 'unit_price')
  const lineTotal = quantity * unitPrice

  const { data: maxRow } = await supabase
    .from('change_order_items')
    .select('sort_order')
    .eq('change_order_id', changeOrderId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('change_order_items').insert({
    change_order_id: changeOrderId,
    category: text(formData, 'category') || 'labor',
    description,
    quantity,
    unit: text(formData, 'unit') || 'LS',
    unit_price: unitPrice,
    line_total: lineTotal,
    sort_order: Number(maxRow?.sort_order || 0) + 10,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)

  await supabase.from('activity_logs').insert({
    project_id: co.project_id,
    user_id: user.id,
    action: 'Change order line item added',
    details: `${description} · ${lineTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
  })
  revalidatePath(`/change-orders/${changeOrderId}`)
  revalidatePath(`/change-orders/${changeOrderId}/print`)
}

export async function updateChangeOrderItem(changeOrderId: string, itemId: string, formData: FormData) {
  const { supabase } = await requireEditableChangeOrder(changeOrderId)
  const description = text(formData, 'description')
  if (!description) throw new Error('Enter a line-item description.')
  const quantity = Math.max(number(formData, 'quantity'), 0)
  const unitPrice = number(formData, 'unit_price')
  const { error } = await supabase.from('change_order_items').update({
    category: text(formData, 'category') || 'labor',
    description,
    quantity,
    unit: text(formData, 'unit') || 'LS',
    unit_price: unitPrice,
    line_total: quantity * unitPrice,
  }).eq('id', itemId).eq('change_order_id', changeOrderId)
  if (error) throw new Error(error.message)
  revalidatePath(`/change-orders/${changeOrderId}`)
  revalidatePath(`/change-orders/${changeOrderId}/print`)
}

export async function deleteChangeOrderItem(changeOrderId: string, itemId: string) {
  const { supabase } = await requireEditableChangeOrder(changeOrderId)
  const { error } = await supabase.from('change_order_items').delete().eq('id', itemId).eq('change_order_id', changeOrderId)
  if (error) throw new Error(error.message)
  revalidatePath(`/change-orders/${changeOrderId}`)
  revalidatePath(`/change-orders/${changeOrderId}/print`)
}

export async function syncChangeOrderAmountFromItems(changeOrderId: string) {
  const { supabase, user, co } = await requireEditableChangeOrder(changeOrderId)
  const { data: items, error } = await supabase.from('change_order_items').select('line_total').eq('change_order_id', changeOrderId)
  if (error) throw new Error(error.message)
  if (!items?.length) throw new Error('Add at least one line item before using the item total.')
  const total = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0)
  const original = Number(co.original_contract_price || 0)
  const { error: updateError } = await supabase.from('change_orders').update({ amount: total, revised_contract_price: original + total }).eq('id', changeOrderId)
  if (updateError) throw new Error(updateError.message)
  await supabase.from('activity_logs').insert({
    project_id: co.project_id,
    user_id: user.id,
    action: 'Change order amount updated from line items',
    details: `Change order amount set to ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
  })
  revalidatePath(`/change-orders/${changeOrderId}`)
  revalidatePath(`/change-orders/${changeOrderId}/print`)
  revalidatePath(`/contracts/${co.contract_id}`)
  revalidatePath(`/projects/${co.project_id}`)
}
