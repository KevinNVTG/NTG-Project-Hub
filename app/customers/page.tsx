import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCustomer } from './actions'

function customerName(customer: { first_name: string | null; last_name: string | null; company_name: string | null }) {
  return customer.company_name || [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unnamed customer'
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireUser()
  const { q = '' } = await searchParams
  const query = q.trim()

  let request = supabase.from('customers').select('*').order('updated_at', { ascending: false })
  if (query) {
    const safe = query.replace(/[%_,]/g, ' ')
    request = request.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }
  const { data: customers, error } = await request
  if (error) throw new Error(error.message)

  return (
    <AppShell title="Customers">
      <div className="page-heading">
        <div><h2>Customer directory</h2><p>Store customer information once and reuse it across every project and document.</p></div>
        <form className="search-form" action="/customers"><input name="q" defaultValue={query} placeholder="Search name, company, email, phone..." /><button className="secondary-button" type="submit">Search</button>{query ? <Link className="text-link" href="/customers">Clear</Link> : null}</form>
      </div>

      <section className="two-column customers-layout">
        <div className="card">
          <div className="section-heading"><div><h3 className="section-title">Customers</h3><p className="muted-copy">{customers?.length ?? 0} record{customers?.length === 1 ? '' : 's'}</p></div></div>
          {customers?.length ? (
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Type</th><th>Email</th><th>Phone</th><th></th></tr></thead><tbody>{customers.map((c) => <tr key={c.id}><td><Link className="row-link" href={`/customers/${c.id}`}><strong>{customerName(c)}</strong>{c.company_name && (c.first_name || c.last_name) ? <small>{[c.first_name, c.last_name].filter(Boolean).join(' ')}</small> : null}</Link></td><td><span className={`badge badge-${c.customer_type}`}>{c.customer_type}</span></td><td>{c.email || '—'}</td><td>{c.phone || '—'}</td><td><Link className="text-link" href={`/customers/${c.id}`}>View</Link></td></tr>)}</tbody></table></div>
          ) : <div className="empty">{query ? 'No customers match your search.' : 'No customers yet. Add your first customer.'}</div>}
        </div>

        <form className="card sticky-form" action={createCustomer}>
          <h3 className="section-title">Add customer</h3>
          <div className="field"><label>Customer type</label><select name="customer_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
          <div className="form-grid"><div className="field"><label>First name</label><input name="first_name" /></div><div className="field"><label>Last name</label><input name="last_name" /></div></div>
          <div className="field"><label>Company</label><input name="company_name" /></div>
          <div className="form-grid"><div className="field"><label>Email</label><input name="email" type="email" /></div><div className="field"><label>Phone</label><input name="phone" inputMode="tel" /></div></div>
          <div className="field"><label>Billing address</label><textarea name="billing_address" rows={3} /></div>
          <div className="field"><label>Notes</label><textarea name="notes" rows={3} /></div>
          <button className="primary-button" type="submit">Save customer</button>
        </form>
      </section>
    </AppShell>
  )
}
