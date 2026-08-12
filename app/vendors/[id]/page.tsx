import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { updateVendor } from '../actions'

function money(v: number | string | null) { return Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function VendorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const [{ data: vendor }, { data: pos }] = await Promise.all([
    supabase.from('vendors').select('*').eq('id', id).maybeSingle(),
    supabase.from('purchase_orders').select('id,po_number,status,order_date,shipping,sales_tax_rate,purchase_order_items(quantity,unit_cost,taxable),projects(project_number,project_name)').eq('vendor_id', id).order('created_at', { ascending: false }),
  ])
  if (!vendor) notFound()
  const action = updateVendor.bind(null, id)
  return <AppShell title="Vendor">
    <div className="page-heading"><div><Link className="eyebrow-link" href="/vendors">← Vendors</Link><h2>{vendor.vendor_name}</h2><p>{vendor.contact_name || 'Vendor record'}</p></div><Link className="primary-link-button" href={`/purchase-orders/new?vendor=${id}`}>+ Purchase Order</Link></div>
    <section className="two-column"><form className="card" action={action}><h3 className="section-title">Vendor details</h3><div className="field"><label>Vendor name</label><input name="vendor_name" defaultValue={vendor.vendor_name} required /></div><div className="field"><label>Contact name</label><input name="contact_name" defaultValue={vendor.contact_name || ''} /></div><div className="form-grid"><div className="field"><label>Email</label><input name="email" type="email" defaultValue={vendor.email || ''} /></div><div className="field"><label>Phone</label><input name="phone" defaultValue={vendor.phone || ''} /></div></div><div className="field"><label>Address</label><textarea name="address" rows={2} defaultValue={vendor.address || ''} /></div><div className="field"><label>Payment terms</label><input name="payment_terms" defaultValue={vendor.payment_terms || ''} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={4} defaultValue={vendor.notes || ''} /></div><button className="primary-button">Save vendor</button></form>
    <div className="card"><h3 className="section-title">Purchase order history</h3>{pos?.length ? <div className="project-list">{pos.map((po: any) => { const p = Array.isArray(po.projects) ? po.projects[0] : po.projects; const subtotal=(po.purchase_order_items||[]).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0); const taxable=(po.purchase_order_items||[]).filter((i:any)=>i.taxable).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0); const total=subtotal+taxable*(Number(po.sales_tax_rate||0)/100)+Number(po.shipping||0); return <Link className="project-list-item" href={`/purchase-orders/${po.id}`} key={po.id}><div><strong>{po.po_number}</strong><small>{p?.project_number} · {p?.project_name || 'Project'} · {po.order_date}</small></div><div className="project-list-meta"><span className={`badge po-status-${po.status}`}>{po.status.replace('_',' ')}</span><strong>{money(total)}</strong></div></Link> })}</div> : <div className="empty">No purchase orders for this vendor.</div>}</div></section>
  </AppShell>
}
