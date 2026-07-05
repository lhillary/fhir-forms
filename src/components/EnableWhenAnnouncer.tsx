import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { useFormStore } from '../store/useFormStore'

interface EnableWhenAnnouncerProps {
  items: NormalizedItem[]
}

function phrase(count: number, verb: string): string {
  return `${count} ${count === 1 ? 'question' : 'questions'} ${verb}`
}

// Polite live region so screen-reader users hear when enableWhen adds or
// removes fields. The delta is the set difference between the store's
// enabledSet on consecutive renders, counted over announceable (non-group,
// non-hidden) items; the first observed set is only recorded, so mounting a
// freshly hydrated form announces nothing.
export function EnableWhenAnnouncer({
  items,
}: EnableWhenAnnouncerProps): ReactElement {
  const enabledSet = useFormStore((state) => state.derived.enabledSet)
  const [message, setMessage] = useState('')
  const previous = useRef<ReadonlySet<string> | null>(null)

  const announceable = useMemo(() => {
    const ids = new Set<string>()
    const visit = (list: NormalizedItem[]): void => {
      for (const item of list) {
        if (item.type !== 'group' && !item.hidden) ids.add(item.linkId)
        visit(item.children)
      }
    }
    visit(items)
    return ids
  }, [items])

  useEffect(() => {
    const before = previous.current
    previous.current = enabledSet
    if (before === null) return

    let added = 0
    let removed = 0
    for (const linkId of enabledSet) {
      if (!before.has(linkId) && announceable.has(linkId)) added += 1
    }
    for (const linkId of before) {
      if (!enabledSet.has(linkId) && announceable.has(linkId)) removed += 1
    }
    if (added === 0 && removed === 0) return

    const parts: string[] = []
    if (added > 0) parts.push(phrase(added, 'added'))
    if (removed > 0) parts.push(phrase(removed, 'removed'))
    setMessage(parts.join(', '))
  }, [enabledSet, announceable])

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
