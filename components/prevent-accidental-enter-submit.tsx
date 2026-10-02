'use client'

import { useEffect } from 'react'

/**
 * Prevents Enter in ordinary edit inputs from accidentally submitting a POST/server-action form.
 * Users can still use Enter in textareas, click Save/Update buttons normally, and use Enter in
 * GET/search forms. This protects in-progress numeric/text edits from being replaced by stale data.
 */
export function PreventAccidentalEnterSubmit() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.isContentEditable) return
      if (target instanceof HTMLTextAreaElement) return
      if (target instanceof HTMLButtonElement) return

      const isEditableInput = target instanceof HTMLInputElement || target instanceof HTMLSelectElement
      if (!isEditableInput) return

      if (target instanceof HTMLInputElement) {
        const type = (target.type || 'text').toLowerCase()
        if (['submit', 'button', 'reset', 'checkbox', 'radio', 'file'].includes(type)) return
      }

      const form = target.closest('form')
      if (!(form instanceof HTMLFormElement)) return

      // Keep Enter-to-search behavior for normal GET forms.
      if ((form.method || 'get').toLowerCase() === 'get') return

      event.preventDefault()
      event.stopPropagation()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return null
}
