import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function ChangeOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireUser()
  let query = supabase.from('change_orders').select('id,change_order_number,status,revision_date,title,amount,revised_contract_price,contracts(contract_number,client_name),projects(project_number,project_name)').order('created_at', { ascending: false })
  if (q.trim()) query = query.or(`change_order_number.ilike.%${q.trim()}%,title.ilike.%${q.trim()}%`)
  const { data: changeOrders } = await query

  return <AppShell title="Change Orders">
    <div className="page-heading"><div><h2>Change Orders</h2><p>Contract revisions stay linked to the signed contract and automatically update project value when approved.</p></div><Link className="primary-button" href="/change-orders/new">+ New Change Order</Link></div>
    <div className="card"><form className="search-row"><input name="q" defaultValue={q} placeholder="Search change order number or title" /><button className="secondary-button" type="submit">Search</button></form>
    {changeOrders?.length ? <div className="project-list">{changeOrders.map((co: any) => { const contract = Array.isArray(co.contracts) ? co.contracts[0] : co.contracts; const project = Array.isArray(co.projects) ? co.projects[0] : co.projects; return <Link className="project-list-item" key={co.id} href={`/change-orders/${co.id}`}><div><strong>{co.change_order_number} · {co.title}</strong><small>{contract?.contract_number} · {project?.project_number} · {project?.project_name || contract?.client_name || 'Project'}</small></div><div className="project-list-meta"><span className={`badge co-status-${co.status}`}>{co.status}</span><strong>{money(co.amount)}</strong></div></Link> })}</div> : <div className="empty">No change orders yet. Open a contract and choose + Change Order.</div>}</div>
  </AppShell>
}
