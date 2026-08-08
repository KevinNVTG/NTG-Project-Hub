import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

function money(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function customerName(c: any) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'No customer'
}

export default async function EstimatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireUser()
  let query = supabase.from('estimates').select('id,estimate_number,status,estimate_date,valid_until,projects(id,project_number,project_name),customers(first_name,last_name,company_name),estimate_items(quantity,unit_price,taxable)').order('created_at', { ascending: false })
  if (q.trim()) query = query.ilike('estimate_number', `%${q.trim()}%`)
  const { data: estimates } = await query

  return (
    <AppShell title="Estimates">
      <div className="page-heading">
        <div><h2>Estimates</h2><p>Create, price, and track customer estimates.</p></div>
        <Link className="inline-primary" href="/estimates/new">+ New Estimate</Link>
      </div>
      <div className="card">
        <form className="search-form"><input name="q" defaultValue={q} placeholder="Search estimate number..." /><button className="secondary-button">Search</button></form>
        {estimates?.length ? <div className="table-wrap estimate-table"><table><thead><tr><th>Estimate</th><th>Project</th><th>Customer</th><th>Status</th><th>Date</th><th>Total</th></tr></thead><tbody>{estimates.map((e: any) => {
          const items = e.estimate_items || []
          const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0)
          const project = Array.isArray(e.projects) ? e.projects[0] : e.projects
          const customer = Array.isArray(e.customers) ? e.customers[0] : e.customers
          return <tr key={e.id}><td><Link className="row-link" href={`/estimates/${e.id}`}><strong>{e.estimate_number}</strong><small>Open estimate</small></Link></td><td>{project ? `${project.project_number} · ${project.project_name}` : '—'}</td><td>{customerName(customer)}</td><td><span className={`badge estimate-status-${e.status}`}>{e.status}</span></td><td>{e.estimate_date}</td><td><strong>{money(subtotal)}</strong></td></tr>
        })}</tbody></table></div> : <div className="empty">No estimates yet. Create the first estimate.</div>}
      </div>
    </AppShell>
  )
}
