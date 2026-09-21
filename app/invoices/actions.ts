'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { ntgToday } from '@/lib/ntg-date'

function text(fd: FormData, key: string) { const v = fd.get(key); return typeof v === 'string' ? v.trim() : '' }
function num(fd: FormData, key: string) { const n = Number(text(fd, key) || 0); return Number.isFinite(n) ? n : 0 }

async function refreshInvoiceStatus(supabase: any, invoiceId: string) {
  const { data: inv } = await supabase.from('invoices').select('status,due_date,invoice_items(quantity,unit_price),payments(amount)').eq('id', invoiceId).maybeSingle()
  if (!inv || inv.status === 'void' || inv.status === 'draft') return
  const total = (inv.invoice_items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0)
  const paid = (inv.payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  let status = paid >= total - .005 && total > 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'sent'
  if (paid <= 0 && inv.due_date && inv.due_date < ntgToday()) status = 'overdue'
  await supabase.from('invoices').update({ status }).eq('id', invoiceId)
}

export async function createInvoice(formData: FormData) {
  const { supabase, user } = await requireUser()
  const contractId = text(formData, 'contract_id')
  const type = text(formData, 'invoice_type') || 'custom'
  const sourceId = text(formData, 'source_id')
  const customAmount = num(formData, 'amount')
  const customDescription = text(formData, 'description')
  if (!contractId) throw new Error('Select a contract.')
  const { data: contract, error } = await supabase.from('contracts').select('id,project_id,customer_id,contract_number,contract_price,pricing_basis,client_name,client_address,project_address,contract_payment_milestones(id,description,amount),change_orders(id,change_order_number,title,amount,status)').eq('id', contractId).maybeSingle()
  if (error || !contract) throw new Error(error?.message || 'Contract not found.')

  let description = customDescription || 'Progress billing'
  let amount = customAmount
  let source_milestone_id: string | null = null
  let source_change_order_id: string | null = null
  if (type === 'milestone') {
    const m = (contract.contract_payment_milestones || []).find((x: any) => x.id === sourceId)
    if (!m) throw new Error('Payment milestone not found.')
    source_milestone_id = m.id; description = m.description; amount = Number(m.amount || 0)
  } else if (type === 'change_order') {
    const co = (contract.change_orders || []).find((x: any) => x.id === sourceId && x.status === 'approved')
    if (!co) throw new Error('Only approved change orders can be invoiced.')
    source_change_order_id = co.id; description = `${co.change_order_number} - ${co.title}`; amount = Number(co.amount || 0)
  } else if (type === 'final') {
    const { data: existing } = await supabase.from('invoices').select('id,status,invoice_items(quantity,unit_price)').eq('contract_id', contractId).neq('status', 'void')
    const alreadyInvoiced = (existing || []).reduce((s: number, inv: any) => s + (inv.invoice_items || []).reduce((x: number, i: any) => x + Number(i.quantity || 0) * Number(i.unit_price || 0), 0), 0)
    amount = Math.max(0, Number(contract.contract_price || 0) - alreadyInvoiced)
    description = customDescription || 'Final contract balance'
    if (amount <= .005) throw new Error('This contract has no remaining uninvoiced balance.')
  }
  if (type === 'time_and_materials' && contract.pricing_basis !== 'time_and_materials') throw new Error('T&M billing is only available for T&M contracts.')
  if (amount <= 0) throw new Error('Invoice amount must be greater than zero.')

  const { data: invoice, error: insertError } = await supabase.from('invoices').insert({
    project_id: contract.project_id, customer_id: contract.customer_id, contract_id: contract.id,
    source_milestone_id, source_change_order_id, invoice_type: type, invoice_date: ntgToday(),
    client_name: contract.client_name, client_address: contract.client_address, project_address: contract.project_address,
    created_by: user.id,
  }).select('id,invoice_number').single()
  if (insertError || !invoice) throw new Error(insertError?.message || 'Could not create invoice.')
  const { error: itemError } = await supabase.from('invoice_items').insert({ invoice_id: invoice.id, description, quantity: 1, unit: 'LS', unit_price: amount })
  if (itemError) throw new Error(itemError.message)
  await supabase.from('activity_logs').insert({ project_id: contract.project_id, user_id: user.id, action: 'Invoice created', details: `${invoice.invoice_number} created for ${contract.contract_number} - ${amount.toLocaleString('en-US',{style:'currency',currency:'USD'})}` })
  revalidatePath('/invoices'); revalidatePath(`/contracts/${contractId}`); revalidatePath(`/projects/${contract.project_id}`); revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoice(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { data: inv } = await supabase.from('invoices').select('project_id,contract_id,status').eq('id', id).maybeSingle()
  if (!inv) throw new Error('Invoice not found.')
  if (inv.status === 'paid' || inv.status === 'void') throw new Error('Paid or void invoices cannot be edited.')
  const { error } = await supabase.from('invoices').update({ status: text(formData,'status') || 'draft', invoice_date: text(formData,'invoice_date') || ntgToday(), due_date: text(formData,'due_date') || null, client_name: text(formData,'client_name'), client_address: text(formData,'client_address'), project_address: text(formData,'project_address'), notes: text(formData,'notes') }).eq('id',id)
  if (error) throw new Error(error.message)
  revalidatePath(`/invoices/${id}`); revalidatePath(`/invoices/${id}/print`); revalidatePath('/invoices'); revalidatePath(`/contracts/${inv.contract_id}`)
}

export async function addInvoiceItem(invoiceId: string, formData: FormData) {
  const { supabase } = await requireUser(); const { count } = await supabase.from('invoice_items').select('*',{count:'exact',head:true}).eq('invoice_id',invoiceId)
  const { error } = await supabase.from('invoice_items').insert({ invoice_id: invoiceId, sort_order: count || 0, description: text(formData,'description'), quantity: num(formData,'quantity') || 1, unit: text(formData,'unit') || 'LS', unit_price: num(formData,'unit_price') })
  if (error) throw new Error(error.message); revalidatePath(`/invoices/${invoiceId}`); revalidatePath(`/invoices/${invoiceId}/print`)
}
export async function updateInvoiceItem(invoiceId:string,itemId:string,formData:FormData){ const {supabase}=await requireUser(); const {error}=await supabase.from('invoice_items').update({description:text(formData,'description'),quantity:num(formData,'quantity'),unit:text(formData,'unit')||'LS',unit_price:num(formData,'unit_price')}).eq('id',itemId); if(error)throw new Error(error.message); revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`) }
export async function deleteInvoiceItem(invoiceId:string,itemId:string){ const {supabase}=await requireUser(); const {error}=await supabase.from('invoice_items').delete().eq('id',itemId);if(error)throw new Error(error.message);revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`) }

export async function recordPayment(invoiceId:string,formData:FormData){
  const {supabase,user}=await requireUser(); const amount=num(formData,'amount'); if(amount<=0)throw new Error('Payment amount must be greater than zero.')
  const {data:inv}=await supabase.from('invoices').select('project_id,contract_id,invoice_number,status,invoice_items(quantity,unit_price),payments(amount)').eq('id',invoiceId).maybeSingle(); if(!inv)throw new Error('Invoice not found.'); if(inv.status==='void')throw new Error('Cannot pay a void invoice.')
  const total=(inv.invoice_items||[]).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0); const paid=(inv.payments||[]).reduce((s:number,p:any)=>s+Number(p.amount||0),0); if(amount>total-paid+.005)throw new Error('Payment exceeds the remaining invoice balance.')
  const {error}=await supabase.from('payments').insert({invoice_id:invoiceId,project_id:inv.project_id,contract_id:inv.contract_id,payment_date:text(formData,'payment_date')||ntgToday(),amount,payment_method:text(formData,'payment_method')||'check',reference_number:text(formData,'reference_number'),notes:text(formData,'notes'),created_by:user.id});if(error)throw new Error(error.message)
  if(inv.status==='draft') await supabase.from('invoices').update({status:'sent'}).eq('id',invoiceId); await refreshInvoiceStatus(supabase,invoiceId)
  await supabase.from('activity_logs').insert({project_id:inv.project_id,user_id:user.id,action:'Payment recorded',details:`${amount.toLocaleString('en-US',{style:'currency',currency:'USD'})} received for ${inv.invoice_number}`})
  revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`);revalidatePath('/invoices');revalidatePath(`/contracts/${inv.contract_id}`);revalidatePath(`/projects/${inv.project_id}`);revalidatePath('/dashboard')
}
export async function voidInvoice(invoiceId:string){const {supabase}=await requireUser();const {data:inv}=await supabase.from('invoices').select('contract_id,project_id,payments(id)').eq('id',invoiceId).maybeSingle();if(!inv)throw new Error('Invoice not found.');if((inv.payments||[]).length)throw new Error('Remove or reverse payments before voiding an invoice.');const {error}=await supabase.from('invoices').update({status:'void'}).eq('id',invoiceId);if(error)throw new Error(error.message);revalidatePath(`/invoices/${invoiceId}`);revalidatePath('/invoices');revalidatePath(`/contracts/${inv.contract_id}`);revalidatePath('/dashboard')}
