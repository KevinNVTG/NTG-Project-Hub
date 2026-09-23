'use client'

import type { KeyboardEvent, ReactNode } from 'react'

export default function EnterKeyGuard({children}:{children:ReactNode}) {
  function stopAccidentalSubmit(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter') return
    const target = event.target as HTMLElement
    const tag = target.tagName.toLowerCase()
    if (tag === 'textarea' || tag === 'button') return
    if (target.getAttribute('role') === 'button') return
    // Commercial Proposal editing uses explicit Save/Add buttons. Prevent Enter
    // inside inputs/selects from submitting a form and reloading stale values.
    if (tag === 'input' || tag === 'select') event.preventDefault()
  }

  return <div onKeyDownCapture={stopAccidentalSubmit}>{children}</div>
}
