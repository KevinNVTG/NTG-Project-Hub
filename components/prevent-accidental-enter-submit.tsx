'use client'

import { useEffect } from 'react'

/**
 * Makes Enter predictable in edit forms.
 * - Textareas keep normal newline behavior.
 * - Simple forms with exactly one enabled submit control save when Enter is pressed in a text/number input.
 * - Complex forms with multiple submit actions do not auto-submit, preventing the wrong action from firing.
 * In either case, the current typed value is never intentionally discarded.
 */
export function PreventAccidentalEnterSubmit() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target
      if (!(target instanceof HTMLInputElement)) return

      const type = (target.type || 'text').toLowerCase()
      if (['submit', 'button', 'reset', 'checkbox', 'radio', 'file', 'range', 'color'].includes(type)) return

      const form = target.closest('form')
      if (!(form instanceof HTMLFormElement)) return

      // Leave normal GET/search behavior alone.
      if ((form.method || 'get').toLowerCase() === 'get') return

      // Prevent the browser from choosing an arbitrary submit action.
      event.preventDefault()
      event.stopPropagation()

      const submitters = Array.from(
        form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
          'button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled])'
        )
      ).filter((el) => {
        if (el instanceof HTMLButtonElement) return !el.hidden
        return !el.hidden
      })

      // Most edit cards have exactly one Save button. In those forms, Enter should save.
      if (submitters.length === 1) {
        form.requestSubmit(submitters[0])
      }
      // If a form has multiple actions, keep the typed value in place and require an explicit click.
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return null
}
