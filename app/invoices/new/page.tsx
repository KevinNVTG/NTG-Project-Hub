import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createInvoice, createProjectInvoice } from '../actions'

function money(v:any){return Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}

export default async function NewInvoicePage({searchParams}:{searchParams:Promise<{contract?:string;type?:string;source?:string;project?:string}>}){
  const q=await searchParams
  const {supabase}=await requireUser()
  const {data:contracts}=await supabase.from('contracts').select('id,project_id,contract_number,client_name,contract_price,pricing_basis,customer_id,projects(id,project_number,project_name)').neq('status','void').order('created_at',{ascending:false})
  const {data:project}=q.project?await supabase.from('projects').select('id,project_number,project_name,customer_id').eq('id',q.project).maybeSingle():{data:null}
  const selected=q.contract||contracts?.find((c:any)=>c.project_id===q.project)?.id||contracts?.[0]?.id||''
  const {data:contract}=selected?await supabase.from('contracts').select('contract_payment_milestones(id,description,amount),change_orders(id,change_order_number,title,amount,status)').eq('id',selected).maybeSingle():{data:null}

  const sameCustomerContracts = project
    ? (contracts||[]).filter((c:any)=>project.customer_id ? c.customer_id===project.customer_id : c.project_id===project.id)
    : []
  const projectContractIds = new Set((sameCustomerContracts||[]).filter((c:any)=>c.project_id===project?.id).map((c:any)=>c.id))

  return <AppShell title="Create Invoice">
    <div className="page-heading"><div><h2>{project?'Create Project Invoice':'New Customer Invoice'}</h2><p>{project?`Create billing from ${project.project_number} · ${project.project_name}. Contracts on this project are selected automatically, and you can optionally include another contract for the same customer.`:'Create an invoice from a contract, milestone, approved change order, T&M billing period, or final balance.'}</p></div>{project?<div className="quick-actions-inline"><Link className="secondary-button" href={`/projects/${project.id}`}>Back to Project</Link></div>:null}</div>

    {project ? <section className="card invoice-create-card">
      <div className="section-heading"><div><h3 className="section-title">Project billing</h3><p className="muted-copy">Reference one or more contracts on a single customer invoice. Contract balances remain separate line items so the invoice clearly shows what each project or scope represents.</p></div></div>
      <form action={createProjectInvoice} className="invoice-create-form">
        <div className="field"><label>Contracts to reference</label><div className="project-check-list">{sameCustomerContracts.length?sameCustomerContracts.map((c:any)=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;const onCurrent=c.project_id===project.id;return <label key={c.id} className="project-check-row"><input type="checkbox" name="contract_ids" value={c.id} defaultChecked={onCurrent}/><span><strong>{p?.project_number} · {p?.project_name}</strong><small>{c.contract_number} · Contract value {money(c.contract_price)}{onCurrent?' · Current project':' · Same customer'}</small></span></label>}):<div className="empty compact-empty">No active contracts were found for this customer.</div>}</div><small className="field-help">All contracts belonging to this project are preselected. Check another contract only when you intentionally want it referenced on the same invoice.</small></div>
        <div className="field"><label>Invoice notes</label><textarea name="notes" rows={3} placeholder="Final billing for bathroom and flooring contracts."/></div>
        <button className="primary-button" type="submit" disabled={!sameCustomerContracts.length}>Create Project Invoice</button>
      </form>
      <div className="notice info-notice" style={{marginTop:16}}><strong>Deductions and credits are added after the invoice is created.</strong><span>Use the invoice page to add a trade-damage deduction, credit, additional charge, or payment so adjustments stay with the actual invoice record.</span></div>
    </section> : null}

    <section className="card invoice-create-card" style={{marginTop:project?20:0}}>
      <div className="section-heading"><div><h3 className="section-title">{project?'Single-contract invoice':'Standard invoice'}</h3><p className="muted-copy">Bill one contract, milestone, approved change order, T&M period, or final balance.</p></div></div>
      <form action={createInvoice} className="invoice-create-form">
        <div className="field"><label>Contract</label><select name="contract_id" defaultValue={selected} required>{contracts?.map((c:any)=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;return <option key={c.id} value={c.id}>{c.contract_number} · {c.client_name} · {p?.project_name}</option>})}</select><small className="field-help">If you change contracts, reopen Create Invoice from that contract to load its milestones and change orders.</small></div>
        <div className="field"><label>Invoice type</label><select name="invoice_type" defaultValue={q.type||'progress'}><option value="progress">Progress / Custom Billing</option><option value="time_and_materials">T&M Billing</option><option value="milestone">Contract Payment Milestone</option><option value="change_order">Approved Change Order</option><option value="final">Final Contract Balance</option><option value="custom">Custom Invoice</option></select></div>
        <div className="field"><label>Payment milestone or change order</label><select name="source_id" defaultValue={q.source||''}><option value="">Not applicable / select source</option>{contract?.contract_payment_milestones?.map((m:any)=><option key={m.id} value={m.id}>Milestone · {m.description} · ${Number(m.amount||0).toLocaleString()}</option>)}{contract?.change_orders?.filter((co:any)=>co.status==='approved').map((co:any)=><option key={co.id} value={co.id}>{co.change_order_number} · {co.title} · ${Number(co.amount||0).toLocaleString()}</option>)}</select></div>
        <div className="field"><label>Description</label><input name="description" placeholder="Progress payment - tile installation" /></div>
        <div className="field"><label>Amount</label><input name="amount" type="number" min="0" step="0.01" placeholder="0.00" /><small className="field-help">Milestone and change-order amounts are pulled automatically. Final billing calculates the remaining uninvoiced contract balance.</small></div>
        <button className="primary-button" type="submit">Create Standard Invoice</button>
      </form>
    </section>

    {!project?<section className="card" style={{marginTop:20}}><div className="section-heading"><div><h3 className="section-title">Need one invoice for multiple contracts?</h3><p className="muted-copy">Open the customer’s project and click <strong>+ Invoice</strong>. Project Hub will preselect the contracts tied to that project and let you optionally include another contract for the same customer.</p></div></div><Link className="secondary-button" href="/projects">Open Projects</Link></section>:null}
  </AppShell>
}
