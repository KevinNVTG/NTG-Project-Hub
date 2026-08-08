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
  const [{ data: project }, { data: customers }, { data: activity }, { data: estimates }] = await Promise.all([
    supabase.from('projects').select('*, customers(id,first_name,last_name,company_name,email,phone,billing_address)').eq('id', id).maybeSingle(),
    supabase.from('customers').select('id,first_name,last_name,company_name').order('company_name'),
    supabase.from('activity_logs').select('id,action,details,created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('estimates').select('id,estimate_number,status,estimate_date,estimate_items(quantity,unit_price)').eq('project_id', id).order('created_at', { ascending: false }),
  ])
  if (!project) notFound()
  const c = Array.isArray(project.customers) ? project.customers[0] : project.customers
  const updateAction = updateProject.bind(null, id)

  return (
    <AppShell title="Project">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/projects">← Projects</Link><div className="project-title-line"><h2>{project.project_number}</h2><span className={`badge badge-status-${project.status}`}>{project.status.replace('_', ' ')}</span></div><p>{project.project_name} · {customerName(c)}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/estimates/new?project=${id}`}>+ Estimate</Link><button className="secondary-button" disabled title="Purchase Orders are coming later">+ PO</button><button className="secondary-button" disabled title="Invoices are coming later">+ Invoice</button></div></div>

      <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Contract Value</div><div className="stat-value stat-money">{currency(project.contract_amount)}</div></div><div className="card"><div className="stat-label">Project Type</div><div className="detail-value capitalize">{project.project_type}</div></div><div className="card"><div className="stat-label">Customer</div><div className="detail-value">{customerName(c)}</div></div><div className="card"><div className="stat-label">Project Address</div><div className="detail-value small-detail">{project.project_address || '—'}</div></div></section>

      <div className="project-tabs"><span className="active">Overview</span><span>Documents</span><span>Financials <small>Coming next</small></span><span>Photos <small>Coming later</small></span><span>Activity</span></div>

      <section className="two-column">
        <div className="stacked-column">
          <div className="card"><h3 className="section-title">Project overview</h3><form action={updateAction}><div className="field"><label>Customer</label><select name="customer_id" defaultValue={project.customer_id || ''}><option value="">No customer selected</option>{customers?.map((customer) => <option key={customer.id} value={customer.id}>{customerName(customer)}</option>)}</select></div><div className="field"><label>Project name</label><input name="project_name" required defaultValue={project.project_name} /></div><div className="field"><label>Project address</label><textarea name="project_address" rows={2} defaultValue={project.project_address || ''} /></div><div className="form-grid"><div className="field"><label>Type</label><select name="project_type" defaultValue={project.project_type}><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="field"><label>Status</label><select name="status" defaultValue={project.status}><option value="lead">Lead</option><option value="estimating">Estimating</option><option value="awarded">Awarded</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="complete">Complete</option><option value="closed">Closed</option></select></div></div><div className="field"><label>Contract amount</label><input name="contract_amount" type="number" step="0.01" min="0" defaultValue={Number(project.contract_amount || 0)} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={4} defaultValue={project.notes || ''} /></div><button className="primary-button" type="submit">Save project</button></form></div>
          <div className="card"><div className="section-heading"><h3 className="section-title">Estimates</h3><Link className="text-link" href={`/estimates/new?project=${id}`}>+ New</Link></div>{estimates?.length ? <div className="project-list">{estimates.map((e: any) => { const subtotal = (e.estimate_items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0); return <Link className="project-list-item" key={e.id} href={`/estimates/${e.id}`}><div><strong>{e.estimate_number}</strong><small>{e.estimate_date}</small></div><div className="project-list-meta"><span className={`badge estimate-status-${e.status}`}>{e.status}</span><strong>{currency(subtotal)}</strong></div></Link> })}</div> : <div className="empty compact-empty">No estimates for this project yet.</div>}</div>
          {c ? <div className="card"><h3 className="section-title">Customer contact</h3><div className="contact-grid"><div><span>Email</span><strong>{c.email || '—'}</strong></div><div><span>Phone</span><strong>{c.phone || '—'}</strong></div><div className="wide"><span>Billing address</span><strong>{c.billing_address || '—'}</strong></div></div>{c.id ? <Link className="text-link" href={`/customers/${c.id}`}>Open customer record →</Link> : null}</div> : null}
        </div>

        <div className="card activity-card"><h3 className="section-title">Activity</h3>{activity?.length ? <div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.id}><div className="activity-dot" /><div><strong>{item.action}</strong><small>{new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></div>)}</div> : <div className="empty">Activity will appear as work happens on this project.</div>}</div>
      </section>
    </AppShell>
  )
}
