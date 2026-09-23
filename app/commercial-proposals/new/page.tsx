import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCommercialProposal } from '../actions'

export default async function NewCommercialProposal() {
  const { supabase } = await requireUser()
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id,project_number,project_name,project_type,customers(company_name,first_name,last_name)')
    .order('created_at', { ascending: false })
  const projects = projectRows ?? []

  const { data: settings } = await supabase
    .from('commercial_proposal_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    <AppShell title="New Commercial Proposal">
      <div className="page-heading">
        <div>
          <Link className="eyebrow-link" href="/commercial-proposals">← Commercial Proposals</Link>
          <h2>Create proposal</h2>
          <p>Start with a project, trade scope, proposal depth, and pricing basis. Tile and stone can be kept as separate CSI work scopes inside one professional proposal.</p>
        </div>
      </div>
      <div className="card proposal-create-card">
        <form action={createCommercialProposal} className="proposal-create-grid">
          <div className="field proposal-project-field">
            <label>Project</label>
            <select name="project_id" required defaultValue="">
              <option value="" disabled>Select a project</option>
              {projects.map((p: any) => {
                const c = Array.isArray(p.customers) ? p.customers[0] : p.customers
                const n = c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ')
                return (
                  <option key={p.id} value={p.id}>
                    {p.project_number} · {p.project_name}{n ? ` · ${n}` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="field">
            <label>Trade scope</label>
            <select name="proposal_scope_type" defaultValue="tile_and_stone">
              <option value="tile_only">Tile only — CSI 09 30 00</option>
              <option value="stone_only">Stone countertops only — CSI 12 36 40</option>
              <option value="tile_and_stone">Tile + stone — separate CSI scopes</option>
            </select>
          </div>
          <div className="field">
            <label>Proposal format</label>
            <select name="template_depth" defaultValue={settings?.default_template_depth || 'standard'}>
              <option value="compact">Compact — small job</option>
              <option value="standard">Standard — typical commercial</option>
              <option value="detailed">Detailed — large / bid package</option>
            </select>
          </div>
          <div className="field">
            <label>Pricing / contract basis</label>
            <select name="pricing_basis" defaultValue={settings?.default_pricing_basis || 'lump_sum'}>
              <option value="lump_sum">Lump Sum / Stipulated Sum</option>
              <option value="time_and_materials">Time & Materials (T&M)</option>
              <option value="hybrid_allowance_tm">Hybrid — Allowances + T&M</option>
              <option value="unit_price">Unit Price</option>
              <option value="cost_plus">Cost Plus Fee</option>
              <option value="gmp">Guaranteed Maximum Price (GMP)</option>
              <option value="not_to_exceed">Not-to-Exceed (NTE)</option>
            </select>
          </div>
          <div className="field proposal-title-field">
            <label>Proposal title</label>
            <input name="title" placeholder="Auto-filled from trade scope if left blank" />
          </div>
          <label className="checkbox-row"><input type="checkbox" name="separate_trade_sheets" defaultChecked /> Start each trade scope on a separate proposal sheet when both tile and stone are included</label>
          <button className="primary-button" type="submit">Create Proposal</button>
        </form>
      </div>
    </AppShell>
  )
}
