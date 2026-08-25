import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { createStoneSlab, deleteStoneSlab, updateStoneSlab } from './actions'

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function StoneSlabPricingPage() {
  const { supabase } = await requireUser()
  const { data: slabs } = await supabase.from('stone_slabs').select('*').order('active', { ascending: false }).order('material_type').order('name')
  const activeCount = (slabs || []).filter((s: any) => s.active).length

  return (
    <AppShell title="Stone Slab Pricing">
      <div className="page-heading">
        <div>
          <Link className="eyebrow-link" href="/settings">← Company Settings</Link>
          <h2>Stone Slab Pricing Library</h2>
          <p>Save customer-facing slab prices once, then add selected slabs directly to an estimate.</p>
        </div>
      </div>

      <section className="grid-cards project-stats slab-stats">
        <div className="card"><div className="stat-label">Slabs Saved</div><div className="stat-value">{slabs?.length || 0}</div></div>
        <div className="card"><div className="stat-label">Active Choices</div><div className="stat-value">{activeCount}</div></div>
        <div className="card slab-help-card"><div className="stat-label">Estimate Integration</div><div className="detail-value small-detail">Active slabs appear automatically inside every Estimate Builder.</div></div>
      </section>

      <section className="card slab-create-card">
        <div className="section-heading"><div><h3 className="section-title">Add Stone Slab</h3><p className="muted-copy">The Estimate Price is what will be inserted into customer estimates. Internal Cost stays in Project Hub for your reference.</p></div></div>
        <form action={createStoneSlab}>
          <div className="slab-form-grid">
            <div className="field"><label>Slab / Color Name</label><input name="name" required placeholder="Calacatta Laza" /></div>
            <div className="field"><label>Material</label><select name="material_type" defaultValue="Quartz"><option>Quartz</option><option>Granite</option><option>Quartzite</option><option>Marble</option><option>Porcelain</option><option>Other</option></select></div>
            <div className="field"><label>Supplier</label><input name="supplier" placeholder="Arizona Tile" /></div>
            <div className="field"><label>Manufacturer / Color</label><input name="color" placeholder="MSI / Calacatta Laza" /></div>
            <div className="field"><label>SKU / Item #</label><input name="sku" placeholder="Optional" /></div>
            <div className="field"><label>Slab Size</label><input name="slab_size" placeholder="126 x 63 in" /></div>
            <div className="field"><label>Estimate Price / Slab</label><input name="estimate_price" type="number" min="0" step="0.01" required placeholder="0.00" /></div>
            <div className="field"><label>Internal Cost / Slab</label><input name="internal_cost" type="number" min="0" step="0.01" placeholder="0.00" /></div>
          </div>
          <div className="field"><label>Notes</label><textarea name="notes" rows={2} placeholder="Finish, thickness, availability, special pricing, etc." /></div>
          <div className="form-actions"><button className="inline-primary" type="submit">+ Save Stone Slab</button></div>
        </form>
      </section>

      <section className="stone-library-grid">
        {(slabs || []).map((slab: any) => {
          const update = updateStoneSlab.bind(null, slab.id)
          const remove = deleteStoneSlab.bind(null, slab.id)
          const margin = Number(slab.estimate_price || 0) - Number(slab.internal_cost || 0)
          return (
            <article className={`card stone-slab-card ${slab.active ? '' : 'stone-slab-inactive'}`} key={slab.id}>
              <div className="stone-slab-heading">
                <div><span className="stone-material-kicker">{slab.material_type}</span><h3>{slab.name}</h3><p>{[slab.supplier, slab.color].filter(Boolean).join(' · ') || 'No supplier details'}</p></div>
                <span className={`badge ${slab.active ? 'badge-status-active' : 'badge-status-closed'}`}>{slab.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="stone-price-strip">
                <div><span>Estimate Price</span><strong>{money(slab.estimate_price)}</strong><small>per slab</small></div>
                <div><span>Internal Cost</span><strong>{money(slab.internal_cost)}</strong><small>per slab</small></div>
                <div><span>Price Spread</span><strong>{money(margin)}</strong><small>per slab</small></div>
              </div>
              <details className="stone-edit-details">
                <summary>Edit slab details</summary>
                <form action={update}>
                  <div className="slab-form-grid compact-slab-grid">
                    <div className="field"><label>Slab / Color Name</label><input name="name" defaultValue={slab.name} required /></div>
                    <div className="field"><label>Material</label><select name="material_type" defaultValue={slab.material_type}><option>Quartz</option><option>Granite</option><option>Quartzite</option><option>Marble</option><option>Porcelain</option><option>Other</option></select></div>
                    <div className="field"><label>Supplier</label><input name="supplier" defaultValue={slab.supplier || ''} /></div>
                    <div className="field"><label>Manufacturer / Color</label><input name="color" defaultValue={slab.color || ''} /></div>
                    <div className="field"><label>SKU / Item #</label><input name="sku" defaultValue={slab.sku || ''} /></div>
                    <div className="field"><label>Slab Size</label><input name="slab_size" defaultValue={slab.slab_size || ''} /></div>
                    <div className="field"><label>Estimate Price / Slab</label><input name="estimate_price" type="number" min="0" step="0.01" defaultValue={Number(slab.estimate_price || 0)} /></div>
                    <div className="field"><label>Internal Cost / Slab</label><input name="internal_cost" type="number" min="0" step="0.01" defaultValue={Number(slab.internal_cost || 0)} /></div>
                  </div>
                  <div className="field"><label>Notes</label><textarea name="notes" rows={2} defaultValue={slab.notes || ''} /></div>
                  <label className="check-field slab-active-check"><input name="active" type="checkbox" defaultChecked={slab.active} /><span>Available for new estimates</span></label>
                  <div className="form-actions"><button className="inline-primary" type="submit">Save Changes</button></div>
                </form>
                <form action={remove} className="stone-delete-form"><button className="danger-button" type="submit">Delete Slab</button></form>
              </details>
            </article>
          )
        })}
        {!slabs?.length ? <div className="card empty">No stone slabs saved yet. Add your first selection above.</div> : null}
      </section>
    </AppShell>
  )
}
