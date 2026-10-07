import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createConsolidatedInvoice, createInvoice } from '../actions'

export default async function NewInvoicePage({searchParams}:{searchParams:Promise<{contract?:string;type?:string;source?:string}>}){
  const q=await searchParams
  const {supabase}=await requireUser()
  const {data:contracts}=await supabase.from('contracts').select('id,contract_number,client_name,contract_price,pricing_basis,customer_id,projects(project_number,project_name)').neq('status','void').order('created_at',{ascending:false})
  const selected=q.contract||contracts?.[0]?.id||''
  const {data:contract}=selected?await supabase.from('contracts').select('contract_payment_milestones(id,description,amount),change_orders(id,change_order_number,title,amount,status)').eq('id',selected).maybeSingle():{data:null}

  return <AppShell title="Create Invoice">
    <div className="page-heading"><div><h2>New Customer Invoice</h2><p>Create a standard contract invoice or combine multiple projects for one customer into a single invoice.</p></div></div>

    <section className="two-column">
      <div className="card invoice-create-card">
        <div className="section-heading"><div><h3 className="section-title">Standard invoice</h3><p className="muted-copy">Bill one contract, milestone, approved change order, T&M period, or final balance.</p></div></div>
        <form action={createInvoice} className="invoice-create-form">
          <div className="field"><label>Contract</label><select name="contract_id" defaultValue={selected} required>{contracts?.map((c:any)=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;return <option key={c.id} value={c.id}>{c.contract_number} · {c.client_name} · {p?.project_name}</option>})}</select><small className="field-help">If you change contracts, reopen Create Invoice from that contract to load its milestones and change orders.</small></div>
          <div className="field"><label>Invoice type</label><select name="invoice_type" defaultValue={q.type||'progress'}><option value="progress">Progress / Custom Billing</option><option value="time_and_materials">T&M Billing</option><option value="milestone">Contract Payment Milestone</option><option value="change_order">Approved Change Order</option><option value="final">Final Contract Balance</option><option value="custom">Custom Invoice</option></select></div>
          <div className="field"><label>Payment milestone or change order</label><select name="source_id" defaultValue={q.source||''}><option value="">Not applicable / select source</option>{contract?.contract_payment_milestones?.map((m:any)=><option key={m.id} value={m.id}>Milestone · {m.description} · ${Number(m.amount||0).toLocaleString()}</option>)}{contract?.change_orders?.filter((co:any)=>co.status==='approved').map((co:any)=><option key={co.id} value={co.id}>{co.change_order_number} · {co.title} · ${Number(co.amount||0).toLocaleString()}</option>)}</select></div>
          <div className="field"><label>Description</label><input name="description" placeholder="Progress payment - tile installation" /></div>
          <div className="field"><label>Amount</label><input name="amount" type="number" min="0" step="0.01" placeholder="0.00" /><small className="field-help">Milestone and change-order amounts are pulled automatically. Final billing calculates the remaining uninvoiced contract balance.</small></div>
          <button className="primary-button" type="submit">Create Standard Invoice</button>
        </form>
      </div>

      <div className="card invoice-create-card">
        <div className="section-heading"><div><h3 className="section-title">Consolidated project invoice</h3><p className="muted-copy">Combine two or more project contracts for the same customer on one invoice. Ideal for a residence with separate bathroom, flooring, or other project records.</p></div></div>
        <form action={createConsolidatedInvoice} className="invoice-create-form">
          <div className="field"><label>Select projects / contracts</label><div className="project-check-list">{contracts?.map((c:any)=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;return <label key={c.id} className="project-check-row"><input type="checkbox" name="contract_ids" value={c.id}/><span><strong>{p?.project_number} · {p?.project_name}</strong><small>{c.client_name} · {c.contract_number} · Contract {Number(c.contract_price||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}</small></span></label>})}</div><small className="field-help">Choose contracts belonging to the same customer. Each selected project will be referenced separately on the invoice.</small></div>
          <div className="field"><label>Optional trade damage deduction</label><input name="trade_damage_amount" type="number" min="0" step="0.01" placeholder="0.00"/><small className="field-help">Entered as a credit/deduction from the invoice total, not as a payment.</small></div>
          <div className="field"><label>Deduction description</label><input name="trade_damage_description" placeholder="Trade damage deduction - repair / replacement credit"/></div>
          <div className="field"><label>Invoice notes</label><textarea name="notes" rows={3} placeholder="Consolidated final billing for bathroom and flooring projects."/></div>
          <button className="primary-button" type="submit">Create Consolidated Invoice</button>
        </form>
      </div>
    </section>
  </AppShell>
}
