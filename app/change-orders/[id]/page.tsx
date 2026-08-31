import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { approveChangeOrder, correctApprovedChangeOrder, updateChangeOrder, voidChangeOrder } from '../actions'

function money(value: number | string | null) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default async function ChangeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: co } = await supabase.from('change_orders').select('*,contracts(id,contract_number,client_name,contract_price,original_contract_price),projects(id,project_number,project_name,project_address)').eq('id', id).maybeSingle()
  if (!co) notFound()
  const contract = Array.isArray(co.contracts) ? co.contracts[0] : co.contracts
  const project = Array.isArray(co.projects) ? co.projects[0] : co.projects
  const updateAction = updateChangeOrder.bind(null, id)
  const approveAction = approveChangeOrder.bind(null, id)
  const correctionAction = correctApprovedChangeOrder.bind(null, id)
  const voidAction = voidChangeOrder.bind(null, id)
  const approved = co.status === 'approved'
  const voided = co.status === 'void'
  const editable = !voided
  const mainAction = approved ? correctionAction : updateAction

  return <AppShell title="Change Order Builder">
    <div className="page-heading"><div><Link className="eyebrow-link" href="/change-orders">← Change Orders</Link><div className="project-title-line"><h2>{co.change_order_number}</h2><span className={`badge co-status-${co.status}`}>{co.status}</span></div><p>{contract?.contract_number} · {project?.project_number} · {project?.project_name} · {contract?.client_name}</p></div><div className="quick-actions-inline"><Link className="secondary-button" href={`/change-orders/${id}/print`} target="_blank">Print / PDF</Link><Link className="secondary-button" href={`/contracts/${co.contract_id}`}>Open Contract</Link><Link className="secondary-button" href={`/projects/${co.project_id}`}>Open Project</Link></div></div>

    <section className="grid-cards project-stats"><div className="card"><div className="stat-label">Contract Before CO</div><div className="stat-value stat-money">{money(co.original_contract_price)}</div></div><div className="card"><div className="stat-label">Change Amount</div><div className="stat-value stat-money">{money(co.amount)}</div></div><div className="card"><div className="stat-label">Revised Contract</div><div className="stat-value stat-money">{money(co.revised_contract_price)}</div></div><div className="card"><div className="stat-label">Revision Date</div><div className="detail-value small-detail">{co.revision_date}</div></div></section>

    {approved ? <div className="approved-lock-banner"><strong>Approved change order</strong><span>You can now correct clerical mistakes. Saving a correction adjusts the linked contract only by the difference between the old and new amount, so it will not double-count the change order.</span></div> : null}
    {voided ? <div className="approved-lock-banner"><strong>Voided change order</strong><span>This change order is preserved for your records but no longer affects the contract value. Reason: {co.void_reason || 'No reason entered.'}</span></div> : null}

    <section className="change-order-editor-grid"><div className="card"><div className="section-heading"><div><h3 className="section-title">{approved ? 'Correct approved change order' : 'Change order details'}</h3><p className="muted-copy">{approved ? 'Use this only to correct a mistake in an approved change order. The project and contract totals will be recalculated automatically.' : 'Describe exactly what changed. The printed document will use this information.'}</p></div></div><form action={mainAction}>
      <div className="form-grid"><div className="field"><label>Status</label><select name="status" defaultValue={co.status} disabled={approved || voided}><option value="draft">Draft</option><option value="sent">Sent</option><option value="rejected">Rejected</option><option value="void">Void</option>{approved ? <option value="approved">Approved</option> : null}</select></div><div className="field"><label>Revision date</label><input name="revision_date" type="date" defaultValue={co.revision_date} disabled={!editable} /></div></div>
      <div className="field"><label>Document title</label><input name="title" defaultValue={co.title || ''} disabled={!editable} /></div>
      <div className="field"><label>Reason / purpose of revision</label><textarea name="reason" rows={4} defaultValue={co.reason || ''} placeholder="Explain why the contract is being revised." disabled={!editable} /></div>
      <div className="field"><label>Scope revision</label><textarea name="scope_revision" rows={8} defaultValue={co.scope_revision || ''} placeholder="Describe added, removed, or revised work. Quantities, products, locations, and exclusions can be entered here." disabled={!editable} /></div>
      <div className="field"><label>Schedule impact</label><textarea name="schedule_impact" rows={4} defaultValue={co.schedule_impact || ''} placeholder="Describe any completion-date or material-delivery impact." disabled={!editable} /></div>
      <div className="field"><label>Change order amount</label><input name="amount" type="number" step="0.01" defaultValue={Number(co.amount || 0)} disabled={!editable} /><small className="field-help">Use a negative amount for a credit or deduction.</small></div>
      <div className="field"><label>Payment terms for this revision</label><textarea name="payment_terms" rows={4} defaultValue={co.payment_terms || ''} disabled={!editable} /></div>
      {approved ? <div className="field"><label>Correction note</label><textarea name="correction_note" rows={3} defaultValue="" placeholder="Required: briefly explain what was incorrect and what you corrected." required /><small className="field-help">This note is saved to the project activity history.</small></div> : null}
      {editable ? <button className="primary-button" type="submit">{approved ? 'Save Approved CO Correction' : 'Save Change Order'}</button> : null}
    </form></div>

    <div className="card change-order-link-card"><h3 className="section-title">Linked contract</h3><div className="change-order-contract-summary"><div><span>Contract</span><strong>{contract?.contract_number}</strong></div><div><span>Current contract value</span><strong>{money(contract?.contract_price)}</strong></div><div><span>Project</span><strong>{project?.project_number} · {project?.project_name}</strong></div></div>{!approved && !voided && co.status !== 'rejected' ? <form action={approveAction} className="approve-co-form"><p>Approving this change order will add <strong>{money(co.amount)}</strong> to the current contract value and update the project financials automatically.</p><button className="primary-button" type="submit">Approve & Apply to Contract</button></form> : null}</div>

    {!voided ? <div className="card"><div className="section-heading"><div><h3 className="section-title">Void change order</h3><p className="muted-copy">Use this if the change order should no longer apply. If it was already approved, Project Hub removes its amount from the current contract and project value while keeping the record in history.</p></div></div><form action={voidAction}><div className="field"><label>Reason for voiding</label><textarea name="void_reason" rows={3} placeholder="Required: explain why this change order is being voided." required /></div><button className="secondary-button" type="submit">Void Change Order</button></form></div> : null}
    </section>
  </AppShell>
}
