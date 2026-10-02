import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatCard } from '@/components/stat-card'
import { requireUser } from '@/lib/auth'

function money(v:number|string|null){return Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const [{ data: allProjects }, { count: customerCount }, { count: estimateCount }, { count: proposalCount }] = await Promise.all([
    supabase.from('projects').select('id,project_number,project_name,status,contract_amount,project_type,updated_at').order('updated_at', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('estimates').select('*', { count: 'exact', head: true }),
    supabase.from('commercial_proposals').select('*', { count: 'exact', head: true }),
  ])
  const projects = allProjects ?? []
  const active = projects.filter((p:any)=>p.status==='active')
  const pipeline = projects.filter((p:any)=>['lead','estimating','awarded'].includes(p.status))
  const completed = projects.filter((p:any)=>['complete','closed'].includes(p.status))
  const contractTotal = projects.reduce((sum:number,p:any)=>sum+Number(p.contract_amount||0),0)
  const recent = projects.slice(0,7)

  return (
    <AppShell title="Command Center">
      <div className="page-heading command-heading"><div><div className="page-kicker">Operations overview</div><h2>Command Center</h2><p>{user.email} · Current workload, pipeline, and project value at a glance.</p></div><div className="page-actions"><Link className="inline-primary" href="/projects">New project</Link><Link className="secondary-button" href="/commercial-proposals/new">New proposal</Link></div></div>
      <section className="grid-cards command-kpis">
        <StatCard label="Active Projects" value={active.length} meta={`${projects.length} total projects`} />
        <StatCard label="Preconstruction Pipeline" value={pipeline.length} meta="Lead · Estimating · Awarded" />
        <StatCard label="Recorded Contract Value" value={money(contractTotal)} meta={`${completed.length} completed / closed`} />
        <StatCard label="Customers" value={customerCount ?? 0} meta={`${estimateCount ?? 0} estimates · ${proposalCount ?? 0} commercial proposals`} />
      </section>
      <section className="dashboard-grid">
        <div className="card dashboard-primary"><div className="section-heading"><div><h3 className="section-title">Recent project activity</h3><p className="muted-copy">Most recently updated jobs across the company.</p></div><Link className="text-link" href="/projects">View all projects</Link></div>{recent.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Project</th><th>Type</th><th>Status</th><th className="num-col">Contract Value</th></tr></thead><tbody>{recent.map((p:any)=><tr key={p.id}><td><Link className="row-link" href={`/projects/${p.id}`}><strong>{p.project_number} · {p.project_name}</strong><small>Open project workspace</small></Link></td><td><span className={`badge badge-${p.project_type}`}>{p.project_type}</span></td><td><span className={`badge badge-status-${p.status}`}>{String(p.status).replace('_',' ')}</span></td><td className="num-col"><strong>{money(p.contract_amount)}</strong></td></tr>)}</tbody></table></div>:<div className="empty">No projects yet.</div>}</div>
        <aside className="dashboard-side"><div className="card"><h3 className="section-title">Quick actions</h3><div className="quick-stack"><Link className="quick-link" href="/projects">Create project<span>Start a job record</span></Link><Link className="quick-link" href="/estimates/new">Create estimate<span>Residential / direct-client pricing</span></Link><Link className="quick-link" href="/commercial-proposals/new">Commercial proposal<span>CSI scope and commercial pricing</span></Link><Link className="quick-link" href="/invoices/new">Create invoice<span>Bill a contract or milestone</span></Link></div></div><div className="card operational-note"><div className="stat-label">Operating focus</div><strong>{active.length ? `${active.length} active project${active.length===1?'':'s'}` : 'No active projects'}</strong><p>Keep project status, contract value, and billing records current so the Command Center remains useful for management decisions.</p></div></aside>
      </section>
    </AppShell>
  )
}
