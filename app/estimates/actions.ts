'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function money(formData: FormData, key: string) {
  const value = Number(formData.get(key) || 0)
  return Number.isFinite(value) ? value : 0
}

export async function createEstimate(formData: FormData) {
  const { supabase, user } = await requireUser()
  const projectId = text(formData, 'project_id')
  if (!projectId) throw new Error('Project is required.')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id,customer_id')
    .eq('id', projectId)
    .single()
  if (projectError) throw new Error(projectError.message)

  const { data, error } = await supabase.from('estimates').insert({
    project_id: projectId,
    customer_id: project.customer_id,
    estimate_date: text(formData, 'estimate_date') || new Date().toISOString().slice(0, 10),
    valid_until: text(formData, 'valid_until') || null,
    scope: text(formData, 'scope'),
    payment_terms: text(formData, 'payment_terms'),
    exclusions: text(formData, 'exclusions'),
    notes: text(formData, 'notes'),
    sales_tax_rate: money(formData, 'sales_tax_rate'),
    created_by: user.id,
  }).select('id,estimate_number').single()

  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({
    project_id: projectId,
    user_id: user.id,
    action: 'Estimate created',
    details: { estimate_number: data.estimate_number },
  })
  revalidatePath('/estimates')
  revalidatePath('/dashboard')
  revalidatePath(`/projects/${projectId}`)
  redirect(`/estimates/${data.id}`)
}

export async function updateEstimate(estimateId: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const { data: estimate, error: fetchError } = await supabase.from('estimates').select('project_id,estimate_number').eq('id', estimateId).single()
  if (fetchError) throw new Error(fetchError.message)

  const { error } = await supabase.from('estimates').update({
    status: text(formData, 'status') || 'draft',
    estimate_date: text(formData, 'estimate_date'),
    valid_until: text(formData, 'valid_until') || null,
    scope: text(formData, 'scope'),
    payment_terms: text(formData, 'payment_terms'),
    exclusions: text(formData, 'exclusions'),
    notes: text(formData, 'notes'),
    sales_tax_rate: money(formData, 'sales_tax_rate'),
  }).eq('id', estimateId)
  if (error) throw new Error(error.message)

  await supabase.from('activity_logs').insert({ project_id: estimate.project_id, user_id: user.id, action: 'Estimate updated', details: { estimate_number: estimate.estimate_number } })
  revalidatePath(`/estimates/${estimateId}`)
  revalidatePath('/estimates')
  revalidatePath('/dashboard')
  revalidatePath(`/projects/${estimate.project_id}`)
}

export async function addEstimateItem(estimateId: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const description = text(formData, 'description')
  if (!description) throw new Error('Description is required.')
  const { data: estimate, error: estimateError } = await supabase.from('estimates').select('project_id,estimate_number').eq('id', estimateId).single()
  if (estimateError) throw new Error(estimateError.message)

  const { count } = await supabase.from('estimate_items').select('*', { count: 'exact', head: true }).eq('estimate_id', estimateId)
  const { error } = await supabase.from('estimate_items').insert({
    estimate_id: estimateId,
    sort_order: count || 0,
    category: text(formData, 'category') || 'labor',
    description,
    quantity: money(formData, 'quantity') || 1,
    unit: text(formData, 'unit') || 'LS',
    unit_price: money(formData, 'unit_price'),
    taxable: formData.get('taxable') === 'on',
  })
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: estimate.project_id, user_id: user.id, action: 'Estimate item added', details: { estimate_number: estimate.estimate_number, description } })
  revalidatePath(`/estimates/${estimateId}`)
  revalidatePath('/dashboard')
}

export async function deleteEstimateItem(estimateId: string, itemId: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('estimate_items').delete().eq('id', itemId).eq('estimate_id', estimateId)
  if (error) throw new Error(error.message)
  revalidatePath(`/estimates/${estimateId}`)
  revalidatePath('/dashboard')
}
