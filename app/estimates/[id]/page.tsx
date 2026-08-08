import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { addEstimateItem, deleteEstimateItem, updateEstimate } from '../actions'

function money(value: number) { return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function customerName(c: any) { return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'No customer' }

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: estimate } = await supabase.from('estimates').select('*, projects(id,project_number,project_name,project_address),customers(first_name,last_name,company_name,email,phone,billing_address),estimate_items(*)').eq('id', id).maybeSingle()
  if (!estimate) notFound()
  const project = Array.isArray(estimate.projects) ? estimate.projects[0] : estimate.projects
  const customer = Array.isArray(estimate.customers) ? estimate.customers[0] : estimate.customers
  const items = [...(estimate.estimate_items || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const taxableSubtotal = items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const tax = taxableSubtotal * (Number(estimate.sales_tax_rate || 0) / 100)
  const total = subtotal + tax
  const updateAction = updateEstimate.bind(null, id)
  const addAction = addEstimateItem.bind(null, id)

  return (
    <AppShell title="Estimate Builder">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/estimates">← Estimates</Link><div className="project-title-line"><h2>{estimate.estimate_number}</h2><span className={`badge estimate-status-${estimate.status}`}>{estimate.status}</span></div><p>{project?.project_number} · {project?.project_name} · {customerName(customer)}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/estimates/${id}/print`} target="_blank">Print / PDF</Link>{project?.id ? <Link className="secondary-button" href={`/projects/${project.id}`}>Open Project</Link> : null}</div></div>
      <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Estimate Total</div><div className="stat-value stat-money">{money(total)}</div></div><div className="card"><div className="stat-label">Subtotal</div><div className="detail-value">{money(subtotal)}</div></div><div className="card"><div className="stat-label">Tax</div><div className="detail-value">{money(tax)}</div></div><div className="card"><div className="stat-label">Line Items</div><div className="detail-value">{items.length}</div></div></section>

      <section className="estimate-builder-grid">
        <div className="stacked-column">
          <div className="card"><div className="section-heading"><div><h3 className="section-title">Pricing</h3><p className="muted-copy">Add labor, materials, equipment, allowances, or other items.</p></div></div>
          {items.length ? <div className="table-wrap"><table><thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody>{items.map((item: any) => { const remove = deleteEstimateItem.bind(null, id, item.id); const lineTotal = Number(item.quantity) * Number(item.unit_price); return <tr key={item.id}><td><span className="badge item-category">{item.category}</span></td><td><strong>{item.description}</strong>{item.taxable ? <small className="tax-note">Taxable</small> : null}</td><td>{Number(item.quantity).toLocaleString()}</td><td>{item.unit}</td><td>{money(Number(item.unit_price))}</td><td><strong>{money(lineTotal)}</strong></td><td><form action={remove}><button className="icon-danger" title="Remove item">×</button></form></td></tr> })}</tbody></table></div> : <div className="empty compact-empty">No line items yet.</div>}
          <div className="estimate-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Sales tax ({Number(estimate.sales_tax_rate || 0).toFixed(2)}%)</span><strong>{money(tax)}</strong></div><div className="grand-total"><span>Estimate Total</span><strong>{money(total)}</strong></div></div></div>

          <div className="card"><h3 className="section-title">Add line item</h3><form action={addAction}><div className="form-grid"><div className="field"><label>Category</label><select name="category"><option value="labor">Labor</option><option value="material">Material</option><option value="equipment">Equipment</option><option value="allowance">Allowance</option><option value="other">Other</option></select></div><div className="field"><label>Description</label><input name="description" required placeholder="24x48 porcelain tile installation" /></div></div><div className="line-item-grid"><div className="field"><label>Quantity</label><input name="quantity" type="number" step="0.001" min="0" defaultValue="1" /></div><div className="field"><label>Unit</label><input name="unit" defaultValue="LS" placeholder="SF, LF, EA, LS" /></div><div className="field"><label>Unit price</label><input name="unit_price" type="number" step="0.01" min="0" defaultValue="0" /></div><label className="check-field"><input name="taxable" type="checkbox" /> <span>Taxable</span></label></div><button className="inline-primary" type="submit">+ Add item</button></form></div>
        </div>

        <div className="card estimate-details-card"><h3 className="section-title">Estimate details</h3><form action={updateAction}><div className="field"><label>Status</label><select name="status" defaultValue={estimate.status}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></div><div className="form-grid"><div className="field"><label>Estimate date</label><input type="date" name="estimate_date" defaultValue={estimate.estimate_date} /></div><div className="field"><label>Valid until</label><input type="date" name="valid_until" defaultValue={estimate.valid_until || ''} /></div></div><div className="field"><label>Sales tax rate (%)</label><input name="sales_tax_rate" type="number" min="0" step="0.01" defaultValue={Number(estimate.sales_tax_rate || 0)} /></div><div className="field"><label>Scope of work</label><textarea name="scope" rows={8} defaultValue={estimate.scope || ''} /></div><div className="field"><label>Payment terms</label><textarea name="payment_terms" rows={3} defaultValue={estimate.payment_terms || ''} /></div><div className="field"><label>Exclusions</label><textarea name="exclusions" rows={4} defaultValue={estimate.exclusions || ''} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={3} defaultValue={estimate.notes || ''} /></div><button className="primary-button" type="submit">Save estimate</button></form></div>
      </section>
    </AppShell>
  )
}
