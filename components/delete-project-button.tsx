'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/app/projects/actions'

type Props = {
  projectId: string
  projectNumber: string
  projectName: string
}

export function DeleteProjectButton({ projectId, projectNumber, projectName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const matches = confirmation.trim().toUpperCase() === projectNumber.trim().toUpperCase()

  function confirmDelete() {
    if (!matches || pending) return
    setError('')
    startTransition(async () => {
      try {
        await deleteProject(projectId)
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete project.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setConfirmation(''); setError(''); setOpen(true) }}
        style={{ border: 0, background: 'transparent', padding: 0, color: '#a32626', fontWeight: 700, cursor: 'pointer' }}
      >
        Delete
      </button>

      {open ? (
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.currentTarget === event.target && !pending) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12, 28, 43, .62)', display: 'grid', placeItems: 'center', padding: 20 }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={`delete-project-${projectId}`} style={{ width: 'min(560px, 100%)', background: '#fff', borderRadius: 14, boxShadow: '0 24px 70px rgba(0,0,0,.28)', padding: 26 }}>
            <h3 id={`delete-project-${projectId}`} style={{ marginTop: 0, color: '#162e42' }}>Permanently delete project?</h3>
            <p style={{ lineHeight: 1.55 }}>
              <strong>{projectNumber} · {projectName}</strong> will be permanently deleted.
            </p>
            <div style={{ background: '#fff4f2', border: '1px solid #efc2ba', borderRadius: 10, padding: 14, margin: '16px 0' }}>
              This also removes records linked to this project, including estimates, contracts, commercial proposals, change orders, purchase orders, invoices, payments, and project activity history. This cannot be undone.
            </div>
            <label htmlFor={`confirm-${projectId}`} style={{ display: 'block', fontWeight: 700, marginBottom: 7 }}>
              Type <strong>{projectNumber}</strong> to confirm
            </label>
            <input
              id={`confirm-${projectId}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              disabled={pending}
              style={{ width: '100%', minHeight: 46, padding: '10px 12px', border: '1px solid #c8d2dc', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}
            />
            {error ? <p style={{ color: '#a32626', fontWeight: 700 }}>{error}</p> : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="secondary-button" type="button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                disabled={!matches || pending}
                onClick={confirmDelete}
                style={{ border: 0, borderRadius: 8, padding: '11px 16px', fontWeight: 800, cursor: matches && !pending ? 'pointer' : 'not-allowed', background: matches && !pending ? '#a32626' : '#d7dde3', color: matches && !pending ? '#fff' : '#6c7883' }}
              >
                {pending ? 'Deleting…' : 'Delete project permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
