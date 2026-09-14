import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function date(value: string | null) { if (!value) return '—'; return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }

const residentialClauses = [
  ['7. INSURANCE', 'The Contractor will bear responsibility for the actions of its employees and personnel and will maintain comprehensive liability insurance for bodily injury, property damage, contractual liability, and cross-liability with a minimum combined single limit of $2,000,000.'],
  ['8. CONTRACTOR STATUS', "The Contractor is an independent contractor. Neither the Contractor's employees nor contract personnel are or shall be deemed employees of the Client."],
  ['9. ASSIGNMENT', 'Neither the Client nor the Contractor may assign this Agreement without the express written consent of the other party.'],
  ['10. RELATIONSHIP DEFINED', 'Nothing in this Agreement creates a partnership, agency, or employment relationship between the parties.'],
  ['11. LICENSES, PERMITS, AND CERTIFICATES', 'The Contractor represents that its employees and personnel will comply with applicable federal, state, and local laws requiring licenses, permits, and certificates necessary to perform the Services.'],
  ['12. FINAL AGREEMENT AND MODIFICATIONS', 'This Agreement is the complete agreement between the parties regarding its subject matter and supersedes prior oral or written agreements. Any change or modification must be in writing and signed by the parties.'],
  ['13. LEGAL NOTICE', 'Notices required or permitted under this Agreement shall be in writing and may be delivered personally or by Certified Mail - Return Receipt Requested, postage prepaid, to the addresses stated above.'],
  ['14. GOVERNING LAW', 'This Agreement is governed by the laws of the State of Nevada.'],
]

export default async function ContractPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: contract } = await supabase.from('contracts').select('*,projects(project_number,project_name,project_type),contract_payment_milestones(*)').eq('id', id).maybeSingle()
  if (!contract) notFound()
  const project = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
  const milestones = [...(contract.contract_payment_milestones || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const isCommercial = contract.contract_type === 'commercial'
  const dueText = contract.due_date_type === 'fixed' ? `The Services are scheduled to be completed by ${date(contract.due_date)}.${contract.due_date_notes ? ` ${contract.due_date_notes}` : ''}` : contract.due_date_type === 'other' ? (contract.due_date_notes || 'Completion will occur under the schedule agreed by the parties.') : `The Services do not have a fixed completion date.${contract.due_date_notes ? ` ${contract.due_date_notes}` : ''}`

  return <main className="contract-document"><article className="contract-sheet">
    <header className="contract-header"><div className="contract-brand"><Image src="/ntg-logo.png" alt="Nevada Tile & Granite" width={72} height={72} /><div><strong>NEVADA TILE & GRANITE</strong><span>C-19 #0093403 &nbsp; | &nbsp; C-20 #0093447</span><span>1404 E Webb Ave · North Las Vegas, NV 89030</span><span>(725) 275-7145 · nevadatileandgranite.com</span></div></div><div className="contract-doc-title"><span>{isCommercial ? 'COMMERCIAL CONTRACT' : 'RESIDENTIAL CONTRACT'}</span><strong>Execution Copy</strong></div></header>
    <div className="contract-meta"><div><span>Project</span><strong>{project?.project_name || (isCommercial ? 'Commercial Project' : 'Residential Project')}</strong><small>{project?.project_number}</small></div><div><span>Contract No.</span><strong>{contract.contract_number}</strong></div><div><span>Date</span><strong>{date(contract.effective_date)}</strong></div></div>
    <h1>{isCommercial ? 'COMMERCIAL CONSTRUCTION CONTRACT' : 'RESIDENTIAL CONSTRUCTION CONTRACT'}</h1>
    <p>This Construction Contract (the &quot;Agreement&quot;) is made between the Client and Nevada Tile &amp; Granite, effective {date(contract.effective_date)}, under the following terms and conditions.</p>
    <section className="party-grid"><div><h2>{isCommercial ? 'CLIENT / GENERAL CONTRACTOR' : 'CLIENT'}</h2><strong>{contract.client_name || 'Client'}</strong><p>{contract.client_address || contract.project_address || 'Address on file'}</p></div><div><h2>CONTRACTOR</h2><strong>Nevada Tile &amp; Granite</strong><p>1404 E Webb Ave<br/>North Las Vegas, NV 89030</p></div></section>

    {isCommercial ? <>
      <section><h2>1. SCOPE OF WORK</h2><p className="preline">{contract.scope || 'Services as described in the approved proposal, plans, specifications, and project documents.'}</p></section>
      <section><h2>2. CONTRACT SUM</h2><p>The Client agrees to pay Nevada Tile &amp; Granite a total original contract sum of <strong>{money(contract.original_contract_price ?? contract.contract_price)}</strong>, subject to approved written change orders.</p></section>
      <section><h2>3. PAYMENT TERMS</h2><p className="preline">{contract.commercial_payment_terms || 'Progress billing will be submitted in accordance with the agreed project billing schedule and approved schedule of values.'}</p>{milestones.length ? <table className="contract-payment-table"><thead><tr><th>Billing Milestone</th><th>Percent</th><th>Amount</th></tr></thead><tbody>{milestones.map((m: any) => <tr key={m.id}><td>{m.description}</td><td>{m.percentage == null ? '—' : `${Number(m.percentage).toLocaleString()}%`}</td><td>{money(m.amount)}</td></tr>)}</tbody></table> : null}</section>
      <section><h2>4. PROJECT SCHEDULE</h2><p>{dueText}</p><p>Contractor will coordinate its work with the project schedule and reasonable sequencing requirements communicated by the Client or General Contractor.</p></section>
      <section><h2>5. CHANGES IN THE WORK</h2><p>Changes to the scope, price, schedule, quantities, materials, or other requirements shall be documented through a written change order or other written authorization. Approved change orders become part of this Agreement and adjust the contract sum accordingly.</p></section>
      <section><h2>6. EXCLUSIONS AND CLARIFICATIONS</h2><p className="preline">{contract.exclusions_clarifications || 'No additional exclusions or clarifications are listed beyond the approved proposal and project documents.'}</p></section>
      <section><h2>7. CONTRACTOR-FURNISHED EXPENSES AND MATERIALS</h2><p className="preline">{contract.contractor_expenses || 'Only materials, labor, equipment, and other items expressly included in the approved scope are included in the contract sum.'}</p></section>
      <section><h2>8. INSURANCE, LICENSING, AND COMPLIANCE</h2><p>Nevada Tile &amp; Granite will maintain required contractor licensing and applicable insurance and will perform its work in accordance with applicable laws, approved project documents, and industry standards.</p></section>
      <section><h2>9. WARRANTY</h2><p>The Contractor warrants its workmanship and contractor-furnished materials against defects for one year from substantial completion unless a different period is stated in the project documents. This warranty excludes abuse, normal wear, owner or third-party modifications, improper maintenance, and conditions outside the Contractor&apos;s scope or control.</p></section>
      <section><h2>10. INDEPENDENT CONTRACTOR</h2><p>Nevada Tile &amp; Granite is an independent contractor. Nothing in this Agreement creates a partnership, agency, or employment relationship between the parties.</p></section>
      <section><h2>11. NOTICES AND GOVERNING LAW</h2><p>Required notices shall be in writing and delivered to the addresses stated in this Agreement unless the parties agree otherwise in writing. This Agreement is governed by the laws of the State of Nevada.</p></section>
      <section><h2>12. ENTIRE AGREEMENT</h2><p>This Agreement, together with incorporated proposals, plans, specifications, approved change orders, and other identified contract documents, constitutes the agreement between the parties regarding the Work. Modifications must be documented in writing.</p></section>
      <section><h2>13. ADDITIONAL TERMS AND CONDITIONS</h2><p className="preline contract-additional">{contract.additional_terms || 'None.'}</p></section>
    </> : <>
      <section><h2>1. SERVICES</h2><p className="preline">{contract.scope || 'Services as described in the approved estimate and project documents.'}</p></section>
      <section><h2>2. CONTRACT PRICE</h2><p>The Client agrees to pay the Contractor a total contract price of <strong>{money(contract.contract_price)}</strong> for the Services.</p></section>
      <section><h2>3. PAYMENT SCHEDULE</h2>{milestones.length ? <table className="contract-payment-table"><thead><tr><th>Payment Milestone</th><th>Percent</th><th>Amount</th></tr></thead><tbody>{milestones.map((m: any) => <tr key={m.id}><td>{m.description}</td><td>{m.percentage == null ? '—' : `${Number(m.percentage).toLocaleString()}%`}</td><td>{money(m.amount)}</td></tr>)}</tbody></table> : <p>Payment schedule to be agreed in writing by the parties.</p>}<p className="contract-small">Completion means fulfillment of the Services described in Section 1 in accordance with industry standards and to the approval of the Client, which approval shall not be unreasonably withheld.</p></section>
      <section><h2>4. DUE DATE</h2><p>{dueText}</p></section>
      <section><h2>5. TERMINATION</h2><p>This Agreement terminates upon completion of the Services. Neither party may terminate the Agreement before completion unless there is reasonable cause.</p></section>
      <section><h2>6. CONTRACTOR EXPENSES</h2><p>The Contractor is responsible only for the expenses identified below for this project:</p><p className="preline">{contract.contractor_expenses || 'No additional Contractor expenses are listed for this project beyond the Services and materials expressly included in this Agreement.'}</p><p>The Client agrees to pay within 30 days of notice for any other expense directly associated with the Services that is not included above, unless otherwise agreed in writing. Upon request, the Contractor may provide receipts or other proof of purchase.</p></section>
      {residentialClauses.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      <section><h2>15. WARRANTY</h2><p>The Contractor warrants that materials and equipment furnished with respect to the property are new and that work performed is of good and workmanlike quality, free from faults and defects, and in conformance with the contract documents. Work not conforming to these requirements, including substitutions not properly approved and authorized, may be considered defective.</p><p>The warranty excludes damage or defects caused by abuse, modifications not executed by the Contractor, improper or insufficient maintenance, improper operation, normal wear and tear, or normal usage. Upon request, the Contractor shall furnish satisfactory evidence of the kind and quality of materials and equipment.</p><p>The Contractor guarantees work performed and materials and equipment furnished against defects in materials and workmanship for one year from substantial completion of the entire property, or longer if specified in the contract documents. After written notice, the Contractor shall, within a reasonable time and without reimbursement under this Agreement, correct covered defects and repair damage to other work caused by such correction.</p></section>
      <section><h2>16. ADDITIONAL TERMS AND CONDITIONS</h2><p className="preline contract-additional">{contract.additional_terms || 'None.'}</p></section>
    </>}

    <section className="contract-acceptance"><h2>ACCEPTANCE AND SIGNATURES</h2><p>By signing below, the parties acknowledge that they have read, understood, and accepted the terms of this Agreement.</p><div className="contract-signatures"><div><span>{isCommercial ? 'Client / GC Signature' : 'Client Signature'}</span></div><div><span>Date</span></div><div className="signature-name"><strong>Print Name: {contract.client_name || '________________________'}</strong></div><div></div><div><span>Contractor&apos;s Signature</span></div><div><span>Date</span></div><div className="signature-name"><strong>Print Name: Kevin Melendez | Nevada Tile &amp; Granite</strong></div><div></div></div></section>
    <footer>{isCommercial ? 'Commercial Construction Contract' : 'Residential Construction Contract'} · Nevada Tile &amp; Granite · {contract.contract_number} · {project?.project_number}</footer>
  </article></main>
}
