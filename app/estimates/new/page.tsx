import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createEstimate } from '../actions'

function customerName(c: any) {
  return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'No customer'
}

export default async function NewEstimatePage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: selectedProject = '' } = await searchParams
  const { supabase } = await requireUser()
  const { data: projects } = await supabase.from('projects').select('id,project_number,project_name,customers(first_name,last_name,company_name)').order('created_at', { ascending: false })
  const today = new Date()
  const valid = new Date(today)
  valid.setDate(valid.getDate() + 30)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  return (
    <AppShell title="New Estimate">
      <div className="page-heading"><div><Link className="eyebrow-link" href="/estimates">← Estimates</Link><h2>Create Estimate</h2><p>Start with the project details. Line items are added after saving.</p></div></div>
      <div className="card form-card wide-form-card"><form action={createEstimate}>
        <div className="field"><label>Project</label><select name="project_id" required defaultValue={selectedProject}><option value="">Select a project</option>{projects?.map((p: any) => { const c = Array.isArray(p.customers) ? p.customers[0] : p.customers; return <option key={p.id} value={p.id}>{p.project_number} · {p.project_name} · {customerName(c)}</option> })}</select></div>
        <div className="form-grid"><div className="field"><label>Estimate date</label><input type="date" name="estimate_date" defaultValue={iso(today)} /></div><div className="field"><label>Valid until</label><input type="date" name="valid_until" defaultValue={iso(valid)} /></div></div>
        <div className="field"><label>Scope of work</label><textarea name="scope" rows={6} placeholder="Describe the work included in this estimate..." /></div>
        <div className="form-grid"><div className="field"><label>Sales tax rate (%)</label><input name="sales_tax_rate" type="number" min="0" step="0.01" defaultValue="0" /></div><div className="field"><label>Payment terms</label><input name="payment_terms" placeholder="Example: 25% deposit, progress payments..." /></div></div>
        <div className="field"><label>Exclusions</label><textarea name="exclusions" rows={3} placeholder="Owner-supplied materials, plumbing, electrical, permits, etc." /></div>
        <div className="field"><label>Notes</label><textarea name="notes" rows={3} /></div>
        <div className="form-actions"><Link className="secondary-button" href="/estimates">Cancel</Link><button className="inline-primary" type="submit">Create estimate</button></div>
      </form></div>
    </AppShell>
  )
}
