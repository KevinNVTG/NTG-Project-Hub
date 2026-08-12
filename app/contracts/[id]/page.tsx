import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { addPaymentMilestone, deletePaymentMilestone, updateContract, updatePaymentMilestone } from '../actions'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: contract } = await supabase.from('contracts').select('*,projects(id,project_number,project_name),estimates(id,estimate_number),contract_payment_milestones(*)').eq('id', id).maybeSingle()
  if (!contract) notFound()
  const project = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
  const estimate = Array.isArray(contract.estimates) ? contract.estimates[0] : contract.estimates
  const milestones = [...(contract.contract_payment_milestones || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const scheduled = milestones.reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0)
  const updateAction = updateContract.bind(null, id)
  const addAction = addPaymentMilestone.bind(null, id)

  return <AppShell title="Contract Builder">
    <div className="page-heading"><div><Link className="eyebrow-link" href="/contracts">← Contracts</Link><div className="project-title-line"><h2>{contract.contract_number}</h2><span className={`badge contract-status-${contract.status}`}>{contract.status}</span></div><p>{project?.project_number} · {project?.project_name} · {contract.client_name}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/contracts/${id}/print`} target="_blank">Print / PDF</Link>{estimate?.id ? <Link className="secondary-button" href={`/estimates/${estimate.id}`}>Source Estimate</Link> : null}{project?.id ? <Link className="secondary-button" href={`/projects/${project.id}`}>Open Project</Link> : null}</div></div>

    <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Contract Price</div><div className="stat-value stat-money">{money(contract.contract_price)}</div></div><div className="card"><div className="stat-label">Scheduled Payments</div><div className="detail-value">{money(scheduled)}</div></div><div className="card"><div className="stat-label">Milestones</div><div className="detail-value">{milestones.length}</div></div><div className="card"><div className="stat-label">Effective Date</div><div className="detail-value small-detail">{contract.effective_date}</div></div></section>

    <section className="contract-builder-grid"><div className="stacked-column">
      <div className="card"><div className="section-heading"><div><h3 className="section-title">Payment schedule</h3><p className="muted-copy">Edit the milestones to match the actual agreement before sending for signature.</p></div></div>
      {milestones.length ? <div className="milestone-list">{milestones.map((m: any) => { const save = updatePaymentMilestone.bind(null, id, m.id); const remove = deletePaymentMilestone.bind(null, id, m.id); return <div className="milestone-editor" key={m.id}><form action={save} className="milestone-form"><div className="field milestone-description"><label>Milestone</label><input name="description" defaultValue={m.description} required /></div><div className="field"><label>%</label><input name="percentage" type="number" min="0" step="0.001" defaultValue={m.percentage ?? ''} /></div><div className="field"><label>Amount</label><input name="amount" type="number" min="0" step="0.01" defaultValue={Number(m.amount || 0)} /></div><button className="secondary-button" type="submit">Save</button></form><form action={remove}><button className="icon-danger" title="Remove milestone">×</button></form></div> })}</div> : <div className="empty compact-empty">No payment milestones yet.</div>}
      <div className={`schedule-balance ${Math.abs(scheduled - Number(contract.contract_price || 0)) < .01 ? 'balanced' : 'unbalanced'}`}><span>Schedule total</span><strong>{money(scheduled)}</strong><small>{Math.abs(scheduled - Number(contract.contract_price || 0)) < .01 ? 'Matches contract price' : `Difference: ${money(Number(contract.contract_price || 0) - scheduled)}`}</small></div></div>

      <div className="card"><h3 className="section-title">Add payment milestone</h3><form action={addAction} className="milestone-form"><div className="field milestone-description"><label>Milestone</label><input name="description" required placeholder="Upon completion of waterproofing" /></div><div className="field"><label>%</label><input name="percentage" type="number" min="0" step="0.001" /></div><div className="field"><label>Amount</label><input name="amount" type="number" min="0" step="0.01" required /></div><button className="inline-primary" type="submit">+ Add</button></form></div>
    </div>

    <div className="card contract-details-card"><h3 className="section-title">Contract details</h3><form action={updateAction}><div className="field"><label>Status</label><select name="status" defaultValue={contract.status}><option value="prepared">Prepared</option><option value="sent">Sent</option><option value="signed">Signed</option><option value="void">Void</option></select></div><div className="field"><label>Effective date</label><input type="date" name="effective_date" defaultValue={contract.effective_date} /></div><div className="field"><label>Client name(s)</label><input name="client_name" defaultValue={contract.client_name || ''} /></div><div className="field"><label>Client address</label><textarea name="client_address" rows={3} defaultValue={contract.client_address || ''} /></div><div className="field"><label>Project address</label><textarea name="project_address" rows={3} defaultValue={contract.project_address || ''} /></div><div className="field"><label>Contract price</label><input name="contract_price" type="number" min="0" step="0.01" defaultValue={Number(contract.contract_price || 0)} /></div><div className="field"><label>Scope of work</label><textarea name="scope" rows={10} defaultValue={contract.scope || ''} /></div><div className="field"><label>Completion date</label><select name="due_date_type" defaultValue={contract.due_date_type}><option value="no_fixed">No fixed completion date</option><option value="fixed">Fixed date</option><option value="other">Other / described below</option></select></div><div className="field"><label>Fixed due date (if applicable)</label><input type="date" name="due_date" defaultValue={contract.due_date || ''} /></div><div className="field"><label>Completion notes</label><textarea name="due_date_notes" rows={3} defaultValue={contract.due_date_notes || ''} /></div><div className="field"><label>Additional terms and conditions</label><textarea name="additional_terms" rows={5} defaultValue={contract.additional_terms || ''} /></div><button className="primary-button" type="submit">Save contract</button></form></div></section>
  </AppShell>
}
