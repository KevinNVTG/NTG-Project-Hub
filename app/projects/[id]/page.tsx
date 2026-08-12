import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { updateProject } from '../actions'

function currency(value: number | string | null) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function customerName(c: { first_name?: string | null; last_name?: string | null; company_name?: string | null } | null | undefined) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'No customer'
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const [{ data: project }, { data: customers }, { data: activity }, { data: estimates }, { data: contracts }, { data: purchaseOrders }] = await Promise.all([
    supabase.from('projects').select('*, customers(id,first_name,last_name,company_name,email,phone,billing_address)').eq('id', id).maybeSingle(),
    supabase.from('customers').select('id,first_name,last_name,company_name').order('company_name'),
    supabase.from('activity_logs').select('id,action,details,created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('estimates').select('id,estimate_number,status,estimate_date,estimate_items(quantity,unit_price)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('contracts').select('id,contract_number,status,effective_date,contract_price').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('purchase_orders').select('id,po_number,status,order_date,shipping,sales_tax_rate,purchase_order_items(quantity,unit_cost,taxable),vendors(vendor_name)').eq('project_id', id).order('created_at', { ascending: false }),
  ])
  if (!project) notFound()
  const c = Array.isArray(project.customers) ? project.customers[0] : project.customers
  const updateAction = updateProject.bind(null, id)
  const poTotal = (po: any) => {
    const items = po.purchase_order_items || []
    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0)
    const taxable = items.filter((item: any) => item.taxable).reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0)
    return subtotal + taxable * (Number(po.sales_tax_rate || 0) / 100) + Number(po.shipping || 0)
  }
  const committedCost = (purchaseOrders || []).filter((po: any) => po.status !== 'cancelled').reduce((sum: number, po: any) => sum + poTotal(po), 0)
  const projectedGrossProfit = Number(project.contract_amount || 0) - committedCost

  return (
    <AppShell title="Project">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/projects">← Projects</Link><div className="project-title-line"><h2>{project.project_number}</h2><span className={`badge badge-status-${project.status}`}>{project.status.replace('_', ' ')}</span></div><p>{project.project_name} · {customerName(c)}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/estimates/new?project=${id}`}>+ Estimate</Link><Link className="secondary-button" href="/contracts">Contracts</Link><Link className="secondary-button" href={`/purchase-orders/new?project=${id}`}>+ PO</Link><button className="secondary-button" disabled title="Invoices are coming later">+ Invoice</button></div></div>

      <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Contract Value</div><div className="stat-value stat-money">{currency(project.contract_amount)}</div></div><div className="card"><div className="stat-label">Committed PO Cost</div><div className="stat-value stat-money">{currency(committedCost)}</div></div><div className="card"><div className="stat-label">Projected Gross Profit</div><div className="stat-value stat-money">{currency(projectedGrossProfit)}</div></div><div className="card"><div className="stat-label">Customer</div><div className="detail-value">{customerName(c)}</div></div></section>

      <div className="project-tabs"><span className="active">Overview</span><span>Documents</span><span>Financials</span><span>Photos <small>Coming later</small></span><span>Activity</span></div>

      <section className="two-column">
        <div className="stacked-column">
          <div className="card"><h3 className="section-title">Project overview</h3><form action={updateAction}><div className="field"><label>Customer</label><select name="customer_id" defaultValue={project.customer_id || ''}><option value="">No customer selected</option>{customers?.map((customer) => <option key={customer.id} value={customer.id}>{customerName(customer)}</option>)}</select></div><div className="field"><label>Project name</label><input name="project_name" required defaultValue={project.project_name} /></div><div className="field"><label>Project address</label><textarea name="project_address" rows={2} defaultValue={project.project_address || ''} /></div><div className="form-grid"><div className="field"><label>Type</label><select name="project_type" defaultValue={project.project_type}><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="field"><label>Status</label><select name="status" defaultValue={project.status}><option value="lead">Lead</option><option value="estimating">Estimating</option><option value="awarded">Awarded</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="complete">Complete</option><option value="closed">Closed</option></select></div></div><div className="field"><label>Contract amount</label><input name="contract_amount" type="number" step="0.01" min="0" defaultValue={Number(project.contract_amount || 0)} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={4} defaultValue={project.notes || ''} /></div><button className="primary-button" type="submit">Save project</button></form></div>
          <div className="card"><div className="section-heading"><h3 className="section-title">Estimates</h3><Link className="text-link" href={`/estimates/new?project=${id}`}>+ New</Link></div>{estimates?.length ? <div className="project-list">{estimates.map((e: any) => { const subtotal = (e.estimate_items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0); return <Link className="project-list-item" key={e.id} href={`/estimates/${e.id}`}><div><strong>{e.estimate_number}</strong><small>{e.estimate_date}</small></div><div className="project-list-meta"><span className={`badge estimate-status-${e.status}`}>{e.status}</span><strong>{currency(subtotal)}</strong></div></Link> })}</div> : <div className="empty compact-empty">No estimates for this project yet.</div>}</div><div className="card"><div className="section-heading"><h3 className="section-title">Contracts</h3><Link className="text-link" href="/contracts">View all</Link></div>{contracts?.length ? <div className="project-list">{contracts.map((c: any) => <Link className="project-list-item" key={c.id} href={`/contracts/${c.id}`}><div><strong>{c.contract_number}</strong><small>{c.effective_date}</small></div><div className="project-list-meta"><span className={`badge contract-status-${c.status}`}>{c.status}</span><strong>{currency(c.contract_price)}</strong></div></Link>)}</div> : <div className="empty compact-empty">No contracts yet. Convert an estimate when ready.</div>}</div><div className="card"><div className="section-heading"><h3 className="section-title">Purchase Orders</h3><Link className="text-link" href={`/purchase-orders/new?project=${id}`}>+ New</Link></div>{purchaseOrders?.length ? <div className="project-list">{purchaseOrders.map((po: any) => { const v = Array.isArray(po.vendors) ? po.vendors[0] : po.vendors; return <Link className="project-list-item" key={po.id} href={`/purchase-orders/${po.id}`}><div><strong>{po.po_number}</strong><small>{v?.vendor_name || 'No vendor'} · {po.order_date}</small></div><div className="project-list-meta"><span className={`badge po-status-${po.status}`}>{po.status.replace('_',' ')}</span><strong>{currency(poTotal(po))}</strong></div></Link> })}</div> : <div className="empty compact-empty">No purchase orders yet.</div>}</div>
          {c ? <div className="card"><h3 className="section-title">Customer contact</h3><div className="contact-grid"><div><span>Email</span><strong>{c.email || '—'}</strong></div><div><span>Phone</span><strong>{c.phone || '—'}</strong></div><div className="wide"><span>Billing address</span><strong>{c.billing_address || '—'}</strong></div></div>{c.id ? <Link className="text-link" href={`/customers/${c.id}`}>Open customer record →</Link> : null}</div> : null}
        </div>

        <div className="card activity-card"><h3 className="section-title">Activity</h3>{activity?.length ? <div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.id}><div className="activity-dot" /><div><strong>{item.action}</strong><small>{new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></div>)}</div> : <div className="empty">Activity will appear as work happens on this project.</div>}</div>
      </section>
    </AppShell>
  )
}
