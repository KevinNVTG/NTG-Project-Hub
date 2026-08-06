import Image from 'next/image'
import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="login-page">
      <form className="login-card" action={login}>
        <Image className="login-logo" src="/ntg-logo.png" alt="Nevada Tile & Granite" width={110} height={110} priority />
        <h1>NTG Project Hub</h1>
        <p>Nevada Tile & Granite</p>
        {error ? <div className="error">{error}</div> : null}
        <div className="field"><label>Email</label><input name="email" type="email" required autoComplete="email" /></div>
        <div className="field" style={{marginTop: 14}}><label>Password</label><input name="password" type="password" required autoComplete="current-password" /></div>
        <button className="btn btn-primary" style={{width:'100%', marginTop:20}} type="submit">Sign In</button>
      </form>
    </main>
  )
}
