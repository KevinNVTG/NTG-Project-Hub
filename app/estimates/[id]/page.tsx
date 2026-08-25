import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { addEstimateItem, addStoneSlabToEstimate, deleteEstimateItem, updateEstimate } from '../actions'
import { convertEstimateToContract } from '@/app/contracts/actions'

function money(value: number) { return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function customerName(c: any) { return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'No customer' }

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: estimate } = await supabase.from('estimates').select('*, projects(id,project_number,project_name,project_address),customers(first_name,last_name,company_name,email,phone,billing_address),estimate_items(*)').eq('id', id).maybeSingle()
  if (!estimate) notFound()
  const { data: existingContract } = await supabase.from('contracts').select('id,contract_number').eq('source_estimate_id', id).maybeSingle()
  const { data: stoneSlabs } = await supabase.from('stone_slabs').select('*').eq('active', true).order('material_type').order('name')
  const project = Array.isArray(estimate.projects) ? estimate.projects[0] : estimate.projects
  const customer = Array.isArray(estimate.customers) ? estimate.customers[0] : estimate.customers
  const items = [...(estimate.estimate_items || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const taxableSubtotal = items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const tax = taxableSubtotal * (Number(estimate.sales_tax_rate || 0) / 100)
  const total = subtotal + tax
  const updateAction = updateEstimate.bind(null, id)
  const addAction = addEstimateItem.bind(null, id)
  const addStoneAction = addStoneSlabToEstimate.bind(null, id)
  const convertAction = convertEstimateToContract.bind(null, id)

  return (
    <AppShell title="Estimate Builder">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/estimates">← Estimates</Link><div className="project-title-line"><h2>{estimate.estimate_number}</h2><span className={`badge estimate-status-${estimate.status}`}>{estimate.status}</span></div><p>{project?.project_number} · {project?.project_name} · {customerName(customer)}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/estimates/${id}/print`} target="_blank">Print / PDF</Link>{existingContract?.id ? <Link className="primary-link-button" href={`/contracts/${existingContract.id}`}>Open {existingContract.contract_number}</Link> : <form action={convertAction}><button className="primary-link-button" type="submit">Convert to Contract</button></form>}{project?.id ? <Link className="secondary-button" href={`/projects/${project.id}`}>Open Project</Link> : null}</div></div>
      <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Estimate Total</div><div className="stat-value stat-money">{money(total)}</div></div><div className="card"><div className="stat-label">Subtotal</div><div className="detail-value">{money(subtotal)}</div></div><div className="card"><div className="stat-label">Tax</div><div className="detail-value">{money(tax)}</div></div><div className="card"><div className="stat-label">Line Items</div><div className="detail-value">{items.length}</div></div></section>

      <section className="estimate-builder-grid">
        <div className="stacked-column">
          <div className="card"><div className="section-heading"><div><h3 className="section-title">Pricing</h3><p className="muted-copy">Add labor, materials, equipment, allowances, or other items.</p></div></div>
          {items.length ? <div className="table-wrap"><table><thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody>{items.map((item: any) => { const remove = deleteEstimateItem.bind(null, id, item.id); const lineTotal = Number(item.quantity) * Number(item.unit_price); return <tr key={item.id}><td><span className="badge item-category">{item.category}</span></td><td><strong>{item.description}</strong>{item.taxable ? <small className="tax-note">Taxable</small> : null}</td><td>{Number(item.quantity).toLocaleString()}</td><td>{item.unit}</td><td>{money(Number(item.unit_price))}</td><td><strong>{money(lineTotal)}</strong></td><td><form action={remove}><button className="icon-danger" title="Remove item">×</button></form></td></tr> })}</tbody></table></div> : <div className="empty compact-empty">No line items yet.</div>}
          <div className="estimate-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Sales tax ({Number(estimate.sales_tax_rate || 0).toFixed(2)}%)</span><strong>{money(tax)}</strong></div><div className="grand-total"><span>Estimate Total</span><strong>{money(total)}</strong></div></div></div>

          <div className="card stone-estimate-picker">
            <div className="section-heading"><div><span className="settings-kicker">Stone Pricing Library</span><h3 className="section-title">Add Customer Stone Selection</h3><p className="muted-copy">Choose a saved slab and its current estimate price will be added automatically as a material line item.</p></div><Link className="text-link" href="/settings/stone-slabs">Manage pricing</Link></div>
            {stoneSlabs?.length ? <form action={addStoneAction} className="stone-picker-form">
              <div className="field stone-picker-select"><label>Stone Slab</label><select name="stone_slab_id" required defaultValue=""><option value="" disabled>Select stone / color...</option>{stoneSlabs.map((slab: any) => <option key={slab.id} value={slab.id}>{slab.material_type} · {slab.name}{slab.supplier ? ` · ${slab.supplier}` : ''} · {money(Number(slab.estimate_price || 0))}/slab</option>)}</select></div>
              <div className="field"><label>Qty. Slabs</label><input name="quantity" type="number" step="1" min="1" defaultValue="1" /></div>
              <div className="field"><label>Price Override <small>(optional)</small></label><input name="price_override" type="number" min="0" step="0.01" placeholder="Use saved price" /></div>
              <label className="check-field stone-tax-check"><input name="taxable" type="checkbox" /><span>Taxable</span></label>
              <button className="inline-primary stone-add-button" type="submit">+ Add Slab to Estimate</button>
            </form> : <div className="stone-library-empty"><div><strong>No stone pricing saved yet.</strong><p>Add your commonly sold slabs once, then select them here on future estimates.</p></div><Link className="primary-link-button" href="/settings/stone-slabs">Set Up Stone Pricing</Link></div>}
          </div>

          <div className="card"><h3 className="section-title">Add Custom Line Item</h3><p className="muted-copy">Use this for labor, installation materials, allowances, fabrication, or anything not in the stone library.</p><form action={addAction}><div className="form-grid"><div className="field"><label>Category</label><select name="category"><option value="labor">Labor</option><option value="material">Material</option><option value="equipment">Equipment</option><option value="allowance">Allowance</option><option value="other">Other</option></select></div><div className="field"><label>Description</label><input name="description" required placeholder="24x48 porcelain tile installation" /></div></div><div className="line-item-grid"><div className="field"><label>Quantity</label><input name="quantity" type="number" step="0.001" min="0" defaultValue="1" /></div><div className="field"><label>Unit</label><input name="unit" defaultValue="LS" placeholder="SF, LF, EA, LS" /></div><div className="field"><label>Unit price</label><input name="unit_price" type="number" step="0.01" min="0" defaultValue="0" /></div><label className="check-field"><input name="taxable" type="checkbox" /> <span>Taxable</span></label></div><button className="inline-primary" type="submit">+ Add item</button></form></div>
        </div>

        <div className="card estimate-details-card"><h3 className="section-title">Estimate details</h3><form action={updateAction}><div className="field"><label>Status</label><select name="status" defaultValue={estimate.status}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></div><div className="form-grid"><div className="field"><label>Estimate date</label><input type="date" name="estimate_date" defaultValue={estimate.estimate_date} /></div><div className="field"><label>Valid until</label><input type="date" name="valid_until" defaultValue={estimate.valid_until || ''} /></div></div><div className="field"><label>Sales tax rate (%)</label><input name="sales_tax_rate" type="number" min="0" step="0.01" defaultValue={Number(estimate.sales_tax_rate || 0)} /></div><div className="field"><label>Scope of work</label><textarea name="scope" rows={8} defaultValue={estimate.scope || ''} /></div><div className="field"><label>Payment terms</label><textarea name="payment_terms" rows={3} defaultValue={estimate.payment_terms || ''} /></div><div className="field"><label>Exclusions</label><textarea name="exclusions" rows={4} defaultValue={estimate.exclusions || ''} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={3} defaultValue={estimate.notes || ''} /></div><button className="primary-button" type="submit">Save estimate</button></form></div>
      </section>
    </AppShell>
  )
}
