import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

function money(v: number) { return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function total(po: any) { const items=po.purchase_order_items||[]; const subtotal=items.reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0); const taxable=items.filter((i:any)=>i.taxable).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0); return subtotal+taxable*(Number(po.sales_tax_rate||0)/100)+Number(po.shipping||0) }

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireUser()
  let query = supabase.from('purchase_orders').select('id,po_number,status,order_date,shipping,sales_tax_rate,vendors(vendor_name),projects(project_number,project_name),purchase_order_items(quantity,unit_cost,taxable)').order('created_at',{ascending:false})
  if (q.trim()) query = query.ilike('po_number', `%${q.trim()}%`)
  const { data: pos, error } = await query
  if (error) throw new Error(error.message)
  return <AppShell title="Purchase Orders"><div className="page-heading"><div><h2>Purchase Orders</h2><p>Track project purchases, receipts, and committed job costs.</p></div><Link className="primary-link-button" href="/purchase-orders/new">+ New PO</Link></div><div className="card"><form className="search-row"><input name="q" defaultValue={q} placeholder="Search PO number" /><button className="secondary-button">Search</button></form>{pos?.length ? <div className="table-wrap"><table><thead><tr><th>PO</th><th>Project</th><th>Vendor</th><th>Status</th><th>Date</th><th>Total</th><th></th></tr></thead><tbody>{pos.map((po:any)=>{const p=Array.isArray(po.projects)?po.projects[0]:po.projects; const v=Array.isArray(po.vendors)?po.vendors[0]:po.vendors; return <tr key={po.id}><td><strong>{po.po_number}</strong></td><td>{p?.project_number}<small className="table-subline">{p?.project_name}</small></td><td>{v?.vendor_name || 'No vendor'}</td><td><span className={`badge po-status-${po.status}`}>{po.status.replace('_',' ')}</span></td><td>{po.order_date}</td><td><strong>{money(total(po))}</strong></td><td><Link className="text-link" href={`/purchase-orders/${po.id}`}>Open</Link></td></tr>})}</tbody></table></div> : <div className="empty">No purchase orders yet.</div>}</div></AppShell>
}
