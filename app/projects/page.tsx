import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ProjectCreateForm } from '@/components/project-create-form'
import { requireUser } from '@/lib/auth'
import { customerDisplayName } from '@/lib/customer-display'

function currency(value: number | string | null) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; customer?: string }> }) {
  const { supabase } = await requireUser()
  const { q = '', customer = '' } = await searchParams
  const query = q.trim()

  let projectRequest = supabase
    .from('projects')
    .select('*, customers(first_name,last_name,co_client_first_name,co_client_last_name,company_name)')
    .order('updated_at', { ascending: false })

  if (query) {
    const safe = query.replace(/[%_,]/g, ' ')
    projectRequest = projectRequest.or(`project_number.ilike.%${safe}%,project_name.ilike.%${safe}%,project_address.ilike.%${safe}%`)
  }

  const [{ data: projects, error }, { data: customers }] = await Promise.all([
    projectRequest,
    supabase
      .from('customers')
      .select('id,first_name,last_name,co_client_first_name,co_client_last_name,company_name,billing_address')
      .order('company_name'),
  ])

  if (error) throw new Error(error.message)

  const customerOptions = (customers || []).map((item) => ({
    id: item.id,
    label: customerDisplayName(item, '—'),
    billing_address: item.billing_address || '',
  }))

  return (
    <AppShell title="Projects">
      <div className="page-heading">
        <div>
          <h2>Project workspace</h2>
          <p>Every estimate, contract, PO, invoice, and change order connects to one project.</p>
        </div>
        <form className="search-form" action="/projects">
          <input name="q" defaultValue={query} placeholder="Search project number, name, address..." />
          <button className="secondary-button" type="submit">Search</button>
          {query ? <Link className="text-link" href="/projects">Clear</Link> : null}
        </form>
      </div>

      <section className="two-column projects-layout">
        <div className="card">
          <h3 className="section-title">Projects</h3>
          {projects?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Number</th><th>Project</th><th>Customer</th><th>Status</th><th>Contract</th><th></th></tr></thead>
                <tbody>
                  {projects.map((p) => {
                    const c = Array.isArray(p.customers) ? p.customers[0] : p.customers
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.project_number}</strong></td>
                        <td><Link className="row-link" href={`/projects/${p.id}`}><strong>{p.project_name}</strong><small>{p.project_address || 'No address'}</small></Link></td>
                        <td>{customerDisplayName(c, '—')}</td>
                        <td><span className={`badge badge-status-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                        <td>{currency(p.contract_amount)}</td>
                        <td><Link className="text-link" href={`/projects/${p.id}`}>Open</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="empty">No projects yet.</div>}
        </div>

        <ProjectCreateForm customers={customerOptions} defaultCustomerId={customer} />
      </section>
    </AppShell>
  )
}
