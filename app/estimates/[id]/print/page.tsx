import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function money(value: number) { return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function customerName(c: any) { return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Customer' }

export default async function EstimatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: estimate } = await supabase.from('estimates').select('*, projects(project_number,project_name,project_address),customers(first_name,last_name,company_name,email,phone,billing_address),estimate_items(*)').eq('id', id).maybeSingle()
  if (!estimate) notFound()
  const project = Array.isArray(estimate.projects) ? estimate.projects[0] : estimate.projects
  const customer = Array.isArray(estimate.customers) ? estimate.customers[0] : estimate.customers
  const items = [...(estimate.estimate_items || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const taxableSubtotal = items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const tax = taxableSubtotal * (Number(estimate.sales_tax_rate || 0) / 100)
  const total = subtotal + tax

  return <main className="estimate-document">
    <section className="document-sheet">
      <header className="document-header"><Image src="/ntg-logo.png" alt="Nevada Tile & Granite" width={96} height={96} /><div className="document-company"><h1>Nevada Tile & Granite</h1><p>1404 E Webb Ave · North Las Vegas, NV 89030</p><p>(725) 275-7145 · kevin@nevadatileandgranite.com</p><p>nevadatileandgranite.com · C-19 #0093403 · C-20 #0093447</p></div><div className="document-title"><span>ESTIMATE</span><strong>{estimate.estimate_number}</strong><small>{project?.project_number}</small></div></header>
      <div className="document-meta-grid"><div><span>Prepared For</span><strong>{customerName(customer)}</strong><p>{customer?.billing_address || project?.project_address || ''}</p><p>{customer?.phone || ''}{customer?.phone && customer?.email ? ' · ' : ''}{customer?.email || ''}</p></div><div><span>Project</span><strong>{project?.project_name || '—'}</strong><p>{project?.project_address || '—'}</p></div><div><span>Estimate Date</span><strong>{estimate.estimate_date}</strong><span>Valid Until</span><strong>{estimate.valid_until || '—'}</strong></div></div>
      {estimate.scope ? <section className="document-section"><h2>Scope of Work</h2><p className="preline">{estimate.scope}</p></section> : null}
      <section className="document-section"><h2>Pricing</h2><table className="document-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{items.map((item: any) => <tr key={item.id}><td><strong>{item.description}</strong><small>{item.category}</small></td><td>{Number(item.quantity).toLocaleString()}</td><td>{item.unit}</td><td>{money(Number(item.unit_price))}</td><td>{money(Number(item.quantity) * Number(item.unit_price))}</td></tr>)}</tbody></table><div className="document-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{tax > 0 ? <div><span>Sales Tax</span><strong>{money(tax)}</strong></div> : null}<div className="document-grand"><span>Total Estimate</span><strong>{money(total)}</strong></div></div></section>
      <div className="document-bottom-grid">{estimate.payment_terms ? <section className="document-section"><h2>Payment Terms</h2><p className="preline">{estimate.payment_terms}</p></section> : null}{estimate.exclusions ? <section className="document-section"><h2>Exclusions</h2><p className="preline">{estimate.exclusions}</p></section> : null}</div>
      {estimate.notes ? <section className="document-section"><h2>Notes</h2><p className="preline">{estimate.notes}</p></section> : null}
      <section className="document-acceptance"><h2>Estimate Acceptance</h2><p>Acceptance of this estimate authorizes Nevada Tile & Granite to prepare the applicable construction contract. Final work is governed by the signed construction contract and approved change orders.</p><div className="signature-grid"><div><span>Client Signature</span></div><div><span>Date</span></div><div><span>Printed Name</span></div><div><span>NTG Representative</span></div></div></section>
      <footer className="document-footer">Nevada Tile & Granite · Licensed · Bonded · Insured</footer>
    </section>
  </main>
}
