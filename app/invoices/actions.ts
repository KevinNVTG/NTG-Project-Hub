'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { ntgToday } from '@/lib/ntg-date'

function text(fd: FormData, key: string) { const v = fd.get(key); return typeof v === 'string' ? v.trim() : '' }
function num(fd: FormData, key: string) { const n = Number(text(fd, key) || 0); return Number.isFinite(n) ? n : 0 }
function money(v:number){ return v.toLocaleString('en-US',{style:'currency',currency:'USD'}) }

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
    const directIds = new Set((existing || []).map((inv:any)=>inv.id))
    const directTotal = (existing || []).reduce((s: number, inv: any) => s + (inv.invoice_items || []).reduce((x: number, i: any) => x + Number(i.quantity || 0) * Number(i.unit_price || 0), 0), 0)
    let linkedTotal = 0
    const sourced = await supabase.from('invoice_items').select('invoice_id,quantity,unit_price').eq('source_contract_id', contractId)
    if (!sourced.error && sourced.data?.length) {
      const extraIds = [...new Set((sourced.data as any[]).map((row:any)=>row.invoice_id).filter((invoiceId:string)=>!directIds.has(invoiceId)))]
      if (extraIds.length) {
        const active = await supabase.from('invoices').select('id,status').in('id', extraIds).neq('status','void')
        const activeIds = new Set((active.data || []).map((inv:any)=>inv.id))
        linkedTotal = (sourced.data as any[]).filter((row:any)=>activeIds.has(row.invoice_id)).reduce((sum:number,row:any)=>sum+Number(row.quantity||0)*Number(row.unit_price||0),0)
      }
    }
    const alreadyInvoiced = directTotal + linkedTotal
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
  let itemResult = await supabase.from('invoice_items').insert({ invoice_id: invoice.id, description, quantity: 1, unit: 'LS', unit_price: amount, source_contract_id: contract.id, source_project_id: contract.project_id })
  if (itemResult.error && /source_contract_id|source_project_id/i.test(itemResult.error.message)) {
    itemResult = await supabase.from('invoice_items').insert({ invoice_id: invoice.id, description, quantity: 1, unit: 'LS', unit_price: amount })
  }
  if (itemResult.error) throw new Error(itemResult.error.message)
  await supabase.from('activity_logs').insert({ project_id: contract.project_id, user_id: user.id, action: 'Invoice created', details: `${invoice.invoice_number} created for ${contract.contract_number} - ${money(amount)}` })
  revalidatePath('/invoices'); revalidatePath(`/contracts/${contractId}`); revalidatePath(`/projects/${contract.project_id}`); revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}

export async function createConsolidatedInvoice(formData: FormData) {
  const { supabase, user } = await requireUser()
  const contractIds = formData.getAll('contract_ids').filter((x): x is string => typeof x === 'string' && !!x)
  if (contractIds.length < 2) throw new Error('Select at least two projects/contracts for a consolidated invoice.')

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id,project_id,customer_id,contract_number,contract_price,client_name,client_address,project_address,projects(project_number,project_name)')
    .in('id', contractIds)
  if (error || !contracts || contracts.length !== contractIds.length) throw new Error(error?.message || 'Could not load all selected contracts.')

  const customerIds = new Set(contracts.map((c:any)=>c.customer_id || `name:${c.client_name}`))
  if (customerIds.size > 1) throw new Error('All projects on a consolidated invoice must belong to the same customer.')

  const ordered = contractIds.map(id => contracts.find((c:any)=>c.id===id)).filter(Boolean) as any[]
  const primary = ordered[0]
  const invoiceRows:any[] = []
  let combined = 0

  for (const c of ordered) {
    const { data: existing } = await supabase.from('invoices').select('id,status,invoice_items(quantity,unit_price)').eq('contract_id', c.id).neq('status','void')
    const already = (existing || []).reduce((s:number,inv:any)=>s+(inv.invoice_items||[]).reduce((x:number,i:any)=>x+Number(i.quantity||0)*Number(i.unit_price||0),0),0)
    const remaining = Math.max(0, Number(c.contract_price || 0) - already)
    const p = Array.isArray(c.projects) ? c.projects[0] : c.projects
    if (remaining > .005) {
      invoiceRows.push({ description: `${p?.project_number || ''}${p?.project_number ? ' · ' : ''}${p?.project_name || 'Project'} — ${c.contract_number} remaining balance`, quantity:1, unit:'LS', unit_price:remaining })
      combined += remaining
    }
  }
  if (combined <= .005) throw new Error('The selected projects have no remaining uninvoiced contract balance.')

  const deduction = Math.max(0, num(formData,'trade_damage_amount'))
  const deductionNote = text(formData,'trade_damage_description') || 'Trade damage deduction'
  if (deduction > combined + .005) throw new Error('Trade damage deduction cannot exceed the combined invoice subtotal.')

  const { data: invoice, error: insertError } = await supabase.from('invoices').insert({
    project_id: primary.project_id,
    customer_id: primary.customer_id,
    contract_id: primary.id,
    invoice_type: 'consolidated',
    invoice_date: ntgToday(),
    client_name: primary.client_name,
    client_address: primary.client_address,
    project_address: ordered.map((c:any)=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;return `${p?.project_number || ''}${p?.project_number?' · ':''}${p?.project_name || ''}`}).join('\n'),
    notes: text(formData,'notes') || 'Consolidated billing for the projects/contracts listed on this invoice.',
    created_by: user.id,
  }).select('id,invoice_number').single()
  if (insertError || !invoice) throw new Error(insertError?.message || 'Could not create consolidated invoice.')

  const links = ordered.map((c:any,index:number)=>({invoice_id:invoice.id,contract_id:c.id,project_id:c.project_id,sort_order:index}))
  const { error: linkError } = await supabase.from('invoice_contract_links').insert(links)
  if (linkError) throw new Error(linkError.message)

  const items = invoiceRows.map((x,index)=>({invoice_id:invoice.id,sort_order:index,...x}))
  if (deduction > 0) items.push({invoice_id:invoice.id,sort_order:items.length,description:deductionNote,quantity:1,unit:'DEDUCT',unit_price:-deduction})
  const { error:itemError } = await supabase.from('invoice_items').insert(items)
  if (itemError) throw new Error(itemError.message)

  for (const c of ordered) {
    const p = Array.isArray(c.projects) ? c.projects[0] : c.projects
    await supabase.from('activity_logs').insert({project_id:c.project_id,user_id:user.id,action:'Consolidated invoice created',details:`${invoice.invoice_number} includes ${p?.project_name || c.contract_number}`})
    revalidatePath(`/projects/${c.project_id}`); revalidatePath(`/contracts/${c.id}`)
  }
  revalidatePath('/invoices'); revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}


export async function createProjectInvoice(formData: FormData) {
  const { supabase, user } = await requireUser()
  const contractIds = formData.getAll('contract_ids').filter((x): x is string => typeof x === 'string' && !!x)
  if (!contractIds.length) throw new Error('Select at least one contract to invoice.')

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id,project_id,customer_id,contract_number,contract_price,client_name,client_address,project_address,projects(id,project_number,project_name)')
    .in('id', contractIds)
  if (error || !contracts || contracts.length !== contractIds.length) throw new Error(error?.message || 'Could not load the selected contracts.')

  const customerIds = new Set(contracts.map((c:any)=>c.customer_id || `name:${c.client_name}`))
  if (customerIds.size > 1) throw new Error('All contracts on a project invoice must belong to the same customer.')

  const ordered = contractIds.map(id => contracts.find((c:any)=>c.id===id)).filter(Boolean) as any[]
  const primary = ordered[0]
  const invoiceRows:any[] = []
  const referenceLines:string[] = []
  let combined = 0

  for (const c of ordered) {
    const direct = await supabase.from('invoices').select('id,status,invoice_items(quantity,unit_price)').eq('contract_id', c.id).neq('status','void')
    let invoiceIds = new Set((direct.data || []).map((x:any)=>x.id))

    // Include prior multi-contract invoices when the optional link table is available.
    const linked = await supabase.from('invoice_contract_links').select('invoice_id').eq('contract_id', c.id)
    if (!linked.error && linked.data?.length) {
      for (const row of linked.data as any[]) invoiceIds.add(row.invoice_id)
    }

    let existing:any[] = direct.data || []
    const extraIds = [...invoiceIds].filter(id => !existing.some((x:any)=>x.id===id))
    if (extraIds.length) {
      const extra = await supabase.from('invoices').select('id,status,invoice_items(quantity,unit_price)').in('id', extraIds).neq('status','void')
      if (!extra.error && extra.data) existing = existing.concat(extra.data)
    }

    const already = existing.reduce((sum:number,inv:any)=>sum+(inv.invoice_items||[]).reduce((x:number,i:any)=>x+Number(i.quantity||0)*Number(i.unit_price||0),0),0)
    const remaining = Math.max(0, Math.round((Number(c.contract_price || 0) - already) * 100) / 100)
    const project = Array.isArray(c.projects) ? c.projects[0] : c.projects
    const ref = `${project?.project_number || ''}${project?.project_number ? ' · ' : ''}${project?.project_name || 'Project'} — ${c.contract_number}`
    referenceLines.push(ref)
    if (remaining > .005) {
      invoiceRows.push({ description: `${ref} — remaining contract balance`, quantity:1, unit:'LS', unit_price:remaining })
      combined += remaining
    }
  }

  if (combined <= .005) throw new Error('The selected contracts have no remaining uninvoiced balance.')

  const notes = text(formData,'notes') || `Project invoice referencing: ${referenceLines.join('; ')}`
  const { data: invoice, error: insertError } = await supabase.from('invoices').insert({
    project_id: primary.project_id,
    customer_id: primary.customer_id,
    contract_id: null,
    invoice_type: 'custom',
    invoice_date: ntgToday(),
    client_name: primary.client_name,
    client_address: primary.client_address,
    project_address: referenceLines.join(' | '),
    notes,
    created_by: user.id,
  }).select('id,invoice_number').single()
  if (insertError || !invoice) throw new Error(insertError?.message || 'Could not create project invoice.')

  const items = invoiceRows.map((row,index)=>({invoice_id:invoice.id,sort_order:index,...row,source_contract_id:ordered[index]?.id||null,source_project_id:ordered[index]?.project_id||null}))
  let itemInsert = await supabase.from('invoice_items').insert(items)
  if (itemInsert.error && /source_contract_id|source_project_id/i.test(itemInsert.error.message)) {
    itemInsert = await supabase.from('invoice_items').insert(invoiceRows.map((row,index)=>({invoice_id:invoice.id,sort_order:index,...row})))
  }
  if (itemInsert.error) throw new Error(itemInsert.error.message)

  // Link every referenced contract when that table is available. Do not fail invoice creation if an older deployment has not added it yet.
  const links = ordered.map((c:any,index:number)=>({invoice_id:invoice.id,contract_id:c.id,project_id:c.project_id,sort_order:index}))
  const linkResult = await supabase.from('invoice_contract_links').insert(links)
  if (linkResult.error) console.warn('invoice_contract_links unavailable:', linkResult.error.message)

  for (const c of ordered) {
    const project = Array.isArray(c.projects) ? c.projects[0] : c.projects
    await supabase.from('activity_logs').insert({project_id:c.project_id,user_id:user.id,action:'Project invoice created',details:`${invoice.invoice_number} references ${project?.project_name || c.contract_number}`})
    revalidatePath(`/projects/${c.project_id}`)
    revalidatePath(`/contracts/${c.id}`)
  }
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoice(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const { data: inv } = await supabase.from('invoices').select('project_id,contract_id,status').eq('id', id).maybeSingle()
  if (!inv) throw new Error('Invoice not found.')
  if (inv.status === 'paid' || inv.status === 'void') throw new Error('Paid or void invoices cannot be edited.')
  const { error } = await supabase.from('invoices').update({ status: text(formData,'status') || 'draft', invoice_date: text(formData,'invoice_date') || ntgToday(), due_date: text(formData,'due_date') || null, client_name: text(formData,'client_name'), client_address: text(formData,'client_address'), project_address: text(formData,'project_address'), notes: text(formData,'notes') }).eq('id',id)
  if (error) throw new Error(error.message)
  revalidatePath(`/invoices/${id}`); revalidatePath(`/invoices/${id}/print`); revalidatePath('/invoices'); if(inv.contract_id)revalidatePath(`/contracts/${inv.contract_id}`)
}

export async function addInvoiceItem(invoiceId: string, formData: FormData) {
  const { supabase } = await requireUser(); const { count } = await supabase.from('invoice_items').select('*',{count:'exact',head:true}).eq('invoice_id',invoiceId)
  const { error } = await supabase.from('invoice_items').insert({ invoice_id: invoiceId, sort_order: count || 0, description: text(formData,'description'), quantity: num(formData,'quantity') || 1, unit: text(formData,'unit') || 'LS', unit_price: num(formData,'unit_price') })
  if (error) throw new Error(error.message); revalidatePath(`/invoices/${invoiceId}`); revalidatePath(`/invoices/${invoiceId}/print`)
}

export async function addInvoiceDeduction(invoiceId:string, formData:FormData){
  const {supabase}=await requireUser(); const amount=Math.max(0,num(formData,'amount')); if(amount<=0)throw new Error('Deduction amount must be greater than zero.')
  const {data:inv}=await supabase.from('invoices').select('status,invoice_items(quantity,unit_price)').eq('id',invoiceId).maybeSingle(); if(!inv)throw new Error('Invoice not found.'); if(['paid','void'].includes(inv.status))throw new Error('Paid or void invoices cannot be edited.')
  const subtotal=(inv.invoice_items||[]).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0); if(amount>subtotal+.005)throw new Error('Deduction cannot exceed the current invoice subtotal.')
  const {count}=await supabase.from('invoice_items').select('*',{count:'exact',head:true}).eq('invoice_id',invoiceId)
  const description=text(formData,'description')||'Trade damage deduction'
  const {error}=await supabase.from('invoice_items').insert({invoice_id:invoiceId,sort_order:count||0,description,quantity:1,unit:'DEDUCT',unit_price:-amount}); if(error)throw new Error(error.message)
  revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`)
}

export async function updateInvoiceItem(invoiceId:string,itemId:string,formData:FormData){ const {supabase}=await requireUser(); const {error}=await supabase.from('invoice_items').update({description:text(formData,'description'),quantity:num(formData,'quantity'),unit:text(formData,'unit')||'LS',unit_price:num(formData,'unit_price')}).eq('id',itemId); if(error)throw new Error(error.message); revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`) }
export async function deleteInvoiceItem(invoiceId:string,itemId:string){ const {supabase}=await requireUser(); const {error}=await supabase.from('invoice_items').delete().eq('id',itemId);if(error)throw new Error(error.message);revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`) }

export async function recordPayment(invoiceId:string,formData:FormData){
  const {supabase,user}=await requireUser(); const amount=num(formData,'amount'); if(amount<=0)throw new Error('Payment amount must be greater than zero.')
  const {data:inv}=await supabase.from('invoices').select('project_id,contract_id,invoice_number,status,invoice_items(quantity,unit_price),payments(amount)').eq('id',invoiceId).maybeSingle(); if(!inv)throw new Error('Invoice not found.'); if(inv.status==='void')throw new Error('Cannot pay a void invoice.')
  const total=(inv.invoice_items||[]).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0); const paid=(inv.payments||[]).reduce((s:number,p:any)=>s+Number(p.amount||0),0); const remaining=Math.round((total-paid)*100)/100; if(amount>remaining+.005)throw new Error('Payment exceeds the remaining invoice balance.')
  const {error}=await supabase.from('payments').insert({invoice_id:invoiceId,project_id:inv.project_id,contract_id:inv.contract_id,payment_date:text(formData,'payment_date')||ntgToday(),amount,payment_method:text(formData,'payment_method')||'check',reference_number:text(formData,'reference_number'),notes:text(formData,'notes'),created_by:user.id});if(error)throw new Error(error.message)
  if(inv.status==='draft') await supabase.from('invoices').update({status:'sent'}).eq('id',invoiceId); await refreshInvoiceStatus(supabase,invoiceId)
  await supabase.from('activity_logs').insert({project_id:inv.project_id,user_id:user.id,action:'Payment recorded',details:`${money(amount)} received for ${inv.invoice_number}`})
  revalidatePath(`/invoices/${invoiceId}`);revalidatePath(`/invoices/${invoiceId}/print`);revalidatePath('/invoices');if(inv.contract_id)revalidatePath(`/contracts/${inv.contract_id}`);revalidatePath(`/projects/${inv.project_id}`);revalidatePath('/dashboard')
}


async function revalidatePaymentContext(supabase: any, invoiceId: string) {
  const { data: inv } = await supabase.from('invoices').select('project_id,contract_id').eq('id', invoiceId).maybeSingle()
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath(`/invoices/${invoiceId}/print`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  if (inv?.contract_id) revalidatePath(`/contracts/${inv.contract_id}`)
  if (inv?.project_id) revalidatePath(`/projects/${inv.project_id}`)
}

export async function updatePayment(invoiceId:string,paymentId:string,formData:FormData){
  const {supabase,user}=await requireUser()
  const amount=num(formData,'amount')
  if(amount<=0) throw new Error('Payment amount must be greater than zero.')

  const {data:payment,error:paymentError}=await supabase.from('payments').select('id,invoice_id,amount').eq('id',paymentId).eq('invoice_id',invoiceId).maybeSingle()
  if(paymentError||!payment) throw new Error(paymentError?.message||'Payment not found.')

  const {data:inv,error:invoiceError}=await supabase.from('invoices').select('id,invoice_number,project_id,contract_id,status,invoice_items(quantity,unit_price),payments(id,amount)').eq('id',invoiceId).maybeSingle()
  if(invoiceError||!inv) throw new Error(invoiceError?.message||'Invoice not found.')
  if(inv.status==='void') throw new Error('Payments on a void invoice cannot be edited.')

  const total=(inv.invoice_items||[]).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0)
  const otherPaid=(inv.payments||[]).filter((p:any)=>p.id!==paymentId).reduce((s:number,p:any)=>s+Number(p.amount||0),0)
  const available=Math.round((total-otherPaid)*100)/100
  if(amount>available+.005) throw new Error(`Payment exceeds the remaining invoice amount of ${money(available)}.`)

  const {error}=await supabase.from('payments').update({
    payment_date:text(formData,'payment_date')||ntgToday(),
    amount,
    payment_method:text(formData,'payment_method')||'check',
    reference_number:text(formData,'reference_number'),
    notes:text(formData,'notes')
  }).eq('id',paymentId).eq('invoice_id',invoiceId)
  if(error) throw new Error(error.message)

  await refreshInvoiceStatus(supabase,invoiceId)
  if(inv.project_id){
    await supabase.from('activity_logs').insert({project_id:inv.project_id,user_id:user.id,action:'Payment corrected',details:`Payment on ${inv.invoice_number} changed from ${money(Number(payment.amount||0))} to ${money(amount)}`})
  }
  await revalidatePaymentContext(supabase,invoiceId)
}

export async function deletePayment(invoiceId:string,paymentId:string){
  const {supabase,user}=await requireUser()
  const {data:inv,error:invoiceError}=await supabase.from('invoices').select('invoice_number,project_id,contract_id,status').eq('id',invoiceId).maybeSingle()
  if(invoiceError||!inv) throw new Error(invoiceError?.message||'Invoice not found.')
  if(inv.status==='void') throw new Error('Payments on a void invoice cannot be removed.')

  const {data:payment,error:paymentError}=await supabase.from('payments').select('id,amount,payment_date,payment_method,reference_number').eq('id',paymentId).eq('invoice_id',invoiceId).maybeSingle()
  if(paymentError||!payment) throw new Error(paymentError?.message||'Payment not found.')

  const {error}=await supabase.from('payments').delete().eq('id',paymentId).eq('invoice_id',invoiceId)
  if(error) throw new Error(error.message)

  await refreshInvoiceStatus(supabase,invoiceId)
  if(inv.project_id){
    await supabase.from('activity_logs').insert({project_id:inv.project_id,user_id:user.id,action:'Payment removed',details:`Removed ${money(Number(payment.amount||0))} payment from ${inv.invoice_number} dated ${payment.payment_date}`})
  }
  await revalidatePaymentContext(supabase,invoiceId)
}

export async function voidInvoice(invoiceId:string){const {supabase}=await requireUser();const {data:inv}=await supabase.from('invoices').select('contract_id,project_id,payments(id)').eq('id',invoiceId).maybeSingle();if(!inv)throw new Error('Invoice not found.');if((inv.payments||[]).length)throw new Error('Remove or reverse payments before voiding an invoice.');const {error}=await supabase.from('invoices').update({status:'void'}).eq('id',invoiceId);if(error)throw new Error(error.message);revalidatePath(`/invoices/${invoiceId}`);revalidatePath('/invoices');if(inv.contract_id)revalidatePath(`/contracts/${inv.contract_id}`);revalidatePath('/dashboard')}
