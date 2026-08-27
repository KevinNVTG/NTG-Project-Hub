import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createChangeOrderFromForm } from '../actions'

export default async function NewChangeOrderPage({ searchParams }: { searchParams: Promise<{ contract?: string }> }) {
  const { contract: selectedContract = '' } = await searchParams
  const { supabase } = await requireUser()
  const { data: contracts } = await supabase.from('contracts').select('id,contract_number,client_name,contract_price,projects(project_number,project_name)').neq('status','void').order('created_at', { ascending: false })

  return <AppShell title="New Change Order">
    <div className="page-heading"><div><Link className="eyebrow-link" href="/change-orders">← Change Orders</Link><h2>Create Change Order</h2><p>Select the contract this revision belongs to. Project and customer information will be attached automatically.</p></div></div>
    <div className="card form-card-wide"><form action={createChangeOrderFromForm}><div className="field"><label>Contract</label><select name="contract_id" required defaultValue={selectedContract}><option value="">Select a contract</option>{contracts?.map((c: any) => { const p = Array.isArray(c.projects) ? c.projects[0] : c.projects; return <option key={c.id} value={c.id}>{c.contract_number} · {p?.project_number || ''} · {p?.project_name || c.client_name}</option> })}</select><small className="field-help">The change order will remain permanently linked to this contract.</small></div><button className="primary-button" type="submit">Create Change Order</button></form></div>
  </AppShell>
}
