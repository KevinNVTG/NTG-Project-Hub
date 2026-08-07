import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createProject } from './actions'

function displayCustomer(c: { first_name?: string | null; last_name?: string | null; company_name?: string | null } | null | undefined) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || '—'
}

function currency(value: number | string | null) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; customer?: string }> }) {
  const { supabase } = await requireUser()
  const { q = '', customer = '' } = await searchParams
  const query = q.trim()

  let projectRequest = supabase.from('projects').select('*, customers(first_name,last_name,company_name)').order('updated_at', { ascending: false })
  if (query) {
    const safe = query.replace(/[%_,]/g, ' ')
    projectRequest = projectRequest.or(`project_number.ilike.%${safe}%,project_name.ilike.%${safe}%,project_address.ilike.%${safe}%`)
  }
  const [{ data: projects, error }, { data: customers }] = await Promise.all([
    projectRequest,
    supabase.from('customers').select('id,first_name,last_name,company_name').order('company_name'),
  ])
  if (error) throw new Error(error.message)

  return (
    <AppShell title="Projects">
      <div className="page-heading"><div><h2>Project workspace</h2><p>Every estimate, contract, PO, invoice, and change order connects to one project.</p></div><form className="search-form" action="/projects"><input name="q" defaultValue={query} placeholder="Search project number, name, address..." /><button className="secondary-button" type="submit">Search</button>{query ? <Link className="text-link" href="/projects">Clear</Link> : null}</form></div>
      <section className="two-column projects-layout">
        <div className="card"><h3 className="section-title">Projects</h3>{projects?.length ? <div className="table-wrap"><table><thead><tr><th>Number</th><th>Project</th><th>Customer</th><th>Status</th><th>Contract</th><th></th></tr></thead><tbody>{projects.map((p) => { const c = Array.isArray(p.customers) ? p.customers[0] : p.customers; return <tr key={p.id}><td><strong>{p.project_number}</strong></td><td><Link className="row-link" href={`/projects/${p.id}`}><strong>{p.project_name}</strong><small>{p.project_address || 'No address'}</small></Link></td><td>{displayCustomer(c)}</td><td><span className={`badge badge-status-${p.status}`}>{p.status.replace('_', ' ')}</span></td><td>{currency(p.contract_amount)}</td><td><Link className="text-link" href={`/projects/${p.id}`}>Open</Link></td></tr> })}</tbody></table></div> : <div className="empty">No projects yet.</div>}</div>
        <form className="card sticky-form" action={createProject}><h3 className="section-title">Create project</h3><div className="field"><label>Customer</label><select name="customer_id" defaultValue={customer}><option value="">No customer selected</option>{customers?.map((c) => <option key={c.id} value={c.id}>{displayCustomer(c)}</option>)}</select></div><div className="field"><label>Project name</label><input name="project_name" required /></div><div className="field"><label>Project address</label><textarea name="project_address" rows={2} /></div><div className="form-grid"><div className="field"><label>Type</label><select name="project_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="field"><label>Status</label><select name="status"><option value="lead">Lead</option><option value="estimating">Estimating</option><option value="awarded">Awarded</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="complete">Complete</option><option value="closed">Closed</option></select></div></div><div className="field"><label>Contract amount</label><input name="contract_amount" type="number" step="0.01" min="0" /></div><div className="field"><label>Notes</label><textarea name="notes" rows={3} /></div><button className="primary-button" type="submit">Create project</button></form>
      </section>
    </AppShell>
  )
}
