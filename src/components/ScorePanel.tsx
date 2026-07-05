import { useMemo, type ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { useScore } from '../store/useFormStore'

interface ScorePanelProps {
  items: NormalizedItem[]
}

export function ScorePanel({ items }: ScorePanelProps): ReactElement {
  const score = useScore()

  const groupText = useMemo(() => {
    const map = new Map<string, string>()
    const visit = (list: NormalizedItem[]): void => {
      for (const item of list) {
        if (item.type === 'group')
          map.set(item.linkId, item.text ?? item.linkId)
        visit(item.children)
      }
    }
    visit(items)
    return map
  }, [items])

  return (
    <section
      aria-labelledby="score-heading"
      className="rounded border border-gray-300 bg-gray-50 p-4"
    >
      <h2 id="score-heading" className="text-lg font-semibold text-gray-900">
        Score
      </h2>
      <p aria-live="polite" className="text-gray-900">
        Total score: {score.total}
      </p>
      {score.byGroup !== undefined && (
        <ul className="mt-1 text-sm text-gray-700">
          {Object.entries(score.byGroup).map(([linkId, groupScore]) => (
            <li key={linkId}>
              {groupText.get(linkId) ?? linkId}: {groupScore}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
