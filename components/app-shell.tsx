import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const links = [
  ['/dashboard', 'Command Center'],
  ['/customers', 'Customers'],
  ['/projects', 'Projects'],
  ['/estimates', 'Estimates'],
  ['/contracts', 'Contracts'],
  ['/settings', 'Company Settings'],
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
      <aside className="sidebar">
        <div className="brand-row"><Image className="sidebar-logo" src="/ntg-logo.png" alt="NTG" width={58} height={58} /><div><strong>NTG Project Hub</strong><small>Nevada Tile & Granite</small></div></div>
        <nav className="nav">{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <div className="sidebar-footer">C-19 #0093403<br />C-20 #0093447</div>
      </aside>
      <div className="main"><header className="topbar"><h1>{title}</h1><form action={signOut}><button type="submit">Sign out</button></form></header><div className="content">{children}</div></div>
    </div>
  )
}
