import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function money(v:any){return Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}
function basis(v:string){return ({lump_sum:'LUMP SUM / STIPULATED SUM',time_and_materials:'TIME & MATERIALS (T&M)',hybrid_allowance_tm:'HYBRID — ALLOWANCES + T&M',unit_price:'UNIT PRICE',cost_plus:'COST PLUS FEE',gmp:'GUARANTEED MAXIMUM PRICE (GMP)',not_to_exceed:'NOT-TO-EXCEED (NTE)'} as any)[v]||v}
function customerName(c:any){return c?.company_name||[c?.first_name,c?.last_name].filter(Boolean).join(' ')||'Client'}
function lines(t:any){return String(t||'').split('\n').map((x:string)=>x.trim()).filter(Boolean)}

export default async function ProposalPrint({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const {supabase}=await requireUser()
  const {data:p}=await supabase.from('commercial_proposals').select('*,projects(project_number,project_name,project_address),customers(first_name,last_name,company_name,email,phone,billing_address),commercial_proposal_csi_sections(*),commercial_proposal_items(*),commercial_proposal_labor_rates(*)').eq('id',id).maybeSingle()
  if(!p)notFound()
  const {data:company}=await supabase.from('company_settings').select('*').limit(1).maybeSingle()
  const project=Array.isArray(p.projects)?p.projects[0]:p.projects
  const customer=Array.isArray(p.customers)?p.customers[0]:p.customers
  const sections=[...(p.commercial_proposal_csi_sections||[])].sort((a:any,b:any)=>a.sort_order-b.sort_order)
  const items=[...(p.commercial_proposal_items||[])].sort((a:any,b:any)=>a.sort_order-b.sort_order)
  const laborRates=[...(p.commercial_proposal_labor_rates||[])].sort((a:any,b:any)=>a.sort_order-b.sort_order)
  const baseItems=items.filter((i:any)=>!i.is_alternate)
  const allowanceItems=baseItems.filter((i:any)=>i.category==='allowance')
  const regularItems=baseItems.filter((i:any)=>i.category!=='allowance')
  const regularBase=regularItems.reduce((s:number,i:any)=>s+Number(i.quantity)*Number(i.unit_price),0)
  const allowanceTotal=allowanceItems.reduce((s:number,i:any)=>s+Number(i.quantity)*Number(i.unit_price),0)
  const altItems=items.filter((i:any)=>i.is_alternate)
  const projectedLaborBilling=laborRates.reduce((s:number,r:any)=>s+Number(r.estimated_st_hours||0)*Number(r.client_st_rate||0)+Number(r.estimated_ot_hours||0)*Number(r.client_ot_rate||0)+Number(r.estimated_dt_hours||0)*Number(r.client_dt_rate||0),0)
  const systemEstimate=regularBase+allowanceTotal+projectedLaborBilling
  const budgetEstimate=Number(p.estimated_project_cost||0)||systemEstimate
  const detailed=p.template_depth==='detailed'
  const standard=p.template_depth!=='compact'
  const separateSheets=p.separate_trade_sheets!==false && sections.length>1
  const tmLike=p.pricing_basis==='time_and_materials'||p.pricing_basis==='hybrid_allowance_tm'

  return <main className="commercial-proposal-print">
    <header className="proposal-print-header"><div className="proposal-print-brand"><Image src="/ntg-logo.png" alt="Nevada Tile & Granite" width={74} height={74}/><div><h1>Nevada Tile & Granite</h1><p>{company?.address}</p><p>{company?.phone} · {company?.email}</p><p>C-19 #{company?.license_c19} · C-20 #{company?.license_c20}</p></div></div><div className="proposal-print-id"><strong>COMMERCIAL PROPOSAL</strong><span>{p.proposal_number}</span></div></header>
    <section className="proposal-print-title"><span>{basis(p.pricing_basis)}</span><h2>{p.title}</h2><p>{project?.project_name}</p></section>
    <section className="proposal-meta-grid"><div><span>Prepared For</span><strong>{customerName(customer)}</strong><p>{p.client_contact||''}</p><p>{p.client_email||customer?.email||''}</p></div><div><span>Project</span><strong>{project?.project_number} · {project?.project_name}</strong><p>{project?.project_address||''}</p></div><div><span>Proposal</span><p><b>Date</b> {p.proposal_date}</p><p><b>Valid Through</b> {p.valid_until||'—'}</p><p><b>Prepared By</b> {p.estimator||'Kevin Melendez'}</p></div></section>

    {p.executive_summary?<section className="proposal-print-section"><h3>Proposal Summary</h3><p className="preserve-lines">{p.executive_summary}</p></section>:null}
    {tmLike&&p.show_estimated_project_cost!==false&&budgetEstimate>0?<section className="proposal-print-section proposal-budget-estimate"><h3>Estimated Project Cost — Budgetary</h3><div className="proposal-budget-amount">{money(budgetEstimate)}</div><p className="preserve-lines">{p.estimated_project_cost_notes||'Estimated project cost is provided for budgeting purposes only. Final compensation will be based on actual authorized T&M labor, approved costs, applicable markups, and allowance reconciliation under the agreement.'}</p></section>:null}
    {standard&&(p.drawings_reference||p.specifications_reference||p.addenda_reference)?<section className="proposal-print-section"><h3>Contract Documents / Bid Basis</h3><div className="proposal-doc-grid"><div><b>Drawings</b><p className="preserve-lines">{p.drawings_reference||'Not specifically identified.'}</p></div><div><b>Specifications</b><p className="preserve-lines">{p.specifications_reference||'Not specifically identified.'}</p></div><div><b>Addenda</b><p className="preserve-lines">{p.addenda_reference||'None identified.'}</p></div></div></section>:null}

    {sections.map((s:any,index:number)=>{
      const sectionItems=regularItems.filter((i:any)=>i.csi_section_id===s.id)
      const subtotal=sectionItems.reduce((sum:number,i:any)=>sum+Number(i.quantity)*Number(i.unit_price),0)
      return <section key={s.id} className="proposal-print-section proposal-trade-sheet" style={separateSheets&&index>0?{breakBefore:'page'}:undefined}>
        <h3>Scope of Work</h3>
        <div className="proposal-csi-print"><h4><span>{s.csi_code}</span>{s.csi_title}</h4><p className="preserve-lines">{s.scope_text||'Scope per proposal pricing and identified contract documents.'}</p></div>
        {sectionItems.length?<><h3>{s.csi_title} — Pricing Schedule</h3><table className="proposal-price-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{sectionItems.map((i:any)=><tr key={i.id}><td>{i.description}</td><td>{Number(i.quantity).toLocaleString()}</td><td>{i.unit}</td><td>{money(i.unit_price)}</td><td>{money(Number(i.quantity)*Number(i.unit_price))}</td></tr>)}</tbody><tfoot><tr><td colSpan={4}>{s.csi_code} SUBTOTAL</td><td>{money(subtotal)}</td></tr></tfoot></table></>:null}
      </section>
    })}

    {allowanceItems.length?<section className="proposal-print-section"><h3>Material Allowance Schedule</h3><table className="proposal-price-table"><thead><tr><th>Allowance</th><th>Qty</th><th>Unit</th><th>Allowance Rate</th><th>Allowance Amount</th></tr></thead><tbody>{allowanceItems.map((i:any)=><tr key={i.id}><td>{i.description}</td><td>{Number(i.quantity).toLocaleString()}</td><td>{i.unit}</td><td>{money(i.unit_price)}</td><td>{money(Number(i.quantity)*Number(i.unit_price))}</td></tr>)}</tbody><tfoot><tr><td colSpan={4}>TOTAL ALLOWANCES</td><td>{money(allowanceTotal)}</td></tr></tfoot></table><p>Allowances are budgetary amounts and will be reconciled to actual approved costs in accordance with the proposal and executed agreement.</p></section>:null}

    {laborRates.length&&tmLike&&p.show_client_labor_rates!==false?<section className="proposal-print-section"><h3>NTG Union Labor Billing Schedule</h3><p>The rates below are Nevada Tile & Granite customer billing rates for the listed union labor classifications. They are not employee wage or fringe-benefit rates.</p><table className="proposal-price-table"><thead><tr><th>Classification</th><th>Straight Time</th><th>Overtime</th><th>Double Time</th></tr></thead><tbody>{laborRates.map((r:any)=><tr key={r.id}><td>{r.classification}</td><td>{money(r.client_st_rate)}/hr</td><td>{money(r.client_ot_rate)}/hr</td><td>{money(r.client_dt_rate)}/hr</td></tr>)}</tbody></table>{p.tm_labor_terms?<p className="preserve-lines">{p.tm_labor_terms}</p>:null}</section>:null}

    {regularItems.some((i:any)=>!i.csi_section_id)?<section className="proposal-print-section"><h3>Unassigned / General Pricing</h3><table className="proposal-price-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{regularItems.filter((i:any)=>!i.csi_section_id).map((i:any)=><tr key={i.id}><td>{i.description}</td><td>{Number(i.quantity).toLocaleString()}</td><td>{i.unit}</td><td>{money(i.unit_price)}</td><td>{money(Number(i.quantity)*Number(i.unit_price))}</td></tr>)}</tbody></table></section>:null}

    {p.pricing_basis==='lump_sum'?<section className="proposal-print-section"><h3>Base Proposal Summary</h3><table className="proposal-price-table"><tbody>{sections.map((s:any)=>{const subtotal=regularItems.filter((i:any)=>i.csi_section_id===s.id).reduce((sum:number,i:any)=>sum+Number(i.quantity)*Number(i.unit_price),0);return <tr key={s.id}><td>{s.csi_code}</td><td>{s.csi_title}</td><td>{money(subtotal)}</td></tr>})}{allowanceTotal>0?<tr><td>ALLOWANCE</td><td>Material Allowances</td><td>{money(allowanceTotal)}</td></tr>:null}</tbody><tfoot><tr><td colSpan={2}>TOTAL BASE PROPOSAL</td><td>{money(regularBase+allowanceTotal)}</td></tr></tfoot></table></section>:null}

    {altItems.length?<section className="proposal-print-section"><h3>Alternates</h3><table className="proposal-price-table"><thead><tr><th>Alternate</th><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>{altItems.map((i:any)=><tr key={i.id}><td>{i.alternate_label||'Alternate'}</td><td>{i.description}</td><td>{Number(i.quantity).toLocaleString()}</td><td>{i.unit}</td><td>{money(Number(i.quantity)*Number(i.unit_price))}</td></tr>)}</tbody></table>{p.alternates_notes?<p className="preserve-lines">{p.alternates_notes}</p>:null}</section>:null}
    {p.pricing_basis!=='lump_sum'?<section className="proposal-print-section"><h3>{basis(p.pricing_basis)} Commercial Terms</h3><div className="proposal-rate-print">{p.material_markup?<p><span>Material Markup</span><b>{p.material_markup}%</b></p>:null}{p.equipment_markup?<p><span>Equipment Markup</span><b>{p.equipment_markup}%</b></p>:null}{p.subcontractor_markup?<p><span>Subcontractor Markup</span><b>{p.subcontractor_markup}%</b></p>:null}{p.cost_plus_fee?<p><span>Cost Plus Fee</span><b>{p.cost_plus_fee}%</b></p>:null}{p.not_to_exceed_amount?<p><span>Not-to-Exceed Ceiling</span><b>{money(p.not_to_exceed_amount)}</b></p>:null}{p.gmp_amount?<p><span>Guaranteed Maximum Price</span><b>{money(p.gmp_amount)}</b></p>:null}</div></section>:null}
    {p.inclusions?<section className="proposal-print-section"><h3>Inclusions</h3><ul>{lines(p.inclusions).map((x,i)=><li key={i}>{x.replace(/^[-•]\s*/,'')}</li>)}</ul></section>:null}
    {p.exclusions?<section className="proposal-print-section"><h3>Exclusions</h3><ul>{lines(p.exclusions).map((x,i)=><li key={i}>{x.replace(/^[-•]\s*/,'')}</li>)}</ul></section>:null}
    {p.clarifications?<section className="proposal-print-section"><h3>Clarifications / Qualifications</h3><ul>{lines(p.clarifications).map((x,i)=><li key={i}>{x.replace(/^[-•]\s*/,'')}</li>)}</ul></section>:null}
    {standard&&p.assumptions?<section className="proposal-print-section"><h3>Assumptions</h3><p className="preserve-lines">{p.assumptions}</p></section>:null}
    {p.schedule_text?<section className="proposal-print-section"><h3>Schedule / Sequencing</h3><p className="preserve-lines">{p.schedule_text}</p></section>:null}
    {p.payment_terms?<section className="proposal-print-section"><h3>Payment / Billing Terms</h3><p className="preserve-lines">{p.payment_terms}</p></section>:null}
    {detailed&&p.insurance_bonding?<section className="proposal-print-section"><h3>Insurance / Bonding</h3><p className="preserve-lines">{p.insurance_bonding}</p></section>:null}
    {standard&&p.warranty_text?<section className="proposal-print-section"><h3>Warranty</h3><p className="preserve-lines">{p.warranty_text}</p></section>:null}
    {detailed&&p.closeout_text?<section className="proposal-print-section"><h3>Closeout Requirements</h3><p className="preserve-lines">{p.closeout_text}</p></section>:null}
    <section className="proposal-acceptance"><h3>Proposal Acceptance</h3><p>This proposal is offered subject to the scope, pricing basis, qualifications, exclusions, contract documents, allowances, billing rates, and terms stated above. Final contractual obligations are subject to the executed agreement between the parties.</p><div className="proposal-signatures"><div><span>Accepted By / Company</span><i></i><span>Name / Title</span><i></i></div><div><span>Signature</span><i></i><span>Date</span><i></i></div></div></section>
    <footer className="proposal-print-footer">Nevada Tile & Granite · {company?.website} · {p.proposal_number}</footer>
  </main>
}
