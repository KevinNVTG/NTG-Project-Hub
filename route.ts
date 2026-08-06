import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCustomer } from './actions'

export default async function CustomersPage() {
  const { supabase, user } = await requireUser()
  const { data: customers } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  return <AppShell userEmail={user.email || ''}>
    <h1 className="page-title">Customers</h1><p className="page-subtitle">Store each customer once and reuse their information across projects and documents.</p>
    <div className="card"><form action={createCustomer} className="form-grid">
      <div className="field"><label>Customer Name</label><input name="name" required /></div>
      <div className="field"><label>Company</label><input name="company_name" /></div>
      <div className="field"><label>Email</label><input name="email" type="email" /></div>
      <div className="field"><label>Phone</label><input name="phone" /></div>
      <div className="field full"><label>Billing Address</label><input name="billing_address" /></div>
      <div className="full"><button className="btn btn-primary">Add Customer</button></div>
    </form></div>
    <div className="section-head"><h2>Customer Directory</h2></div>
    <div className="card table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th></tr></thead><tbody>
      {(customers || []).map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.company_name || '-'}</td><td>{c.email || '-'}</td><td>{c.phone || '-'}</td></tr>)}
      {!customers?.length ? <tr><td colSpan={4}>No customers yet.</td></tr> : null}
    </tbody></table></div>
  </AppShell>
}
