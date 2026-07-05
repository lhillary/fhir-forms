import type { ReactElement } from 'react'
import type { FieldProps } from './fieldHelpers'

export function UnsupportedItem({ item }: FieldProps): ReactElement {
  const typeNote = item.rawType !== undefined ? ` (${item.rawType})` : ''
  return (
    <div className="rounded-md border border-dashed border-faint p-3">
      <p className="text-ink">{item.text ?? item.linkId}</p>
      <p className="text-sm text-ink-muted">
        Unsupported field type{typeNote} — this question cannot be answered
        here.
      </p>
    </div>
  )
}
