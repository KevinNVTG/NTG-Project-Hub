'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) { return String(formData.get(key) || '').trim() }
function num(formData: FormData, key: string) { const n = Number(formData.get(key) || 0); return Number.isFinite(n) ? n : 0 }

export async function createPurchaseOrder(formData: FormData) {
  const { supabase, user } = await requireUser()
  const projectId = text(formData, 'project_id')
  if (!projectId) throw new Error('Project is required.')
  const { data: project, error: projectError } = await supabase.from('projects').select('id,project_address,project_number').eq('id', projectId).single()
  if (projectError) throw new Error(projectError.message)
  const { data, error } = await supabase.from('purchase_orders').insert({
    project_id: projectId,
    vendor_id: text(formData, 'vendor_id') || null,
    status: 'draft',
    order_date: text(formData, 'order_date') || new Date().toISOString().slice(0,10),
    requested_delivery_date: text(formData, 'requested_delivery_date') || null,
    vendor_quote_number: text(formData, 'vendor_quote_number'),
    requested_by: text(formData, 'requested_by') || user.email || '',
    approved_by: text(formData, 'approved_by'),
    ship_to_address: text(formData, 'ship_to_address') || project.project_address || '',
    notes: text(formData, 'notes'),
    shipping: num(formData, 'shipping'),
    sales_tax_rate: num(formData, 'sales_tax_rate'),
    created_by: user.id,
  }).select('id,po_number').single()
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: projectId, user_id: user.id, action: 'Purchase order created', details: { po_number: data.po_number } })
  revalidatePath('/purchase-orders'); revalidatePath('/dashboard'); revalidatePath(`/projects/${projectId}`)
  redirect(`/purchase-orders/${data.id}`)
}

export async function updatePurchaseOrder(id: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const { data: po, error: fetchError } = await supabase.from('purchase_orders').select('project_id,po_number').eq('id', id).single()
  if (fetchError) throw new Error(fetchError.message)
  const { error } = await supabase.from('purchase_orders').update({
    vendor_id: text(formData, 'vendor_id') || null,
    status: text(formData, 'status') || 'draft',
    order_date: text(formData, 'order_date'),
    requested_delivery_date: text(formData, 'requested_delivery_date') || null,
    vendor_quote_number: text(formData, 'vendor_quote_number'),
    requested_by: text(formData, 'requested_by'),
    approved_by: text(formData, 'approved_by'),
    ship_to_address: text(formData, 'ship_to_address'),
    notes: text(formData, 'notes'),
    shipping: num(formData, 'shipping'),
    sales_tax_rate: num(formData, 'sales_tax_rate'),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: po.project_id, user_id: user.id, action: 'Purchase order updated', details: { po_number: po.po_number, status: text(formData, 'status') } })
  revalidatePath(`/purchase-orders/${id}`); revalidatePath('/purchase-orders'); revalidatePath('/dashboard'); revalidatePath(`/projects/${po.project_id}`)
}

export async function addPurchaseOrderItem(id: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const description = text(formData, 'description')
  if (!description) throw new Error('Description is required.')
  const { data: po, error: fetchError } = await supabase.from('purchase_orders').select('project_id,po_number').eq('id', id).single()
  if (fetchError) throw new Error(fetchError.message)
  const { count } = await supabase.from('purchase_order_items').select('*', { count: 'exact', head: true }).eq('purchase_order_id', id)
  const { error } = await supabase.from('purchase_order_items').insert({
    purchase_order_id: id,
    sort_order: count || 0,
    description,
    quantity: num(formData, 'quantity') || 1,
    unit: text(formData, 'unit') || 'EA',
    unit_cost: num(formData, 'unit_cost'),
    taxable: formData.get('taxable') === 'on',
    received_quantity: num(formData, 'received_quantity'),
  })
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: po.project_id, user_id: user.id, action: 'PO item added', details: { po_number: po.po_number, description } })
  revalidatePath(`/purchase-orders/${id}`); revalidatePath('/purchase-orders'); revalidatePath('/dashboard'); revalidatePath(`/projects/${po.project_id}`)
}

export async function updatePurchaseOrderItem(id: string, itemId: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { data: po } = await supabase.from('purchase_orders').select('project_id').eq('id', id).single()
  const { error } = await supabase.from('purchase_order_items').update({
    description: text(formData, 'description'), quantity: num(formData, 'quantity'), unit: text(formData, 'unit') || 'EA',
    unit_cost: num(formData, 'unit_cost'), taxable: formData.get('taxable') === 'on', received_quantity: num(formData, 'received_quantity'),
  }).eq('id', itemId).eq('purchase_order_id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/purchase-orders/${id}`); if (po?.project_id) revalidatePath(`/projects/${po.project_id}`); revalidatePath('/dashboard')
}

export async function deletePurchaseOrderItem(id: string, itemId: string) {
  const { supabase } = await requireUser()
  const { data: po } = await supabase.from('purchase_orders').select('project_id').eq('id', id).single()
  const { error } = await supabase.from('purchase_order_items').delete().eq('id', itemId).eq('purchase_order_id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/purchase-orders/${id}`); if (po?.project_id) revalidatePath(`/projects/${po.project_id}`); revalidatePath('/dashboard')
}
