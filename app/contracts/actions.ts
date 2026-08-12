'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function number(formData: FormData, key: string) {
  const value = Number(text(formData, key) || 0)
  return Number.isFinite(value) ? value : 0
}

function customerName(c: any) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Client'
}

export async function convertEstimateToContract(estimateId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase.from('contracts').select('id').eq('source_estimate_id', estimateId).maybeSingle()
  if (existing?.id) redirect(`/contracts/${existing.id}`)

  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*, projects(id,project_name,project_address), customers(id,first_name,last_name,company_name,billing_address), estimate_items(category,description,quantity,unit,unit_price,taxable,sort_order)')
    .eq('id', estimateId)
    .maybeSingle()

  if (error || !estimate) throw new Error(error?.message || 'Estimate not found')
  const project = Array.isArray(estimate.projects) ? estimate.projects[0] : estimate.projects
  const customer = Array.isArray(estimate.customers) ? estimate.customers[0] : estimate.customers
  const items = [...(estimate.estimate_items || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
  const taxable = items.filter((item: any) => item.taxable).reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
  const total = subtotal + taxable * (Number(estimate.sales_tax_rate || 0) / 100)
  const scope = estimate.scope?.trim() || items.map((item: any) => `• ${item.description}`).join('\n')

  const { data: contract, error: insertError } = await supabase.from('contracts').insert({
    project_id: estimate.project_id,
    customer_id: estimate.customer_id,
    source_estimate_id: estimate.id,
    client_name: customerName(customer),
    client_address: customer?.billing_address || '',
    project_address: project?.project_address || '',
    scope,
    contractor_expenses: '',
    contract_price: total,
    created_by: user.id,
  }).select('id').single()
  if (insertError || !contract) throw new Error(insertError?.message || 'Could not create contract')

  const milestones = [
    ['Upon contract signing / project mobilization', 25],
    ['Upon first major project milestone', 25],
    ['Upon second major project milestone', 25],
    ['Upon completion of all Services', 25],
  ].map(([description, percentage], index) => ({
    contract_id: contract.id,
    sort_order: index,
    description,
    percentage,
    amount: Math.round(total * Number(percentage) / 100 * 100) / 100,
  }))
  const { error: milestoneError } = await supabase.from('contract_payment_milestones').insert(milestones)
  if (milestoneError) throw new Error(milestoneError.message)

  await supabase.from('projects').update({ contract_amount: total, status: 'awarded' }).eq('id', estimate.project_id)
  await supabase.from('activity_logs').insert({
    project_id: estimate.project_id,
    user_id: user.id,
    action: 'Contract created',
    details: `Converted ${estimate.estimate_number} to residential construction contract`,
  })
  revalidatePath('/contracts')
  revalidatePath(`/projects/${estimate.project_id}`)
  redirect(`/contracts/${contract.id}`)
}

export async function updateContract(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const dueType = text(formData, 'due_date_type') || 'no_fixed'
  const { error } = await supabase.from('contracts').update({
    status: text(formData, 'status') || 'prepared',
    effective_date: text(formData, 'effective_date') || new Date().toISOString().slice(0, 10),
    client_name: text(formData, 'client_name'),
    client_address: text(formData, 'client_address'),
    project_address: text(formData, 'project_address'),
    scope: text(formData, 'scope'),
    contractor_expenses: text(formData, 'contractor_expenses'),
    contract_price: number(formData, 'contract_price'),
    due_date_type: dueType,
    due_date: dueType === 'fixed' && text(formData, 'due_date') ? text(formData, 'due_date') : null,
    due_date_notes: text(formData, 'due_date_notes'),
    additional_terms: text(formData, 'additional_terms'),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/contracts/${id}`)
  revalidatePath(`/contracts/${id}/print`)
  revalidatePath('/contracts')
}

export async function addPaymentMilestone(contractId: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { count } = await supabase.from('contract_payment_milestones').select('*', { count: 'exact', head: true }).eq('contract_id', contractId)
  const { error } = await supabase.from('contract_payment_milestones').insert({
    contract_id: contractId,
    sort_order: count || 0,
    description: text(formData, 'description'),
    percentage: text(formData, 'percentage') ? number(formData, 'percentage') : null,
    amount: number(formData, 'amount'),
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/print`)
}

export async function updatePaymentMilestone(contractId: string, milestoneId: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('contract_payment_milestones').update({
    description: text(formData, 'description'),
    percentage: text(formData, 'percentage') ? number(formData, 'percentage') : null,
    amount: number(formData, 'amount'),
  }).eq('id', milestoneId)
  if (error) throw new Error(error.message)
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/print`)
}

export async function deletePaymentMilestone(contractId: string, milestoneId: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('contract_payment_milestones').delete().eq('id', milestoneId)
  if (error) throw new Error(error.message)
  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/print`)
}
