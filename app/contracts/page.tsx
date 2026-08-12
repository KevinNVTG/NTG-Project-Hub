import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireUser()
  let query = supabase.from('contracts').select('id,contract_number,status,effective_date,contract_price,client_name,projects(project_number,project_name)').order('created_at', { ascending: false })
  if (q.trim()) query = query.or(`contract_number.ilike.%${q.trim()}%,client_name.ilike.%${q.trim()}%`)
  const { data: contracts } = await query

  return <AppShell title="Contracts">
    <div className="page-heading"><div><h2>Residential Contracts</h2><p>Prepare, review, print, and track NTG construction contracts.</p></div></div>
    <div className="card"><form className="search-row"><input name="q" defaultValue={q} placeholder="Search contract number or client" /><button className="secondary-button" type="submit">Search</button></form>
    {contracts?.length ? <div className="project-list">{contracts.map((contract: any) => { const project = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects; return <Link className="project-list-item" key={contract.id} href={`/contracts/${contract.id}`}><div><strong>{contract.contract_number} · {contract.client_name || 'Client'}</strong><small>{project?.project_number} · {project?.project_name || 'Project'} · {contract.effective_date}</small></div><div className="project-list-meta"><span className={`badge contract-status-${contract.status}`}>{contract.status}</span><strong>{money(contract.contract_price)}</strong></div></Link> })}</div> : <div className="empty">Contracts are created from estimates. Open an estimate and choose Convert to Contract.</div>}</div>
  </AppShell>
}
