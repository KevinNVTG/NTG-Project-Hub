import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const [{ count: projectCount }, { count: customerCount }, { data: recentProjects }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('id, project_number, name, status, contract_amount, customers(name)').order('created_at', { ascending: false }).limit(6),
  ])

  return <AppShell userEmail={user.email || ''}>
    <h1 className="page-title">Command Center</h1>
    <p className="page-subtitle">Your Nevada Tile & Granite operating dashboard.</p>
    <section className="grid stats">
      <div className="card"><div className="stat-label">Active Projects</div><div className="stat-value">{projectCount || 0}</div></div>
      <div className="card"><div className="stat-label">Customers</div><div className="stat-value">{customerCount || 0}</div></div>
      <div className="card"><div className="stat-label">Open Estimates</div><div className="stat-value">0</div></div>
      <div className="card"><div className="stat-label">Outstanding Receivables</div><div className="stat-value">$0</div></div>
    </section>
    <div className="section-head"><h2>Recent Projects</h2><a className="btn btn-primary" href="/projects/new">New Project</a></div>
    <div className="card table-wrap"><table><thead><tr><th>Project</th><th>Customer</th><th>Status</th><th>Contract</th></tr></thead><tbody>
      {(recentProjects || []).map((project: any) => <tr key={project.id}><td><strong>{project.project_number}</strong><br />{project.name}</td><td>{project.customers?.name || '-'}</td><td><span className="badge">{project.status}</span></td><td>${Number(project.contract_amount || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>)}
      {!recentProjects?.length ? <tr><td colSpan={4}>No projects yet. Create the first NTG project.</td></tr> : null}
    </tbody></table></div>
  </AppShell>
}
