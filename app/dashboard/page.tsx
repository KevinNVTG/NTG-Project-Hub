import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatCard } from '@/components/stat-card'
import { requireUser } from '@/lib/auth'

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const [{ count: projectCount }, { count: customerCount }, { data: projects }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('id, project_number, project_name, status, contract_amount').order('created_at', { ascending: false }).limit(6),
  ])

  const activeCount = projects?.filter((p) => p.status === 'active').length ?? 0
  const contractTotal = projects?.reduce((sum, p) => sum + Number(p.contract_amount ?? 0), 0) ?? 0

  return (
    <AppShell title="Command Center">
      <div className="page-heading"><div><h2>Good morning</h2><p>{user.email} · Here is the current NTG project snapshot.</p></div></div>
      <section className="grid-cards">
        <StatCard label="Total Projects" value={projectCount ?? 0} />
        <StatCard label="Active Projects" value={activeCount} />
        <StatCard label="Customers" value={customerCount ?? 0} />
        <StatCard label="Recent Contract Value" value={contractTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
      </section>
      <section className="two-column">
        <div className="card"><h3 className="section-title">Recent projects</h3>{projects?.length ? <div className="table-wrap"><table><thead><tr><th>Project</th><th>Name</th><th>Status</th><th>Contract</th></tr></thead><tbody>{projects.map((p) => <tr key={p.id}><td>{p.project_number}</td><td>{p.project_name}</td><td><span className="badge">{p.status}</span></td><td>{Number(p.contract_amount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>)}</tbody></table></div> : <div className="empty">Create the first project to begin.</div>}</div>
        <div className="card"><h3 className="section-title">Quick actions</h3><div className="quick-grid"><Link className="quick-link" href="/customers">+ New customer</Link><Link className="quick-link" href="/projects">+ New project</Link><Link className="quick-link" href="/projects">Create estimate</Link><Link className="quick-link" href="/settings">Company settings</Link></div></div>
      </section>
    </AppShell>
  )
}
