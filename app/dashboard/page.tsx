import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatCard } from '@/components/stat-card'
import { requireUser } from '@/lib/auth'

function currency(value: number) { return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const [{ count: activeCount }, { count: customerCount }, { count: openEstimateCount }, { count: contractCount }, { count: openPoCount }, { data: estimates }, { data: purchaseOrders }, { data: projects }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('estimates').select('*', { count: 'exact', head: true }).in('status', ['draft','sent']),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['prepared','sent']),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).in('status', ['draft','issued','partially_received']),
    supabase.from('estimates').select('status,sales_tax_rate,estimate_items(quantity,unit_price,taxable)').in('status', ['draft','sent','accepted']),
    supabase.from('purchase_orders').select('status,shipping,sales_tax_rate,purchase_order_items(quantity,unit_cost,taxable)').neq('status','cancelled'),
    supabase.from('projects').select('id,project_number,project_name,status,contract_amount,project_address').order('updated_at', { ascending: false }).limit(6),
  ])
  const committedPoCost = (purchaseOrders || []).reduce((sum: number, po: any) => {
    const items = po.purchase_order_items || []
    const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_cost || 0), 0)
    const taxable = items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_cost || 0), 0)
    return sum + subtotal + taxable * (Number(po.sales_tax_rate || 0) / 100) + Number(po.shipping || 0)
  }, 0)

  const estimatePipeline = (estimates || []).reduce((sum: number, e: any) => {
    const items = e.estimate_items || []
    const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0)
    const taxable = items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0)
    return sum + subtotal + taxable * (Number(e.sales_tax_rate || 0) / 100)
  }, 0)

  return <AppShell title="Command Center"><div className="page-heading"><div><h2>Good morning</h2><p>{user.email} · Here is the current NTG project snapshot.</p></div></div><section className="grid-cards"><StatCard label="Active Projects" value={activeCount ?? 0} /><StatCard label="Customers" value={customerCount ?? 0} /><StatCard label="Open Estimates" value={openEstimateCount ?? 0} /><StatCard label="Open Contracts" value={contractCount ?? 0} /><StatCard label="Open POs" value={openPoCount ?? 0} /><StatCard label="Committed PO Cost" value={currency(committedPoCost)} /><StatCard label="Estimate Pipeline" value={currency(estimatePipeline)} /></section><section className="two-column"><div className="card"><div className="section-heading"><h3 className="section-title">Recent projects</h3><Link className="text-link" href="/projects">View all</Link></div>{projects?.length ? <div className="project-list">{projects.map((p: any) => <Link className="project-list-item" key={p.id} href={`/projects/${p.id}`}><div><strong>{p.project_number} · {p.project_name}</strong><small>{p.project_address || 'No address'}</small></div><div className="project-list-meta"><span className={`badge badge-status-${p.status}`}>{p.status.replace('_', ' ')}</span><strong>{currency(Number(p.contract_amount || 0))}</strong></div></Link>)}</div> : <div className="empty">Create the first project to begin.</div>}</div><div className="card"><h3 className="section-title">Quick actions</h3><div className="quick-grid"><Link className="quick-link" href="/customers">+ Customer</Link><Link className="quick-link" href="/projects">+ Project</Link><Link className="quick-link" href="/estimates/new">+ Estimate</Link><Link className="quick-link" href="/contracts">Contracts</Link><Link className="quick-link" href="/purchase-orders/new">+ PO</Link><Link className="quick-link" href="/vendors">+ Vendor</Link></div></div></section></AppShell>
}
