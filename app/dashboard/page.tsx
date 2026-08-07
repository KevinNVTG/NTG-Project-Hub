import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatCard } from '@/components/stat-card'
import { requireUser } from '@/lib/auth'

function currency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const [{ count: projectCount }, { count: activeCount }, { count: customerCount }, { data: allValues }, { data: projects }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('contract_amount'),
    supabase.from('projects').select('id,project_number,project_name,status,contract_amount,project_address').order('updated_at', { ascending: false }).limit(6),
  ])
  const contractTotal = allValues?.reduce((sum, p) => sum + Number(p.contract_amount || 0), 0) || 0

  return (
    <AppShell title="Command Center">
      <div className="page-heading"><div><h2>Good morning</h2><p>{user.email} · Here is the current NTG project snapshot.</p></div></div>
      <section className="grid-cards"><StatCard label="Total Projects" value={projectCount ?? 0} /><StatCard label="Active Projects" value={activeCount ?? 0} /><StatCard label="Customers" value={customerCount ?? 0} /><StatCard label="Total Contract Value" value={currency(contractTotal)} /></section>
      <section className="two-column"><div className="card"><div className="section-heading"><h3 className="section-title">Recent projects</h3><Link className="text-link" href="/projects">View all</Link></div>{projects?.length ? <div className="project-list">{projects.map((p) => <Link className="project-list-item" key={p.id} href={`/projects/${p.id}`}><div><strong>{p.project_number} · {p.project_name}</strong><small>{p.project_address || 'No address'}</small></div><div className="project-list-meta"><span className={`badge badge-status-${p.status}`}>{p.status.replace('_', ' ')}</span><strong>{currency(Number(p.contract_amount || 0))}</strong></div></Link>)}</div> : <div className="empty">Create the first project to begin.</div>}</div><div className="card"><h3 className="section-title">Quick actions</h3><div className="quick-grid"><Link className="quick-link" href="/customers">+ New customer</Link><Link className="quick-link" href="/projects">+ New project</Link><span className="quick-link quick-disabled">Create estimate <small>Next sprint</small></span><Link className="quick-link" href="/settings">Company settings</Link></div></div></section>
    </AppShell>
  )
}
