import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { addChangeOrderItem, approveChangeOrder, correctApprovedChangeOrder, deleteChangeOrderItem, syncChangeOrderAmountFromItems, updateChangeOrder, updateChangeOrderItem, voidChangeOrder } from '../actions'

function money(value: number | string | null) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function ChangeOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const { supabase } = await requireUser()
  const { data: co } = await supabase
    .from('change_orders')
    .select('*,contracts(id,contract_number,client_name,contract_price,original_contract_price),projects(id,project_number,project_name,project_address),change_order_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (!co) notFound()

  const contract = Array.isArray(co.contracts) ? co.contracts[0] : co.contracts
  const project = Array.isArray(co.projects) ? co.projects[0] : co.projects
  const status = String(co.status || '').toLowerCase()
  // approved_at is also checked so older records remain correct even if their status was edited incorrectly.
  const approved = status === 'approved' || Boolean(co.approved_at)
  const voided = status === 'void' || Boolean(co.voided_at)
  const correctionMode = approved && !voided && query.mode === 'correct'
  const updateAction = updateChangeOrder.bind(null, id)
  const approveAction = approveChangeOrder.bind(null, id)
  const correctionAction = correctApprovedChangeOrder.bind(null, id)
  const voidAction = voidChangeOrder.bind(null, id)
  const mainAction = correctionMode ? correctionAction : updateAction
  const fieldsEditable = !voided && (!approved || correctionMode)
  const items = [...(co.change_order_items || [])].sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  const itemTotal = items.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0)
  const addItemAction = addChangeOrderItem.bind(null, id)
  const syncItemTotalAction = syncChangeOrderAmountFromItems.bind(null, id)

  return <AppShell title="Change Order Builder">
    <div className="page-heading">
      <div>
        <Link className="eyebrow-link" href="/change-orders">← Change Orders</Link>
        <div className="project-title-line">
          <h2>{co.change_order_number}</h2>
          <span className={`badge co-status-${status}`}>{voided ? 'void' : approved ? 'approved' : status}</span>
        </div>
        <p>{contract?.contract_number} · {project?.project_number} · {project?.project_name} · {contract?.client_name}</p>
      </div>
      <div className="quick-actions-inline">
        <Link className="secondary-button" href={`/change-orders/${id}/print`} target="_blank">Print / PDF</Link>
        <Link className="secondary-button" href={`/contracts/${co.contract_id}`}>Open Contract</Link>
        <Link className="secondary-button" href={`/projects/${co.project_id}`}>Open Project</Link>
      </div>
    </div>

    <section className="grid-cards project-stats">
      <div className="card"><div className="stat-label">Contract Before CO</div><div className="stat-value stat-money">{money(co.original_contract_price)}</div></div>
      <div className="card"><div className="stat-label">Change Amount</div><div className="stat-value stat-money">{money(co.amount)}</div></div>
      <div className="card"><div className="stat-label">Revised Contract</div><div className="stat-value stat-money">{money(co.revised_contract_price)}</div></div>
      <div className="card"><div className="stat-label">Revision Date</div><div className="detail-value small-detail">{co.revision_date}</div></div>
    </section>

    {approved && !voided && !correctionMode ? <section className="card" style={{ border: '1px solid #d6b36a', background: '#fffaf0', marginBottom: '18px' }}>
      <div className="section-heading">
        <div>
          <h3 className="section-title">Approved Change Order</h3>
          <p className="muted-copy">This change order has already been applied to the contract. If you entered the wrong amount, scope, date, or wording, use correction mode. Project Hub will adjust the contract only by the difference instead of adding the change order twice.</p>
        </div>
        <Link className="primary-button" href={`/change-orders/${id}?mode=correct#co-editor`}>Correct Approved Change Order</Link>
      </div>
    </section> : null}

    {correctionMode ? <section className="card" style={{ border: '1px solid #d6b36a', background: '#fffaf0', marginBottom: '18px' }}>
      <div className="section-heading">
        <div>
          <h3 className="section-title">Correction Mode</h3>
          <p className="muted-copy">Make the correction below and enter a correction note. The linked contract and project totals will be recalculated automatically.</p>
        </div>
        <Link className="secondary-button" href={`/change-orders/${id}`}>Cancel Correction</Link>
      </div>
    </section> : null}

    {voided ? <div className="approved-lock-banner"><strong>Voided change order</strong><span>This change order is preserved for your records but no longer affects the contract value. Reason: {co.void_reason || 'No reason entered.'}</span></div> : null}

    <section className="change-order-editor-grid" id="co-editor">
      <div className="card">
        <div className="section-heading">
          <div>
            <h3 className="section-title">{correctionMode ? 'Correct approved change order' : 'Change order details'}</h3>
            <p className="muted-copy">{correctionMode ? 'Correct the existing approved record here. Do not create a second change order for a clerical mistake.' : approved ? 'Approved details are read-only until you click Correct Approved Change Order.' : 'Describe exactly what changed. The printed document will use this information.'}</p>
          </div>
        </div>

        <form action={mainAction}>
          <div className="form-grid">
            <div className="field"><label>Status</label><select name="status" defaultValue={approved ? 'approved' : status} disabled={approved || voided}><option value="draft">Draft</option><option value="sent">Sent</option><option value="rejected">Rejected</option>{approved ? <option value="approved">Approved</option> : null}</select></div>
            <div className="field"><label>Revision date</label><input name="revision_date" type="date" defaultValue={co.revision_date} disabled={!fieldsEditable} /></div>
          </div>
          <div className="field"><label>Document title</label><input name="title" defaultValue={co.title || ''} disabled={!fieldsEditable} /></div>
          <div className="field"><label>Reason / purpose of revision</label><textarea name="reason" rows={4} defaultValue={co.reason || ''} placeholder="Explain why the contract is being revised." disabled={!fieldsEditable} /></div>
          <div className="field"><label>Scope revision</label><textarea name="scope_revision" rows={8} defaultValue={co.scope_revision || ''} placeholder="Describe added, removed, or revised work. Quantities, products, locations, and exclusions can be entered here." disabled={!fieldsEditable} /></div>
          <div className="field"><label>Schedule impact</label><textarea name="schedule_impact" rows={4} defaultValue={co.schedule_impact || ''} placeholder="Describe any completion-date or material-delivery impact." disabled={!fieldsEditable} /></div>
          <div className="field"><label>Change order amount</label><input name="amount" type="number" step="0.01" defaultValue={Number(co.amount || 0)} disabled={!fieldsEditable} /><small className="field-help">Use a negative amount for a credit or deduction.</small></div>
          <div className="field"><label>Payment terms for this revision</label><textarea name="payment_terms" rows={4} defaultValue={co.payment_terms || ''} disabled={!fieldsEditable} /></div>

          {correctionMode ? <div className="field" style={{ padding: '16px', border: '1px solid #d6b36a', borderRadius: '12px', background: '#fffaf0' }}>
            <label>Correction note *</label>
            <textarea name="correction_note" rows={3} defaultValue="" placeholder="Example: Corrected change order amount from $6,692.96 to $5,692.96 due to data-entry error." required />
            <small className="field-help">Required. This note is saved to project history and identifies why the approved change order was changed.</small>
          </div> : null}

          {!approved && !voided ? <button className="primary-button" type="submit">Save Change Order</button> : null}
          {correctionMode ? <button className="primary-button" type="submit">Save Approved CO Correction</button> : null}
        </form>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="section-heading">
          <div>
            <h3 className="section-title">Optional labor &amp; material breakdown</h3>
            <p className="muted-copy">Use this when the change order includes a larger added scope, such as a shower remodel. Leave it empty for simple lump-sum change orders.</p>
          </div>
          <div style={{ textAlign: 'right' }}><span className="stat-label">Item total</span><div className="stat-value stat-money">{money(itemTotal)}</div></div>
        </div>

        {items.length ? <div style={{ display: 'grid', gap: '12px', marginBottom: '18px' }}>
          {items.map((item: any) => {
            const updateItemAction = updateChangeOrderItem.bind(null, id, item.id)
            const deleteItemAction = deleteChangeOrderItem.bind(null, id, item.id)
            return <div key={item.id} style={{ border: '1px solid #e4e8ee', borderRadius: '14px', padding: '16px', background: '#fbfcfe' }}>
              <form action={updateItemAction}>
                <div className="form-grid">
                  <div className="field"><label>Category</label><select name="category" defaultValue={item.category} disabled={approved || voided}><option value="labor">Labor</option><option value="material">Material</option><option value="equipment">Equipment</option><option value="allowance">Allowance</option><option value="other">Other</option></select></div>
                  <div className="field"><label>Description</label><input name="description" defaultValue={item.description} disabled={approved || voided} /></div>
                  <div className="field"><label>Quantity</label><input name="quantity" type="number" step="0.001" defaultValue={Number(item.quantity || 0)} disabled={approved || voided} /></div>
                  <div className="field"><label>Unit</label><input name="unit" defaultValue={item.unit || 'LS'} placeholder="SF, LF, EA, LS" disabled={approved || voided} /></div>
                  <div className="field"><label>Unit price</label><input name="unit_price" type="number" step="0.01" defaultValue={Number(item.unit_price || 0)} disabled={approved || voided} /></div>
                  <div className="field"><label>Line total</label><input value={money(item.line_total)} readOnly /></div>
                </div>
                {!approved && !voided ? <div className="quick-actions-inline"><button className="secondary-button" type="submit">Save Line Item</button></div> : null}
              </form>
              {!approved && !voided ? <form action={deleteItemAction} style={{ marginTop: '8px' }}><button className="secondary-button" type="submit">Remove Line Item</button></form> : null}
            </div>
          })}
        </div> : <p className="muted-copy" style={{ marginBottom: '18px' }}>No detailed pricing has been added. The change order can still use the single lump-sum amount above.</p>}

        {!approved && !voided ? <>
          <form action={addItemAction} style={{ borderTop: '1px solid #e4e8ee', paddingTop: '18px' }}>
            <h4 style={{ marginTop: 0 }}>Add line item</h4>
            <div className="form-grid">
              <div className="field"><label>Category</label><select name="category" defaultValue="labor"><option value="labor">Labor</option><option value="material">Material</option><option value="equipment">Equipment</option><option value="allowance">Allowance</option><option value="other">Other</option></select></div>
              <div className="field"><label>Description</label><input name="description" placeholder="Example: Shower waterproofing and tile installation" required /></div>
              <div className="field"><label>Quantity</label><input name="quantity" type="number" step="0.001" defaultValue="1" required /></div>
              <div className="field"><label>Unit</label><input name="unit" defaultValue="LS" placeholder="SF, LF, EA, LS" /></div>
              <div className="field"><label>Unit price</label><input name="unit_price" type="number" step="0.01" defaultValue="0" required /></div>
            </div>
            <button className="secondary-button" type="submit">Add Line Item</button>
          </form>
          {items.length ? <form action={syncItemTotalAction} style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', background: '#f3f6fa' }}>
            <p className="muted-copy" style={{ marginTop: 0 }}>When the detailed items represent the full change-order price, use their total as the official Change Order Amount.</p>
            <button className="primary-button" type="submit">Use {money(itemTotal)} as Change Order Amount</button>
          </form> : null}
        </> : <div className="approved-lock-banner"><strong>Pricing breakdown locked</strong><span>Approved change-order line items are preserved with the approved record.</span></div>}
      </div>

      <div className="card change-order-link-card">
        <h3 className="section-title">Linked contract</h3>
        <div className="change-order-contract-summary">
          <div><span>Contract</span><strong>{contract?.contract_number}</strong></div>
          <div><span>Current contract value</span><strong>{money(contract?.contract_price)}</strong></div>
          <div><span>Project</span><strong>{project?.project_number} · {project?.project_name}</strong></div>
        </div>
        {!approved && !voided && status !== 'rejected' ? <form action={approveAction} className="approve-co-form"><p>Approving this change order will add <strong>{money(co.amount)}</strong> to the current contract value and update the project financials automatically.</p><button className="primary-button" type="submit">Approve & Apply to Contract</button></form> : null}
      </div>

      {!voided ? <div className="card">
        <div className="section-heading"><div><h3 className="section-title">Void change order</h3><p className="muted-copy">Use this only when the entire change order should no longer apply. If it was approved, Project Hub removes its financial effect while preserving the record.</p></div></div>
        <form action={voidAction}><div className="field"><label>Reason for voiding</label><textarea name="void_reason" rows={3} placeholder="Required: explain why this change order is being voided." required /></div><button className="secondary-button" type="submit">Void Change Order</button></form>
      </div> : null}
    </section>
  </AppShell>
}
