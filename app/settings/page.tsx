import Image from 'next/image'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

export default async function SettingsPage() {
  const { supabase } = await requireUser()
  const { data: settings } = await supabase.from('company_settings').select('*').limit(1).maybeSingle()
  return (
    <AppShell title="Company Settings">
      <div className="page-heading"><div><h2>Nevada Tile & Granite</h2><p>Default company information used throughout NTG Project Hub.</p></div></div>
      <div className="card form-card"><div className="brand-row" style={{ color: '#16212a' }}><Image src="/ntg-logo.png" alt="NTG logo" width={90} height={90} style={{ objectFit: 'contain' }} /><div><strong style={{ fontSize: 24 }}>{settings?.company_name ?? 'Nevada Tile & Granite'}</strong><small style={{ color: '#667784' }}>Project Hub company profile</small></div></div><div className="form-grid"><div className="field"><label>Phone</label><input readOnly value={settings?.phone ?? '(725) 275-7145'} /></div><div className="field"><label>Email</label><input readOnly value={settings?.email ?? 'kevin@nevadatileandgranite.com'} /></div><div className="field"><label>Website</label><input readOnly value={settings?.website ?? 'nevadatileandgranite.com'} /></div><div className="field"><label>Address</label><input readOnly value={settings?.address ?? '1404 E Webb Ave, North Las Vegas, NV 89030'} /></div><div className="field"><label>C-19 License</label><input readOnly value={settings?.license_c19 ?? '0093403'} /></div><div className="field"><label>C-20 License</label><input readOnly value={settings?.license_c20 ?? '0093447'} /></div></div></div>
    </AppShell>
  )
}
