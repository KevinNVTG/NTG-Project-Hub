import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createVendor } from './actions'

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireUser()
  let query = supabase.from('vendors').select('id,vendor_name,contact_name,email,phone,payment_terms').order('vendor_name')
  if (q.trim()) query = query.or(`vendor_name.ilike.%${q.trim()}%,contact_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)
  const { data: vendors, error } = await query
  if (error) throw new Error(error.message)
  return <AppShell title="Vendors">
    <div className="page-heading"><div><h2>Vendor directory</h2><p>Save suppliers once, then reuse them on every purchase order.</p></div><form className="search-form"><input name="q" defaultValue={q} placeholder="Search vendor, contact, email..." /><button className="secondary-button">Search</button></form></div>
    <section className="two-column projects-layout">
      <div className="card"><h3 className="section-title">Vendors</h3>{vendors?.length ? <div className="project-list">{vendors.map((v) => <Link href={`/vendors/${v.id}`} className="project-list-item" key={v.id}><div><strong>{v.vendor_name}</strong><small>{v.contact_name || 'No contact'} · {v.phone || v.email || 'No contact details'}</small></div><div className="project-list-meta"><span>{v.payment_terms || 'Terms not set'}</span></div></Link>)}</div> : <div className="empty">No vendors yet.</div>}</div>
      <form className="card sticky-form" action={createVendor}><h3 className="section-title">Add vendor</h3><div className="field"><label>Vendor name</label><input name="vendor_name" required /></div><div className="field"><label>Contact name</label><input name="contact_name" /></div><div className="form-grid"><div className="field"><label>Email</label><input name="email" type="email" /></div><div className="field"><label>Phone</label><input name="phone" /></div></div><div className="field"><label>Address</label><textarea name="address" rows={2} /></div><div className="field"><label>Payment terms</label><input name="payment_terms" placeholder="Net 30, COD, etc." /></div><div className="field"><label>Notes</label><textarea name="notes" rows={3} /></div><button className="primary-button">Save vendor</button></form>
    </section>
  </AppShell>
}
