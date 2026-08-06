import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCustomer } from './actions'

export default async function CustomersPage() {
  const { supabase } = await requireUser()
  const { data: customers } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  return (
    <AppShell title="Customers">
      <div className="page-heading"><div><h2>Customer directory</h2><p>Store customer details once and reuse them across projects and documents.</p></div></div>
      <section className="two-column">
        <div className="card"><h3 className="section-title">Customers</h3>{customers?.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th></tr></thead><tbody>{customers.map((c) => <tr key={c.id}><td>{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td><td>{c.company_name || '—'}</td><td>{c.email || '—'}</td><td>{c.phone || '—'}</td></tr>)}</tbody></table></div> : <div className="empty">No customers yet.</div>}</div>
        <form className="card" action={createCustomer}><h3 className="section-title">Add customer</h3><div className="field"><label>Customer type</label><select name="customer_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div><div className="form-grid"><div className="field"><label>First name</label><input name="first_name" /></div><div className="field"><label>Last name</label><input name="last_name" /></div></div><div className="field"><label>Company</label><input name="company_name" /></div><div className="form-grid"><div className="field"><label>Email</label><input name="email" type="email" /></div><div className="field"><label>Phone</label><input name="phone" /></div></div><div className="field"><label>Billing address</label><textarea name="billing_address" rows={2} /></div><div className="field"><label>Notes</label><textarea name="notes" rows={2} /></div><button className="primary-button" type="submit">Save customer</button></form>
      </section>
    </AppShell>
  )
}
