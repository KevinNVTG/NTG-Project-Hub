import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ProjectCreateForm } from '@/components/project-create-form'
import { requireUser } from '@/lib/auth'
import { customerDisplayName } from '@/lib/customer-display'
import { DeleteProjectButton } from '@/components/delete-project-button'

function currency(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; customer?: string }> }) {
  const { supabase } = await requireUser(); const { q = '', customer = '' } = await searchParams; const query = q.trim()
  let projectRequest = supabase.from('projects').select('*, customers(first_name,last_name,co_client_first_name,co_client_last_name,company_name)').order('updated_at', { ascending: false })
  if (query) { const safe = query.replace(/[%_,]/g, ' '); projectRequest = projectRequest.or(`project_number.ilike.%${safe}%,project_name.ilike.%${safe}%,project_address.ilike.%${safe}%`) }
  const [{ data: projects, error }, { data: customers }] = await Promise.all([projectRequest,supabase.from('customers').select('id,first_name,last_name,co_client_first_name,co_client_last_name,company_name,billing_address').order('company_name')])
  if (error) throw new Error(error.message)
  const customerOptions=(customers||[]).map((item:any)=>({id:item.id,label:customerDisplayName(item,'—'),billing_address:item.billing_address||''}))
  const activeCount=(projects||[]).filter((p:any)=>p.status==='active').length
  const pipelineCount=(projects||[]).filter((p:any)=>['lead','estimating','awarded'].includes(p.status)).length

  return <AppShell title="Projects"><div className="page-heading"><div><div className="page-kicker">Project management</div><h2>Projects</h2><p>Central job records for scope, documents, financials, and status.</p></div><div className="directory-summary"><span><b>{projects?.length??0}</b> records</span><span><b>{activeCount}</b> active</span><span><b>{pipelineCount}</b> pipeline</span></div></div>
    <section className="projects-page"><ProjectCreateForm customers={customerOptions} defaultCustomerId={customer}/><div className="card directory-card"><div className="directory-toolbar"><div><h3 className="section-title">Project directory</h3><p className="muted-copy">Search and open any job workspace.</p></div><form className="search-form" action="/projects"><input name="q" defaultValue={query} placeholder="Search project #, name, or address"/><button className="secondary-button" type="submit">Search</button>{query?<Link className="text-link" href="/projects">Clear</Link>:null}</form></div>{projects?.length?<div className="table-wrap"><table className="data-table project-directory-table"><thead><tr><th>Project</th><th>Customer</th><th>Type</th><th>Status</th><th className="num-col">Contract Value</th><th className="action-col">Actions</th></tr></thead><tbody>{projects.map((p:any)=>{const c=Array.isArray(p.customers)?p.customers[0]:p.customers;return <tr key={p.id}><td><Link className="row-link" href={`/projects/${p.id}`}><strong>{p.project_number} · {p.project_name}</strong><small>{p.project_address||'No jobsite address'}</small></Link></td><td>{customerDisplayName(c,'—')}</td><td><span className={`badge badge-${p.project_type}`}>{p.project_type}</span></td><td><span className={`badge badge-status-${p.status}`}>{String(p.status).replace('_',' ')}</span></td><td className="num-col"><strong>{currency(p.contract_amount)}</strong></td><td><div className="row-actions"><Link className="text-link" href={`/projects/${p.id}`}>Open</Link><DeleteProjectButton projectId={p.id} projectNumber={p.project_number||'Project'} projectName={p.project_name}/></div></td></tr>})}</tbody></table></div>:<div className="empty">No projects yet.</div>}</div></section></AppShell>
}
