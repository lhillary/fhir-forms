import { useMemo, type ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { useScore } from '../store/useFormStore'

export interface SeverityBand {
  min: number
  max: number
  label: string
}

interface ScorePanelProps {
  items: NormalizedItem[]
  bands?: readonly SeverityBand[] | undefined
}

export function ScorePanel({ items, bands }: ScorePanelProps): ReactElement {
  const score = useScore()
  const band = bands?.find(
    ({ min, max }) => score.total >= min && score.total <= max,
  )

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
      className="rounded-lg border border-line bg-panel p-4"
    >
      <h2 id="score-heading" className="text-lg font-semibold text-ink">
        Score
      </h2>
      <div aria-live="polite">
        <p className="mt-1 text-ink">Total score: {score.total}</p>
        {band !== undefined && (
          <p className="text-ink">Severity: {band.label}</p>
        )}
      </div>
      {score.byGroup !== undefined && (
        <ul className="mt-1 text-sm text-ink-muted">
          {Object.entries(score.byGroup).map(([linkId, groupScore]) => (
            <li key={linkId}>
              {groupText.get(linkId) ?? linkId}: {groupScore}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-line pt-3 text-sm text-ink-muted">
        This is a demonstration project. Scores shown here are{' '}
        <strong className="font-semibold">
          not for clinical, diagnostic, or treatment use
        </strong>
        .
      </p>
    </section>
  )
}
