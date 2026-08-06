'use client'

import Image from 'next/image'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div>
          <Image className="login-logo" src="/ntg-logo.png" alt="Nevada Tile & Granite" width={170} height={170} priority />
          <h1>NTG Project Hub</h1>
          <p>The internal operating system for Nevada Tile & Granite projects, customers, estimates, contracts, and job financials.</p>
        </div>
        <small>Nevada Tile & Granite · North Las Vegas, Nevada</small>
      </section>
      <section className="login-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="subtle">Sign in with your Nevada Tile & Granite account.</p>
          {error ? <div className="error">{error}</div> : null}
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}
