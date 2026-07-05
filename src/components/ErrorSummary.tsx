import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { useErrorSummary } from '../store/useFormStore'
import { fieldId } from './fields/fieldHelpers'
import { linkClass } from './styles'

interface ErrorSummaryProps {
  items: NormalizedItem[]
  // Incremented by the form on every failed submit; moves focus to the heading
  focusTick: number
}

function focusField(linkId: string): void {
  const container = document.getElementById(fieldId(linkId))
  if (container === null) return
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(
      'input, textarea, select, button, [tabindex]',
    ),
  )
  const target = candidates.find(
    (element) =>
      element.tabIndex >= 0 && element.closest('[aria-hidden="true"]') === null,
  )
  ;(target ?? container).focus()
}

export function ErrorSummary({
  items,
  focusTick,
}: ErrorSummaryProps): ReactElement | null {
  const errors = useErrorSummary()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusTick > 0) headingRef.current?.focus()
  }, [focusTick])

  const textById = useMemo(() => {
    const map = new Map<string, string>()
    const visit = (list: NormalizedItem[]): void => {
      for (const item of list) {
        map.set(item.linkId, item.text ?? item.linkId)
        visit(item.children)
      }
    }
    visit(items)
    return map
  }, [items])

  if (errors.length === 0) return null

  const byField: { linkId: string; message: string }[] = []
  const seen = new Set<string>()
  for (const error of errors) {
    if (seen.has(error.linkId)) continue
    seen.add(error.linkId)
    byField.push(error)
  }

  return (
    <section
      aria-labelledby="error-summary-heading"
      className="rounded border-2 border-red-700 p-4"
    >
      <h2
        id="error-summary-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold text-red-700"
      >
        There is a problem
      </h2>
      <ul className="mt-2 space-y-1">
        {byField.map(({ linkId, message }) => (
          <li key={linkId}>
            <a
              href={`#${fieldId(linkId)}`}
              onClick={(event) => {
                event.preventDefault()
                focusField(linkId)
              }}
              className={linkClass}
            >
              {textById.get(linkId) ?? linkId}: {message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
