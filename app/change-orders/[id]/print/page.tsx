import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function date(value: string | null) { if (!value) return '—'; return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }

export default async function ChangeOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: co } = await supabase.from('change_orders').select('*,contracts(contract_number,client_name,client_address),projects(project_number,project_name,project_address)').eq('id', id).maybeSingle()
  if (!co) notFound()
  const contract = Array.isArray(co.contracts) ? co.contracts[0] : co.contracts
  const project = Array.isArray(co.projects) ? co.projects[0] : co.projects

  return <main className="contract-document"><article className="contract-sheet change-order-sheet">
    <header className="contract-header"><div className="contract-brand"><Image src="/ntg-logo.png" alt="Nevada Tile & Granite" width={72} height={72} /><div><strong>NEVADA TILE & GRANITE</strong><span>C-19 #0093403 &nbsp; | &nbsp; C-20 #0093447</span><span>1404 E Webb Ave · North Las Vegas, NV 89030</span><span>(725) 275-7145 · nevadatileandgranite.com</span></div></div><div className="contract-doc-title"><span>CHANGE ORDER</span><strong>{co.status === 'approved' ? 'Approved Revision' : 'Contract Revision'}</strong></div></header>
    <div className="contract-meta"><div><span>Project</span><strong>{project?.project_name || 'Project'}</strong><small>{project?.project_number}</small></div><div><span>Contract</span><strong>{contract?.contract_number}</strong></div><div><span>Change Order</span><strong>{co.change_order_number}</strong></div><div><span>Date</span><strong>{date(co.revision_date)}</strong></div></div>
    <h1>CONTRACT REVISION / CHANGE ORDER</h1>
    <p>This Change Order modifies the construction contract identified above. Except as expressly revised below, all terms and conditions of the original contract remain unchanged and in full force and effect.</p>
    <section className="party-grid"><div><h2>CLIENT</h2><strong>{contract?.client_name || 'Client'}</strong><p>{contract?.client_address || project?.project_address || 'Address on file'}</p></div><div><h2>CONTRACTOR</h2><strong>Nevada Tile &amp; Granite</strong><p>1404 E Webb Ave<br/>North Las Vegas, NV 89030</p></div></section>
    <section><h2>PURPOSE OF REVISION</h2><p className="preline">{co.reason || 'Revision to the scope and/or price of the linked construction contract.'}</p></section>
    <section><h2>SCOPE REVISION</h2><p className="preline">{co.scope_revision || 'No additional scope description entered.'}</p></section>
    <section><h2>SCHEDULE IMPACT</h2><p className="preline">{co.schedule_impact || 'No schedule change stated.'}</p></section>
    <section><h2>CONTRACT PRICE REVISION</h2><table className="contract-payment-table change-order-price-table"><tbody><tr><td>Contract Price Before This Change Order</td><td>{money(co.original_contract_price)}</td></tr><tr><td>Change Order Amount</td><td>{money(co.amount)}</td></tr><tr><td><strong>Revised Contract Price</strong></td><td><strong>{money(co.revised_contract_price)}</strong></td></tr></tbody></table></section>
    <section><h2>PAYMENT TERMS FOR THIS REVISION</h2><p className="preline">{co.payment_terms || 'The amount of this Change Order is due according to the payment terms agreed by the parties.'}</p></section>
    <section><h2>RATIFICATION OF ORIGINAL AGREEMENT</h2><p>Except as expressly revised above, all terms and conditions of the original Construction Contract remain unchanged and in full force and effect. This Change Order becomes effective when approved by the parties.</p></section>
    <section className="contract-acceptance"><h2>ACCEPTANCE AND SIGNATURES</h2><p>By signing below, the Client and Contractor accept this Change Order and agree to the revised scope, price, schedule impact, and payment terms stated above.</p><div className="contract-signatures"><div><span>Client Signature</span></div><div><span>Date</span></div><div className="signature-name"><strong>Print Name: {contract?.client_name || '________________________'}</strong></div><div></div><div><span>Contractor&apos;s Signature</span></div><div><span>Date</span></div><div className="signature-name"><strong>Print Name: Kevin Melendez | Nevada Tile &amp; Granite</strong></div><div></div></div></section>
    <footer>Change Order · Nevada Tile &amp; Granite · {co.change_order_number} · {contract?.contract_number} · {project?.project_number}</footer>
  </article></main>
}
