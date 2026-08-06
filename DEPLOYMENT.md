import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

export default async function ProjectsPage() {
  const { supabase, user } = await requireUser()
  const { data: projects } = await supabase.from('projects').select('*, customers(name)').order('created_at', { ascending: false })
  return <AppShell userEmail={user.email || ''}>
    <div className="section-head" style={{marginTop:0}}><div><h1 className="page-title">Projects</h1><p className="page-subtitle">Every estimate, contract, PO, invoice, and change order will connect to one project.</p></div><a href="/projects/new" className="btn btn-primary">New Project</a></div>
    <div className="card table-wrap"><table><thead><tr><th>Project #</th><th>Project</th><th>Customer</th><th>Type</th><th>Status</th><th>Contract</th></tr></thead><tbody>
      {(projects || []).map((p:any) => <tr key={p.id}><td><strong>{p.project_number}</strong></td><td>{p.name}<br /><span style={{color:'#647180'}}>{p.project_address || ''}</span></td><td>{p.customers?.name || '-'}</td><td>{p.project_type}</td><td><span className="badge">{p.status}</span></td><td>${Number(p.contract_amount || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>)}
      {!projects?.length ? <tr><td colSpan={6}>No projects yet.</td></tr> : null}
    </tbody></table></div>
  </AppShell>
}
