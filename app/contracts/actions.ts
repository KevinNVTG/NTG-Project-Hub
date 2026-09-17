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

function customerName(c: any) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Client'
}

export async function convertEstimateToContract(estimateId: string) {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase.from('contracts').select('id').eq('source_estimate_id', estimateId).maybeSingle()
  if (existing?.id) redirect(`/contracts/${existing.id}`)

  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*, projects(id,project_name,project_address,project_type), customers(id,first_name,last_name,company_name,billing_address), estimate_items(category,description,quantity,unit,unit_price,taxable,sort_order)')
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
  const contractType = project?.project_type === 'commercial' ? 'commercial' : 'residential'

  const { data: contract, error: insertError } = await supabase.from('contracts').insert({
    project_id: estimate.project_id,
    customer_id: estimate.customer_id,
    source_estimate_id: estimate.id,
    contract_type: contractType,
    client_name: customerName(customer),
    client_address: customer?.billing_address || '',
    project_address: project?.project_address || '',
    scope,
    contractor_expenses: '',
    commercial_payment_terms: contractType === 'commercial' ? 'Progress billing in accordance with the agreed schedule of values and project requirements. Payment timing and retainage, if any, are subject to the executed agreement.' : null,
    exclusions_clarifications: contractType === 'commercial' ? (estimate.exclusions || '') : null,
    effective_date: ntgToday(),
    contract_price: total,
    original_contract_price: total,
    created_by: user.id,
  }).select('id').single()
  if (insertError || !contract) throw new Error(insertError?.message || 'Could not create contract')

  const milestones = [
    ['25% due upon project mobilization', 25],
    ['25% due upon completion of 50% of the scope of work', 25],
    ['Remaining balance due upon completion of the scope of work', 50],
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
    details: `Converted ${estimate.estimate_number} to ${contractType} construction contract`,
  })
  revalidatePath('/contracts')
  revalidatePath(`/projects/${estimate.project_id}`)
  redirect(`/contracts/${contract.id}`)
}

export async function updateContract(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const dueType = text(formData, 'due_date_type') || 'no_fixed'
  const contractType = text(formData, 'contract_type') === 'commercial' ? 'commercial' : 'residential'
  const { error } = await supabase.from('contracts').update({
    contract_type: contractType,
    pricing_basis: text(formData, 'pricing_basis') || 'lump_sum',
    status: text(formData, 'status') || 'prepared',
    effective_date: text(formData, 'effective_date') || ntgToday(),
    client_name: text(formData, 'client_name'),
    client_address: text(formData, 'client_address'),
    project_address: text(formData, 'project_address'),
    scope: text(formData, 'scope'),
    contractor_expenses: text(formData, 'contractor_expenses'),
    commercial_payment_terms: text(formData, 'commercial_payment_terms'),
    exclusions_clarifications: text(formData, 'exclusions_clarifications'),
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

export async function resetContractEffectiveDateToToday(id: string) {
  const { supabase } = await requireUser()
  const today = ntgToday()
  const { error } = await supabase.from('contracts').update({ effective_date: today }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/contracts/${id}`)
  revalidatePath(`/contracts/${id}/print`)
  revalidatePath('/contracts')
}

type PaymentSchedulePreset = 'standard_25_25_50' | 'deposit_50_50' | 'progress_30_30_40' | 'four_step_25_each'

const PAYMENT_SCHEDULE_PRESETS: Record<PaymentSchedulePreset, Array<{ description: string; percentage: number }>> = {
  standard_25_25_50: [
    { description: '25% due upon project mobilization', percentage: 25 },
    { description: '25% due upon completion of 50% of the scope of work', percentage: 25 },
    { description: 'Remaining balance due upon completion of the scope of work', percentage: 50 },
  ],
  deposit_50_50: [
    { description: '50% due upon project mobilization', percentage: 50 },
    { description: 'Remaining balance due upon completion of the scope of work', percentage: 50 },
  ],
  progress_30_30_40: [
    { description: '30% due upon project mobilization', percentage: 30 },
    { description: '30% due upon completion of 50% of the scope of work', percentage: 30 },
    { description: 'Remaining balance due upon completion of the scope of work', percentage: 40 },
  ],
  four_step_25_each: [
    { description: '25% due upon project mobilization', percentage: 25 },
    { description: '25% due upon completion of 25% of the scope of work', percentage: 25 },
    { description: '25% due upon completion of 75% of the scope of work', percentage: 25 },
    { description: 'Remaining balance due upon completion of the scope of work', percentage: 25 },
  ],
}

export async function applyPaymentSchedulePreset(contractId: string, preset: PaymentSchedulePreset) {
  const { supabase, user } = await requireUser()
  const schedule = PAYMENT_SCHEDULE_PRESETS[preset]
  if (!schedule) throw new Error('Unknown payment schedule preset.')

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('project_id,contract_price,contract_number')
    .eq('id', contractId)
    .single()
  if (contractError || !contract) throw new Error(contractError?.message || 'Contract not found.')

  const total = Number(contract.contract_price || 0)
  const { error: deleteError } = await supabase.from('contract_payment_milestones').delete().eq('contract_id', contractId)
  if (deleteError) throw new Error(deleteError.message)

  const rows = schedule.map((item, index) => ({
    contract_id: contractId,
    sort_order: index,
    description: item.description,
    percentage: item.percentage,
    amount: Math.round(total * item.percentage) / 100,
  }))
  const { error: insertError } = await supabase.from('contract_payment_milestones').insert(rows)
  if (insertError) throw new Error(insertError.message)

  if (contract.project_id) {
    await supabase.from('activity_logs').insert({
      project_id: contract.project_id,
      user_id: user.id,
      action: 'Contract payment schedule preset applied',
      details: { contract_number: contract.contract_number, preset },
    })
  }

  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/print`)
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
