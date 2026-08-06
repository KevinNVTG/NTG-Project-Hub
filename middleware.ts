import Image from 'next/image'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Image src="/ntg-logo.png" alt="NTG" width={52} height={52} />
          <div><strong>NTG Project Hub</strong><span>Nevada Tile & Granite</span></div>
        </div>
        <nav className="nav">
          <Link href="/dashboard">Command Center</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar"><strong>Project Hub</strong><div style={{display:'flex',gap:12,alignItems:'center'}}><span style={{color:'#647180'}}>{userEmail}</span><form action={logout}><button className="btn btn-secondary">Sign Out</button></form></div></header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
