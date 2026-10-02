import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreventAccidentalEnterSubmit } from '@/components/prevent-accidental-enter-submit'

const navSections = [
  {
    label: 'Operations',
    links: [
      ['/dashboard', 'Command Center'],
      ['/customers', 'Customers'],
      ['/projects', 'Projects'],
      ['/estimates', 'Estimates'],
      ['/commercial-proposals', 'Commercial Proposals'],
      ['/contracts', 'Contracts'],
      ['/change-orders', 'Change Orders'],
    ],
  },
  {
    label: 'Financial',
    links: [
      ['/invoices', 'Invoices'],
      ['/purchase-orders', 'Purchase Orders'],
      ['/vendors', 'Vendors'],
    ],
  },
  {
    label: 'Administration',
    links: [
      ['/settings', 'Company Settings'],
      ['/settings/stone-slabs', 'Stone Slab Pricing'],
      ['/settings/commercial-proposals', 'Proposal Settings'],
    ],
  },
]

export async function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    const client = await createClient()
    await client.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="app-shell">
      <PreventAccidentalEnterSubmit />
      <aside className="sidebar">
        <div className="brand-row">
          <Image className="sidebar-logo" src="/ntg-logo.png" alt="NTG" width={58} height={58} />
          <div><strong>NTG Project Hub</strong><small>Nevada Tile & Granite</small></div>
        </div>
        <nav className="nav nav-sections">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>Nevada Tile & Granite</strong>
          <span>C-19 #0093403 · C-20 #0093447</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-title"><span>NTG Project Hub</span><h1>{title}</h1></div>
          <div className="topbar-actions"><span className="topbar-user">{user.email}</span><form action={signOut}><button type="submit">Sign out</button></form></div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
