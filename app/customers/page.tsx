import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCustomer } from './actions'
import { customerDisplayName, customerIndividualNames } from '@/lib/customer-display'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireUser()
  const { q = '' } = await searchParams
  const query = q.trim()

  let request = supabase.from('customers').select('*').order('updated_at', { ascending: false })
  if (query) {
    const safe = query.replace(/[%_,]/g, ' ')
    request = request.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,co_client_first_name.ilike.%${safe}%,co_client_last_name.ilike.%${safe}%,company_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,co_client_email.ilike.%${safe}%,co_client_phone.ilike.%${safe}%`)
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
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Type</th><th>Email</th><th>Phone</th><th></th></tr></thead><tbody>{customers.map((c) => <tr key={c.id}><td><Link className="row-link" href={`/customers/${c.id}`}><strong>{customerDisplayName(c, 'Unnamed customer')}</strong>{c.company_name && customerIndividualNames(c).length ? <small>{customerIndividualNames(c).join(' & ')}</small> : null}</Link></td><td><span className={`badge badge-${c.customer_type}`}>{c.customer_type}</span></td><td>{c.email || '—'}{c.co_client_email ? <small className="contact-secondary">{c.co_client_email}</small> : null}</td><td>{c.phone || '—'}{c.co_client_phone ? <small className="contact-secondary">{c.co_client_phone}</small> : null}</td><td><Link className="text-link" href={`/customers/${c.id}`}>View</Link></td></tr>)}</tbody></table></div>
          ) : <div className="empty">{query ? 'No customers match your search.' : 'No customers yet. Add your first customer.'}</div>}
        </div>

        <form className="card sticky-form" action={createCustomer}>
          <h3 className="section-title">Add customer</h3>
          <div className="field"><label>Customer type</label><select name="customer_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
          <div className="form-grid"><div className="field"><label>Primary client first name</label><input name="first_name" /></div><div className="field"><label>Primary client last name</label><input name="last_name" /></div></div>
          <div className="field"><label>Company <small>(optional)</small></label><input name="company_name" /></div>
          <div className="form-grid"><div className="field"><label>Primary email</label><input name="email" type="email" /></div><div className="field"><label>Primary phone</label><input name="phone" inputMode="tel" /></div></div>
          <div className="co-client-panel"><div className="section-heading"><div><h4>Second client <span className="optional-label">Optional</span></h4><p className="muted-copy">Add a spouse, partner, or co-owner to the same customer record.</p></div></div><div className="form-grid"><div className="field"><label>Second client first name</label><input name="co_client_first_name" /></div><div className="field"><label>Second client last name</label><input name="co_client_last_name" /></div></div><div className="form-grid"><div className="field"><label>Second client email</label><input name="co_client_email" type="email" /></div><div className="field"><label>Second client phone</label><input name="co_client_phone" inputMode="tel" /></div></div></div>
          <div className="field"><label>Billing address</label><textarea name="billing_address" rows={3} /></div>
          <div className="field"><label>Notes</label><textarea name="notes" rows={3} /></div>
          <button className="primary-button" type="submit">Save customer</button>
        </form>
      </section>
    </AppShell>
  )
}
