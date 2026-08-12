import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function money(v:number|string|null){return Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}
export default async function PurchaseOrderPrint({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const {supabase}=await requireUser()
  const [{data:po},{data:settings}]=await Promise.all([
    supabase.from('purchase_orders').select('*,vendors(vendor_name,contact_name,email,phone,address),projects(project_number,project_name,project_address),purchase_order_items(*)').eq('id',id).maybeSingle(),
    supabase.from('company_settings').select('*').limit(1).maybeSingle(),
  ])
  if(!po)notFound()
  const project=Array.isArray(po.projects)?po.projects[0]:po.projects; const vendor=Array.isArray(po.vendors)?po.vendors[0]:po.vendors
  const items=[...(po.purchase_order_items||[])].sort((a:any,b:any)=>a.sort_order-b.sort_order)
  const subtotal=items.reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0)
  const taxable=items.filter((i:any)=>i.taxable).reduce((s:number,i:any)=>s+Number(i.quantity||0)*Number(i.unit_cost||0),0)
  const tax=taxable*(Number(po.sales_tax_rate||0)/100); const total=subtotal+tax+Number(po.shipping||0)
  return <main className="po-document"><article className="po-sheet"><header className="po-doc-header"><div className="contract-brand"><Image src="/ntg-logo.png" alt="Nevada Tile & Granite" width={70} height={70}/><div><strong>{settings?.company_name||'Nevada Tile & Granite'}</strong><span>{settings?.address}</span><span>{settings?.phone} · {settings?.email}</span><span>C-19 #{settings?.license_c19} · C-20 #{settings?.license_c20}</span></div></div><div className="contract-doc-title"><span>PURCHASE ORDER</span><strong>{po.po_number}</strong><small>{po.order_date}</small></div></header>
  <section className="po-meta-grid"><div><span>Project</span><strong>{project?.project_number} · {project?.project_name}</strong><p>{project?.project_address||'—'}</p></div><div><span>Vendor</span><strong>{vendor?.vendor_name||'Vendor not selected'}</strong><p>{vendor?.contact_name||''}</p><p>{vendor?.address||''}</p><p>{vendor?.phone||''} {vendor?.email?`· ${vendor.email}`:''}</p></div><div><span>Ship To</span><p className="preline">{po.ship_to_address||project?.project_address||'—'}</p></div></section>
  <section className="po-reference-grid"><div><span>Requested By</span><strong>{po.requested_by||'—'}</strong></div><div><span>Approved By</span><strong>{po.approved_by||'—'}</strong></div><div><span>Requested Delivery</span><strong>{po.requested_delivery_date||'—'}</strong></div><div><span>Vendor Reference</span><strong>{po.vendor_quote_number||'—'}</strong></div></section>
  <table className="po-document-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Amount</th></tr></thead><tbody>{items.map((i:any)=><tr key={i.id}><td>{i.description}</td><td>{Number(i.quantity)}</td><td>{i.unit}</td><td>{money(i.unit_cost)}</td><td>{money(Number(i.quantity)*Number(i.unit_cost))}</td></tr>)}{!items.length?<tr><td colSpan={5}>No line items.</td></tr>:null}</tbody></table>
  <div className="document-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Sales Tax ({Number(po.sales_tax_rate||0)}%)</span><strong>{money(tax)}</strong></div><div><span>Shipping / Freight</span><strong>{money(po.shipping)}</strong></div><div className="document-grand"><span>PO Total</span><strong>{money(total)}</strong></div></div>
  {po.notes?<section className="document-section"><h2>Notes / Special Instructions</h2><p className="preline">{po.notes}</p></section>:null}
  <section className="po-signature-area"><div><span>Authorized By</span></div><div><span>Date</span></div></section><footer>NTG Project Hub · {po.po_number} · {project?.project_number}</footer></article></main>
}
