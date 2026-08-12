import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createPurchaseOrder } from '../actions'

export default async function NewPurchaseOrder({ searchParams }: { searchParams: Promise<{ project?: string; vendor?: string }> }) {
  const { project = '', vendor = '' } = await searchParams
  const { supabase, user } = await requireUser()
  const [{ data: projects }, { data: vendors }] = await Promise.all([
    supabase.from('projects').select('id,project_number,project_name,project_address').order('project_number',{ascending:false}),
    supabase.from('vendors').select('id,vendor_name').order('vendor_name'),
  ])
  const selectedProject = projects?.find((p)=>p.id===project)
  return <AppShell title="New Purchase Order"><div className="page-heading"><div><Link className="eyebrow-link" href="/purchase-orders">← Purchase Orders</Link><h2>Create purchase order</h2><p>Start the PO, then add detailed line items on the next screen.</p></div></div><form className="card form-card-narrow" action={createPurchaseOrder}><div className="field"><label>Project</label><select name="project_id" defaultValue={project} required><option value="">Select project</option>{projects?.map(p=><option key={p.id} value={p.id}>{p.project_number} · {p.project_name}</option>)}</select></div><div className="field"><label>Vendor</label><select name="vendor_id" defaultValue={vendor}><option value="">Select vendor</option>{vendors?.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select><small className="field-help">Need a new supplier? Add it under Vendors first.</small></div><div className="form-grid"><div className="field"><label>Order date</label><input name="order_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div><div className="field"><label>Requested delivery</label><input name="requested_delivery_date" type="date" /></div></div><div className="form-grid"><div className="field"><label>Vendor quote / reference</label><input name="vendor_quote_number" /></div><div className="field"><label>Requested by</label><input name="requested_by" defaultValue={user.email || ''} /></div></div><div className="field"><label>Ship to</label><textarea name="ship_to_address" rows={2} defaultValue={selectedProject?.project_address || ''} /></div><div className="form-grid"><div className="field"><label>Sales tax %</label><input name="sales_tax_rate" type="number" min="0" step="0.0001" defaultValue="0" /></div><div className="field"><label>Shipping / freight</label><input name="shipping" type="number" min="0" step="0.01" defaultValue="0" /></div></div><div className="field"><label>Notes / special instructions</label><textarea name="notes" rows={4} /></div><button className="primary-button">Create PO</button></form></AppShell>
}
