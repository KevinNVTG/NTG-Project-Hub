import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createProject } from '../actions'

export default async function NewProjectPage() {
  const { supabase, user } = await requireUser()
  const { data: customers } = await supabase.from('customers').select('id,name,company_name').order('name')
  return <AppShell userEmail={user.email || ''}>
    <h1 className="page-title">Create Project</h1><p className="page-subtitle">The project number is assigned automatically when you save.</p>
    <div className="card"><form action={createProject} className="form-grid">
      <div className="field"><label>Customer</label><select name="customer_id"><option value="">Select customer</option>{(customers||[]).map(c=><option value={c.id} key={c.id}>{c.name}{c.company_name ? ` - ${c.company_name}` : ''}</option>)}</select></div>
      <div className="field"><label>Project Name</label><input name="name" required /></div>
      <div className="field full"><label>Project Address</label><input name="project_address" /></div>
      <div className="field"><label>Project Type</label><select name="project_type"><option>Residential</option><option>Commercial</option><option>Service</option></select></div>
      <div className="field"><label>Status</label><select name="status"><option>Lead</option><option>Estimating</option><option>Awarded</option><option>Active</option><option>Complete</option><option>Closed</option></select></div>
      <div className="field"><label>Contract Amount</label><input name="contract_amount" type="number" step="0.01" min="0" defaultValue="0" /></div>
      <div className="field full"><label>Notes</label><textarea name="notes" /></div>
      <div className="full" style={{display:'flex',gap:10}}><button className="btn btn-primary">Create Project</button><a className="btn btn-secondary" href="/projects">Cancel</a></div>
    </form></div>
  </AppShell>
}
