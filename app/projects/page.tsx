import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createProject } from './actions'

export default async function ProjectsPage() {
  const { supabase } = await requireUser()
  const [{ data: projects }, { data: customers }] = await Promise.all([
    supabase.from('projects').select('*, customers(first_name,last_name,company_name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('id,first_name,last_name,company_name').order('company_name'),
  ])
  return (
    <AppShell title="Projects">
      <div className="page-heading"><div><h2>Project workspace</h2><p>Every estimate, contract, PO, invoice, and change order will connect to a project.</p></div></div>
      <section className="two-column">
        <div className="card"><h3 className="section-title">Projects</h3>{projects?.length ? <div className="table-wrap"><table><thead><tr><th>Number</th><th>Project</th><th>Customer</th><th>Status</th><th>Contract</th></tr></thead><tbody>{projects.map((p) => { const c = Array.isArray(p.customers) ? p.customers[0] : p.customers; const customer = c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || '—'; return <tr key={p.id}><td>{p.project_number}</td><td>{p.project_name}</td><td>{customer}</td><td><span className="badge">{p.status}</span></td><td>{Number(p.contract_amount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr> })}</tbody></table></div> : <div className="empty">No projects yet.</div>}</div>
        <form className="card" action={createProject}><h3 className="section-title">Create project</h3><div className="field"><label>Customer</label><select name="customer_id"><option value="">No customer selected</option>{customers?.map((c) => <option key={c.id} value={c.id}>{c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ')}</option>)}</select></div><div className="field"><label>Project name</label><input name="project_name" required /></div><div className="field"><label>Project address</label><textarea name="project_address" rows={2} /></div><div className="form-grid"><div className="field"><label>Type</label><select name="project_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="field"><label>Status</label><select name="status"><option value="lead">Lead</option><option value="estimating">Estimating</option><option value="awarded">Awarded</option><option value="active">Active</option><option value="complete">Complete</option></select></div></div><div className="field"><label>Contract amount</label><input name="contract_amount" type="number" step="0.01" min="0" /></div><div className="field"><label>Notes</label><textarea name="notes" rows={2} /></div><button className="primary-button" type="submit">Create project</button></form>
      </section>
    </AppShell>
  )
}
