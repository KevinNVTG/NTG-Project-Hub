import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { deleteCustomer, updateCustomer } from '../actions'
import { customerDisplayName } from '@/lib/customer-display'

function currency(value: number | string | null) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const [{ data: customer }, { data: projects }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).maybeSingle(),
    supabase.from('projects').select('id,project_number,project_name,status,contract_amount,project_address').eq('customer_id', id).order('created_at', { ascending: false }),
  ])
  if (!customer) notFound()

  const displayName = customerDisplayName(customer, 'Customer')
  const contractTotal = projects?.reduce((sum, p) => sum + Number(p.contract_amount || 0), 0) || 0
  const updateAction = updateCustomer.bind(null, id)
  const deleteAction = deleteCustomer.bind(null, id)

  return (
    <AppShell title="Customer">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/customers">← Customers</Link><h2>{displayName}</h2><p>{customer.customer_type === 'commercial' ? 'Commercial customer' : 'Residential customer'} · {projects?.length ?? 0} project{projects?.length === 1 ? '' : 's'}</p></div><Link className="inline-primary" href={`/projects?customer=${id}`}>+ New project</Link></div>

      <section className="grid-cards customer-stats"><div className="card"><div className="stat-label">Projects</div><div className="stat-value">{projects?.length ?? 0}</div></div><div className="card"><div className="stat-label">Contract Value</div><div className="stat-value stat-money">{currency(contractTotal)}</div></div><div className="card"><div className="stat-label">Email</div><div className="detail-value">{customer.email || '—'}{customer.co_client_email ? <small className="contact-secondary">{customer.co_client_email}</small> : null}</div></div><div className="card"><div className="stat-label">Phone</div><div className="detail-value">{customer.phone || '—'}{customer.co_client_phone ? <small className="contact-secondary">{customer.co_client_phone}</small> : null}</div></div></section>

      <section className="two-column">
        <div className="card"><h3 className="section-title">Project history</h3>{projects?.length ? <div className="project-list">{projects.map((p) => <Link className="project-list-item" key={p.id} href={`/projects/${p.id}`}><div><strong>{p.project_number} · {p.project_name}</strong><small>{p.project_address || 'No project address'}</small></div><div className="project-list-meta"><span className="badge">{p.status.replace('_', ' ')}</span><strong>{currency(p.contract_amount)}</strong></div></Link>)}</div> : <div className="empty">No projects for this customer yet.</div>}</div>

        <div className="card"><h3 className="section-title">Customer details</h3><form action={updateAction}><div className="field"><label>Customer type</label><select name="customer_type" defaultValue={customer.customer_type}><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="form-grid"><div className="field"><label>Primary client first name</label><input name="first_name" defaultValue={customer.first_name || ''} /></div><div className="field"><label>Primary client last name</label><input name="last_name" defaultValue={customer.last_name || ''} /></div></div><div className="field"><label>Company <small>(optional)</small></label><input name="company_name" defaultValue={customer.company_name || ''} /></div><div className="form-grid"><div className="field"><label>Primary email</label><input name="email" type="email" defaultValue={customer.email || ''} /></div><div className="field"><label>Primary phone</label><input name="phone" defaultValue={customer.phone || ''} /></div></div><div className="co-client-panel"><div className="section-heading"><div><h4>Second client <span className="optional-label">Optional</span></h4><p className="muted-copy">Both individuals stay attached to one customer, project, and document history.</p></div></div><div className="form-grid"><div className="field"><label>Second client first name</label><input name="co_client_first_name" defaultValue={customer.co_client_first_name || ''} /></div><div className="field"><label>Second client last name</label><input name="co_client_last_name" defaultValue={customer.co_client_last_name || ''} /></div></div><div className="form-grid"><div className="field"><label>Second client email</label><input name="co_client_email" type="email" defaultValue={customer.co_client_email || ''} /></div><div className="field"><label>Second client phone</label><input name="co_client_phone" defaultValue={customer.co_client_phone || ''} /></div></div></div><div className="field"><label>Billing address</label><textarea name="billing_address" rows={3} defaultValue={customer.billing_address || ''} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={4} defaultValue={customer.notes || ''} /></div><button className="primary-button" type="submit">Save changes</button></form><form className="danger-zone" action={deleteAction}><div><strong>Delete customer</strong><small>Projects remain in NTG Project Hub but will no longer be linked to this customer.</small></div><button className="danger-button" type="submit">Delete</button></form></div>
      </section>
    </AppShell>
  )
}
