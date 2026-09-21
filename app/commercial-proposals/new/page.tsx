import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createCommercialProposal } from '../actions'
import { customerDisplayName } from '@/lib/customer-display'

export default async function NewCommercialProposal() {
  const { supabase } = await requireUser()
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id,project_number,project_name,project_type,customers(company_name,first_name,last_name,co_client_first_name,co_client_last_name)')
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
          <p>Start with a project, proposal depth, and pricing basis. Everything remains editable.</p>
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
                const n = customerDisplayName(c, '')
                return (
                  <option key={p.id} value={p.id}>
                    {p.project_number} · {p.project_name}{n ? ` · ${n}` : ''}
                  </option>
                )
              })}
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
              <option value="unit_price">Unit Price</option>
              <option value="cost_plus">Cost Plus Fee</option>
              <option value="gmp">Guaranteed Maximum Price (GMP)</option>
              <option value="not_to_exceed">Not-to-Exceed (NTE)</option>
            </select>
          </div>
          <div className="field proposal-title-field">
            <label>Proposal title</label>
            <input name="title" defaultValue="Commercial Tile & Stone Proposal" />
          </div>
          <button className="primary-button" type="submit">Create Proposal</button>
        </form>
      </div>
    </AppShell>
  )
}
